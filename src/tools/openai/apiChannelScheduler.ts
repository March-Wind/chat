import OpenAI from 'openai';
import fetch from 'node-fetch';
import { randomString } from '../utils';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { awaitWrap, retry } from '@marchyang/enhanced_promise';
import { isObject } from '@marchyang/lib-core';
import { openai_key, proxy } from '../../env';
import AutoToken from '../mongodb/setting/auto_token';
import type { AutoTokenModel } from '../mongodb/setting/auto_token';
import type { RequestOptions } from 'openai/src/core';
import type { Model, Document } from 'mongoose';
const httpAgent = proxy ? new SocksProxyAgent(proxy) : undefined;

const exchangeCopilotToken = async (doc: AutoTokenModel) => {
  const autoTokenDB = new AutoToken();

  const url = doc.requestTokenUrl;
  return fetch(url, {
    headers: {
      Authorization: `token ${doc.key}`,
      ...{
        'Editor-Version': 'vscode/1.84.2',
        'Editor-Plugin-Version': 'copilot-chat/0.10.1',
      },
      ...{
        'editor-version': 'vscode/1.84.2',
        'editor-plugin-version': 'copilot/1.151.0',
        host: new URL(url).host,
        'user-agent': 'GithubCopilot/1.151.0',
        accept: '*/*',
      },
    },
  })
    .then((res: any) => {
      return res.json();
    })
    .then(async (result: Four_party_Token_Response) => {
      if (result && 'token' in result) {
        // to perfect 保存token到数据库时，错误处理
        const currentTime = new Date();
        // 增加10分钟
        currentTime.setMinutes(currentTime.getMinutes() + 10);

        await awaitWrap(autoTokenDB.updateOne(doc.key, { token: result.token, tokenExpiredTime: currentTime }));
        return { ...doc, token: result.token };
      }
      return Promise.reject(result);
    })
    .catch((err: Four_party_Token_Response_Fail | unknown) => {
      console.error('获取copilot token失败: ', err);
      // Internal Server Error.
      if (err && isObject(err) && 'message' in err && err.message === 'Invalid token.') {
        // token失效
      }
      return Promise.reject(err);
    })
    .finally(() => {
      autoTokenDB.close();
    });
};

interface Params {
  apiKey: string;
  headers?: Record<string, string>;
  key: string;
}

export class EncapsulatedOpenAI {
  openai: OpenAI;
  axiosRequestConfig: RequestOptions;

  constructor(params: Params) {
    this.openai = new OpenAI({
      apiKey: params.apiKey,
    });
    Object.defineProperty(this, 'axiosRequestConfig', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: {
        httpAgent,
      },
    });
  }
}

export class EncapsulatedCopilot {
  openai: OpenAI;
  axiosRequestConfig: RequestOptions;
  key: string;
  constructor(params: Params) {
    this.openai = new OpenAI({
      apiKey: params.apiKey,
      baseURL: 'https://api.githubcopilot.com/',
    });
    const requestId =
      randomString(8) + '-' + randomString(4) + '-' + randomString(4) + '-' + randomString(4) + '-' + randomString(12);
    const sessionid =
      randomString(8) + '-' + randomString(4) + '-' + randomString(4) + '-' + randomString(4) + '-' + randomString(25);
    Object.defineProperty(this, 'axiosRequestConfig', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: {
        // 'x-request-id': '7fb90f50-7554-49ed-b2bc-32d2ce4fa769',
        // 'vscode-sessionid': '41e7ae1e-c04e-4610-9d10-2ecef3b3167e1704704928200',
        // 'x-request-id': requestId,
        // 'vscode-sessionid': sessionid,
        // 'vscode-machineid': '4b01dcbd455bdb9b67e196b03672a81e9b7fd071a0df0a6bc6c27495e7c3b9e9',
        // 'editor-version': 'vscode/1.84.2',
        // 'editor-plugin-version': 'copilot-chat/0.10.1',
        // 'openai-organization': 'github-copilot',
        // 'openai-intent': 'conversation-panel',
        // 'content-type': 'application/json',
        // 'user-agent': 'GitHubCopilotChat/0.10.1',
        // accept: '*/*',
        headers: {
          ...params.headers,
          'x-request-id': requestId,
          'vscode-sessionid': sessionid,
        },
      },
    });
    Object.defineProperty(this, 'key', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: params.key,
    });
  }
  async updateCopilotTokenState(params?: { deleteTokenField?: boolean; rateLimiting?: boolean }) {
    const { deleteTokenField = false, rateLimiting = false } = params || {};
    const autoTokenDB = new AutoToken();
    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 3);
    await autoTokenDB.updateOne(this.key, {
      keyState: 'idle',
      ...(deleteTokenField ? { token: '' } : {}),
      ...(rateLimiting ? { rateLimiting: currentTime } : {}),
    });
    await autoTokenDB.close();
  }
}

