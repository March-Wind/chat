import OpenAI from 'openai';
import fetch from 'node-fetch';
import { randomString } from '../utils';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { isObject } from '@marchyang/lib-core';
import { awaitWrap } from '@marchyang/enhanced_promise';
import { openai_key, proxy } from '../../env';
import AutoToken from '../mongodb/setting/auto_token';
import type { AutoTokenModel } from '../mongodb/setting/auto_token';
import type { RequestOptions } from 'openai/src/core';

const httpAgent = proxy ? new SocksProxyAgent(proxy) : undefined;

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
  async updateCopilotTokenState() {
    const autoTokenDB = new AutoToken();
    await autoTokenDB.updateOne(this.key, { keyState: 'idle' });
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

class TokenDB {
  async getCopilotToken() {
    const autoTokenDB = new AutoToken();
    const [doc, docErr] = await awaitWrap(autoTokenDB.getIdleAutoToken());
    console.log('doc', doc);
    if (!doc || docErr) {
      return Promise.reject();
    }
    // to do 这里可以优化，可以根据token的有效期来判断是否需要重新获取token
    const url = 'http://175.24.175.14:18081/copilot/token/897D476862D844B98B1D408EF132B80F';
    return fetch(url, {
      headers: {
        Authorization: `token ${doc.key}`,
        ...{ 'Editor-Version': 'vscode/1.84.2', 'Editor-Plugin-Version': 'copilot-chat/0.10.1' },
        ...{
          'editor-version': 'vscode/1.84.2',
          'editor-plugin-version': 'copilot/1.136.0',
          host: '175.24.175.14:18081',
          'user-agent': 'GithubCopilot/1.136.0',
          accept: '*/*',
        },
      },
    })
      .then((res: any) => {
        return res.json();
      })
      .then(async (result: Four_party_Token_Response) => {
        console.log('result', result);
        if (result && 'token' in result) {
          // to perfect 保存token到数据库时，错误处理
          await awaitWrap(autoTokenDB.updateOne(doc.key, { token: result.token }));
          return { ...doc, token: result.token };
        }
        return Promise.reject(result);
      })
      .catch((err: Four_party_Token_Response_Fail | unknown) => {
        // Internal Server Error.
        if (err && isObject(err) && 'message' in err && err.message === 'Invalid token.') {
          // token失效
        }
        return Promise.reject(err);
      })
      .finally(async () => {
        await autoTokenDB.close();
      });
  }

  async getOpenaiToken() {
    return { key: 'openai', token: openai_key };
  }
}
class ApiChannelScheduler extends TokenDB {
  static queue = ['COPILOT_TOKEN', 'OPENAI_TOKEN'] as const;
  // eslint-disable-next-line no-use-before-define
  private channelMap: Map<
    (typeof ApiChannelScheduler.queue)[number],
    { tokenGetterFnName: keyof TokenDB; ApiCaller: typeof EncapsulatedOpenAI | typeof EncapsulatedCopilot }
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
        tokenInfo: Required<Pick<AutoTokenModel, 'key' | 'token'>> & Partial<Omit<AutoTokenModel, 'key' | 'token'>>;
        ApiCaller: typeof EncapsulatedOpenAI | typeof EncapsulatedCopilot;
      }
    | undefined
  > {
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
      const [tokenInfo] = await awaitWrap(fn.call(this));
      if (tokenInfo) {
        console.log('tokenInfo', tokenInfo.key);
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
    return new ApiCaller({ apiKey: tokenInfo.token, key: tokenInfo.key, headers: tokenInfo.headers });
  }
}

const apiChannelScheduler = new ApiChannelScheduler();

export default apiChannelScheduler;
