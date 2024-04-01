import AutoToken, { defaultHeaders } from '../tools/mongodb/setting/auto_token';
import type { InsetItemType } from '../tools/mongodb/setting/auto_token';
import { randomString } from '../tools/utils';
const keys: InsetItemType[] = [
  // {
  //   key: '6rq7FePnQgE2CgcXCztMCkV2BxR/OkJ6MAoHEAVGPAkyfHEYDUVMSnB5dUVtbQ==',
  //   requestTokenUrl: 'http://175.24.175.14:18081/copilot/token/897D476862D844B98B1D408EF132B80F',
  //   startTime: '2023-11-01',
  //   estimatedEndTime: '2024-11-01',
  // },
  // {
  //   key: 'I2Y2tINHAUEUNDEpNjcPSmdIMSpCNgE6EjQxLjhKf0kQQkcmMElwSnpCcVdORw==',
  //   requestTokenUrl: 'http://175.24.175.14:18081/copilot/token/897D476862D844B98B1D408EF132B80F',
  //   startTime: '2023-11-01',
  //   estimatedEndTime: '2024-11-01',
  //   headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  // },
  // {
  //   key: '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',
  //   requestTokenUrl: 'https://api.github.com/copilot_internal/v2/token',
  //   startTime: '2024-03-06',
  //   estimatedEndTime: '2025-03-6',
  //   headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  // },
  // 授权密钥：X9J8C47NO7TM0VFEP6ZPPTOG
  // 使用文档: https://www.kdocs.cn/l/ceIxyd0Ki1t6?openfrom=docs
  // 授权密钥：X9J8C47NO7TM0VFEP6ZPPTOG
  // 使用文档: https://www.kdocs.cn/l/ceIxyd0Ki1t6?openfrom=docs
  // curl -H 'authorization: token ghu_N3Z1AAiTFBMQrLIG_GzYFUdKss7Oyo9TID1MkNQq228Ie8Udv4DzLw' -H 'editor-version: vscode/1.86.2' -H 'editor-plugin-version: copilot/1.172.0' -H 'host: 119.45.194.195:50000' -H 'user-agent: GithubCopilot/1.172.0' -H 'accept: */*' --compressed 'http://119.45.194.195:50000/copilot_internal/v2/token'
  // {
  //   key: 'ghu_N3Z1AAiTFBMQrLIG_GzYFUdKss7Oyo9TID1MkNQq228Ie8Udv4DzLw',
  //   requestTokenUrl: 'http://119.45.194.195:50000/copilot_internal/v2/token',
  //   tokenType: 'copilot',
  //   startTime: '2024-01-26',
  //   estimatedEndTime: '2100-01-26', // 一年
  //   headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  // },
  // {
  //   key: 'ghu_mo31n4ve4Nrs4L7Qk2sP7m1m_d3U-aGOO-csVHd-yGTxp7yyzFBnWw',
  //   tokenType: 'copilot',
  //   requestTokenUrl: 'http://123.207.0.93/copilot_internal/v2/token',
  //   startTime: '2024-03-06',
  //   estimatedEndTime: '2025-03-6', // 一年
  //   headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  // },
  {
    tokenType: 'copilot',
    startTime: '2024-04-1', // 一个月
    estimatedEndTime: '2024-5-1',
    key: 'tb2gq90w8qo4ef8urg9rrdqb2ria97nm',
    requestTokenUrl: 'https://codex.micosoft.icu/copilot_internal/v2/token',
    requestTokenHeaders: {
      'editor-version': 'vscode/1.87.0',
      'editor-plugin-version': 'copilot/1.172.0',
      host: 'codex.micosoft.icu',
      'user-agent': 'GithubCopilot/1.172.0',
      accept: '*/*',
      'x-auth-token': 'user:722/fba97df2952445039052c94c5b00441a',
    },

    origin: 'https://codex.micosoft.icu',
    headers: {
      // 'authorization': 'Bearer user:722/fba97df2952445039052c94c5b00441a',
      // 'x-request-id': 'faa2d6c0-d3e2-4d0f-839a-dd5d161c30ca',
      // 'vscode-sessionid': '8e2b1ac6-01e8-42e8-86fc-eb9b13181e141711680769072',
      'x-github-api-version': '2023-07-07',
      'openai-organization': 'github-copilot',
      'copilot-integration-id': 'vscode-chat',
      'editor-version': 'vscode/1.87.0',
      'editor-plugin-version': 'copilot-chat/0.13.1',
      'openai-intent': 'conversation-panel',
      'content-type': 'application/json',
      host: 'codex.micosoft.icu',
      'user-agent': 'GitHubCopilotChat/0.13.1',
      accept: '*/*',
      'x-auth-token': 'user:722/fba97df2952445039052c94c5b00441a',
      'vscode-machineid': randomString(64),
    },
  },
  {
    tokenType: 'copilot',
    startTime: '2024-04-1', // 一个月
    estimatedEndTime: '2024-5-1',
    key: 'gho_yfjmn0sl02lvzv5sg69yiot9wkvmrw2mfbko',
    requestTokenUrl: 'https://codex.micosoft.icu/copilot_internal/v2/token',
    requestTokenHeaders: {
      'editor-version': 'vscode/1.87.0',
      'editor-plugin-version': 'copilot/1.172.0',
      host: 'codex.micosoft.icu',
      'user-agent': 'GithubCopilot/1.172.0',
      accept: '*/*',
      'x-auth-token': 'user:1295/851db66ef8134b98b30ebf32cbc962d2',
    },

    origin: 'https://codex.micosoft.icu',
    headers: {
      // 'authorization': 'Bearer user:722/fba97df2952445039052c94c5b00441a',
      // 'x-request-id': 'faa2d6c0-d3e2-4d0f-839a-dd5d161c30ca',
      // 'vscode-sessionid': '8e2b1ac6-01e8-42e8-86fc-eb9b13181e141711680769072',
      'x-github-api-version': '2023-07-07',
      'openai-organization': 'github-copilot',
      'copilot-integration-id': 'vscode-chat',
      'editor-version': 'vscode/1.87.0',
      'editor-plugin-version': 'copilot-chat/0.13.1',
      'openai-intent': 'conversation-panel',
      'content-type': 'application/json',
      host: 'codex.micosoft.icu',
      'user-agent': 'GitHubCopilotChat/0.13.1',
      accept: '*/*',
      'x-auth-token': 'user:1295/851db66ef8134b98b30ebf32cbc962d2',
      'vscode-machineid': randomString(64),
    },
  },
  {
    tokenType: 'copilot',
    startTime: '2024-01-26',
    estimatedEndTime: '2025-01-26', // 1年
    key: 'NzYyOC5iYjNhNDlkZTQyZTM4NzE5NzFjMzU4NDk2MGZlMThkNQ==',
    requestTokenUrl: 'http://124.220.157.23:8800/copilot_internal/v2/token',
    requestTokenHeaders: {
      ...{
        'Editor-Version': 'vscode/1.84.2',
        'Editor-Plugin-Version': 'copilot-chat/0.10.1',
      },
      ...{
        'editor-version': 'vscode/1.84.2',
        'editor-plugin-version': 'copilot/1.151.0',
        host: '124.220.157.23:8800',
        'user-agent': 'GithubCopilot/1.151.0',
        accept: '*/*',
      },
    },
    origin: 'https://api.githubcopilot.com',
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },
  {
    tokenType: 'copilot',
    startTime: '2024-01-26',
    estimatedEndTime: '2025-01-26', // 1年
    key: 'NzYyOC43NWQyN2RhNjkwZjFkMmE1ZDJmMDRiYTMwN2U2YzQ4NQ==',
    requestTokenUrl: 'http://124.220.157.23:8800/copilot_internal/v2/token',
    requestTokenHeaders: {
      ...{
        'Editor-Version': 'vscode/1.84.2',
        'Editor-Plugin-Version': 'copilot-chat/0.10.1',
      },
      ...{
        'editor-version': 'vscode/1.84.2',
        'editor-plugin-version': 'copilot/1.151.0',
        host: '124.220.157.23:8800',
        'user-agent': 'GithubCopilot/1.151.0',
        accept: '*/*',
      },
    },
    origin: 'https://api.githubcopilot.com',
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },
  {
    tokenType: 'copilot',
    startTime: '2024-01-26',
    estimatedEndTime: '2100-01-26', // 号称永久有效
    key: 'MTkxNy40MGRhYTk0MThhZmVkOGRjNDRmOTZjNzBkZDQzMDIyZQ==',
    requestTokenUrl: 'http://124.220.157.23:8800/copilot_internal/v2/token',
    requestTokenHeaders: {
      ...{
        'Editor-Version': 'vscode/1.84.2',
        'Editor-Plugin-Version': 'copilot-chat/0.10.1',
      },
      ...{
        'editor-version': 'vscode/1.84.2',
        'editor-plugin-version': 'copilot/1.151.0',
        host: '124.220.157.23:8800',
        'user-agent': 'GithubCopilot/1.151.0',
        accept: '*/*',
      },
    },
    origin: 'https://api.githubcopilot.com',
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },

  {
    tokenType: 'copilot',
    startTime: '2024-01-26',
    estimatedEndTime: '2100-01-26', // 号称永久有效
    key: 'MTkxNy44MDY0Nzk0NjBhNzViMDQ4YzlkZGRkNDliYmY2MzI0Mg==',
    requestTokenUrl: 'http://124.220.157.23:8800/copilot_internal/v2/token',
    requestTokenHeaders: {
      ...{
        'Editor-Version': 'vscode/1.84.2',
        'Editor-Plugin-Version': 'copilot-chat/0.10.1',
      },
      ...{
        'editor-version': 'vscode/1.84.2',
        'editor-plugin-version': 'copilot/1.151.0',
        host: '124.220.157.23:8800',
        'user-agent': 'GithubCopilot/1.151.0',
        accept: '*/*',
      },
    },
    origin: 'https://api.githubcopilot.com',
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },
  {
    tokenType: 'transfer',
    startTime: '2024-01-26',
    estimatedEndTime: '2100-01-26', // 用完为止
    key: 'transfer1',
    requestTokenUrl: '',
    token: 'ak-JRZ97gl33ArvhDKbv4Qr4c3ZWWKnSoEAhFSlEuzXilBzcufl',
    origin: 'https://api.appsiri.cn',
  },
];

const exec = async (data: InsetItemType[]) => {
  const autoToken = new AutoToken();
  await autoToken.insertMany(data).catch((err) => {
    console.log(err);
  });
  await autoToken.close();
  console.log('完成！');
};

exec(keys);