interface Four_party_Token_Response_Fail {
  message: 'Invalid token.';
}
interface Four_party_Token_Response_Success {
  token: string;
  tokenMap: Record<string, string>;
}

type Four_party_Token_Response = Four_party_Token_Response_Fail | Four_party_Token_Response_Success;
type TokenInfo = Required<Pick<AutoTokenModel, 'key' | 'token'>> & Partial<Omit<AutoTokenModel, 'key' | 'token'>>;
class TokenDB {
  async getCopilotToken(): Promise<TokenInfo> {
    const autoTokenDB = new AutoToken();
    const [doc, docErr] = await awaitWrap(autoTokenDB.getIdleAutoToken());
    if (!doc || docErr) {
      await autoTokenDB.close().catch(console.error);
      return Promise.reject({ type: 'NO_ONE_OR_DB_ERROR' });
    }
    // 还在有效期内，直接使用
    if (doc.token && doc.tokenExpiredTime && doc.tokenExpiredTime.getTime() > Date.now()) {
      return doc as TokenInfo;
    }
    // 这里重试换token
    // return retry(() => exchangeCopilotToken(doc), { times: 2, delay: 500 }).catch(async (err) => {
    return exchangeCopilotToken(doc).catch(async (err) => {
      const currentTime = new Date();
      currentTime.setMinutes(currentTime.getMinutes() + 3);
      // 设置交换token的冷静期
      await autoTokenDB.updateOne(doc.key, { keyState: 'idle', exChangeTokenRestTime: currentTime });
      return Promise.reject(err);
    });
  }

  async getOpenaiToken(): Promise<
    Required<Pick<AutoTokenModel, 'key' | 'token'>> & Partial<Omit<AutoTokenModel, 'key' | 'token'>>
  > {
    return { key: 'openai', token: openai_key };
  }
}
class ApiChannelScheduler extends TokenDB {
  static queue = ['COPILOT_TOKEN', 'OPENAI_TOKEN'] as const;
  private channelMap: Map<
    (typeof ApiChannelScheduler.queue)[number],
    {
      tokenGetterFnName: keyof TokenDB;
      ApiCaller: typeof EncapsulatedOpenAI | typeof EncapsulatedCopilot;
    }
  > = new Map([
    ['COPILOT_TOKEN', { tokenGetterFnName: 'getCopilotToken', ApiCaller: EncapsulatedCopilot }],
    ['OPENAI_TOKEN', { tokenGetterFnName: 'getOpenaiToken', ApiCaller: EncapsulatedOpenAI }],
  ]);
  constructor() {
    super();
  }

  private async getIdleToken(): Promise<
    | {
        // channel: typeof ApiChannelScheduler.queue[number];
        tokenInfo: TokenInfo;
        ApiCaller: typeof EncapsulatedOpenAI | typeof EncapsulatedCopilot;
      }
    | undefined
  > {
    const _this = this;
    for (const channel of ApiChannelScheduler.queue) {
      const createInfo = this.channelMap.get(channel);
      if (!createInfo) {
        continue;
      }
      const { tokenGetterFnName, ApiCaller } = createInfo;
      const fn = this[tokenGetterFnName];
      if (!fn) {
        continue;
      }
      // 换取token出错，数据库出错，等等会再重试
      const getTokenInfo = retry(() => fn.call(_this), {
        times: 4,
        async assessment(type, data) {
          if (type === 'catch') {
            if (data?.type === 'NO_ONE_OR_DB_ERROR') {
              // 当前没有可用的token或者数据库报错时
              return false;
            }
            // 重试四次是，可以遍历所有的key
            return true;
          }
          return false;
        },
      });
      const [tokenInfo] = await awaitWrap(getTokenInfo);
      if (tokenInfo) {
        return {
          // channel,
          tokenInfo,
          ApiCaller,
        };
      }
      continue;
    }
  }

  async returnAPICaller() {
    const [hitInfo] = await awaitWrap(this.getIdleToken());
    if (!hitInfo) {
      // to prefect
      throw new Error('没有可用的token');
    }
    const { tokenInfo, ApiCaller } = hitInfo;
    return new ApiCaller({
      apiKey: tokenInfo.token,
      key: tokenInfo.key,
      headers: tokenInfo.headers,
    });
  }
}

const apiChannelScheduler = new ApiChannelScheduler();

export default apiChannelScheduler;
