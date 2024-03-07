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
  {
    key: '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',
    requestTokenUrl: 'https://api.github.com/copilot_internal/v2/token',
    startTime: '2024-03-06',
    estimatedEndTime: '2025-03-6',
    headers: { ...defaultHeaders, 'vscode-machineid': randomString(64) },
  },
  {
    key: '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',
    requestTokenUrl: 'https://api.github.com/copilot_internal/v2/token',
    startTime: '2024-03-06',
    estimatedEndTime: '2025-03-6',
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
