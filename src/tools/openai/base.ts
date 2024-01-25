// import { AxiosRequestConfig } from 'axios';
// import { SocksProxyAgent } from 'socks-proxy-agent';
// import OpenAI from 'openai';
// import { openai_key, proxy } from '../../env';
// import { IncomingHttpHeaders } from 'http';
// import fetch from 'node-fetch';
// import { isObject } from '@marchyang/lib-core';
// import AutoToken from '../mongodb/setting/auto_token'
// import { awaitWrap } from '@marchyang/enhanced_promise';
// // import type { ChatCompletionCreateParamsBase } from 'openai'
// const httpsAgent = proxy && new SocksProxyAgent(proxy);
// interface Params {
//   apiKey?: string;
// }
// class IOpenAI {
//   openai: OpenAI;
//   protected axiosRequestConfig: AxiosRequestConfig;

//   constructor(params: Params) {
//     this.openai = new OpenAI({
//       apiKey: params.apiKey || openai_key,
//     });
//     Object.defineProperty(this, 'axiosRequestConfig', {
//       enumerable: true,
//       configurable: false,
//       writable: false,
//       value: {
//         httpsAgent,
//         httpAgent: httpsAgent,
//         proxy: false,
//       },
//     });
//   }

//   async chat() {

//   }
// }

// export default IOpenAI;

// interface Four_party_Token_Response_Fail {
//   message: 'Invalid token.'
// }
// interface Four_party_Token_Response_Success {
//   token: string
//   tokenMap: Record<string, string>
// }

// type Four_party_Token_Response = Four_party_Token_Response_Fail | Four_party_Token_Response_Success
// class CopilotAPI {
//   openai: OpenAI;
//   headers: IncomingHttpHeaders;
//   FOUR_PARTY_TOKEN?: string;
//   constructor(params: Params) {
//     console.log(params)
//     this.openai = new OpenAI({
//       apiKey: params.apiKey,
//       baseURL: 'https://api.githubcopilot.com/',
//     });
//     Object.defineProperty(this, 'headers', {
//       enumerable: true,
//       configurable: false,
//       writable: false,
//       value: {
//         'x-request-id': '7fb90f50-7554-49ed-b2bc-32d2ce4fa769',
//         'vscode-sessionid': '41e7ae1e-c04e-4610-9d10-2ecef3b3167e1704704928200',
//         'vscode-machineid': '4b01dcbd455bdb9b67e196b03672a81e9b7fd071a0df0a6bc6c27495e7c3b9e9',
//         'editor-version': 'vscode/1.84.2',
//         'editor-plugin-version': 'copilot-chat/0.10.1',
//         'openai-organization': 'github-copilot',
//         'openai-intent': 'conversation-panel',
//         'content-type': 'application/json',
//         'user-agent': 'GitHubCopilotChat/0.10.1',
//         accept: '*/*',
//       },
//     });
//   }
// }

// export { CopilotAPI };

// // 1705731258
