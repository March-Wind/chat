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
  {
    key: 'ghu_mo31n4ve4Nrs4L7Qk2sP7m1m_d3U-aGOO-csVHd-yGTxp7yyzFBnWw',
    requestTokenUrl: 'http://123.207.0.93/copilot_internal/v2/token',
    startTime: '2024-03-06',
    estimatedEndTime: '2025-03-6', // 一年
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },

  {
    key: 'NzYyOC5iYjNhNDlkZTQyZTM4NzE5NzFjMzU4NDk2MGZlMThkNQ==',
    requestTokenUrl: 'http://124.220.157.23:8800/copilot_internal/v2/token',
    startTime: '2024-01-26',
    estimatedEndTime: '2025-01-26', // 1年
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },
  {
    key: 'NzYyOC43NWQyN2RhNjkwZjFkMmE1ZDJmMDRiYTMwN2U2YzQ4NQ==',
    requestTokenUrl: 'http://124.220.157.23:8800/copilot_internal/v2/token',
    startTime: '2024-01-26',
    estimatedEndTime: '2025-01-26', // 1年
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },
  // 授权密钥：X9J8C47NO7TM0VFEP6ZPPTOG
  // 使用文档: https://www.kdocs.cn/l/ceIxyd0Ki1t6?openfrom=docs
  // curl -H 'authorization: token ghu_N3Z1AAiTFBMQrLIG_GzYFUdKss7Oyo9TID1MkNQq228Ie8Udv4DzLw' -H 'editor-version: vscode/1.86.2' -H 'editor-plugin-version: copilot/1.172.0' -H 'host: 119.45.194.195:50000' -H 'user-agent: GithubCopilot/1.172.0' -H 'accept: */*' --compressed 'http://119.45.194.195:50000/copilot_internal/v2/token'
  {
    key: 'ghu_N3Z1AAiTFBMQrLIG_GzYFUdKss7Oyo9TID1MkNQq228Ie8Udv4DzLw',
    requestTokenUrl: 'http://119.45.194.195:50000/copilot_internal/v2/token',
    startTime: '2024-01-26',
    estimatedEndTime: '2100-01-26', // 一年
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },
  {
    key: 'MTkxNy40MGRhYTk0MThhZmVkOGRjNDRmOTZjNzBkZDQzMDIyZQ==',
    requestTokenUrl: 'http://124.220.157.23:8800/copilot_internal/v2/token',
    startTime: '2024-01-26',
    estimatedEndTime: '2100-01-26', // 号称永久有效
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },
  {
    key: 'MTkxNy44MDY0Nzk0NjBhNzViMDQ4YzlkZGRkNDliYmY2MzI0Mg==',
    requestTokenUrl: 'http://124.220.157.23:8800/copilot_internal/v2/token',
    startTime: '2024-01-26',
    estimatedEndTime: '2100-01-26', // 号称永久有效
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
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
