import AutoToken, { defaultHeaders } from '../tools/mongodb/setting/auto_token';
import type { InsetItemType } from '../tools/mongodb/setting/auto_token';
import { randomString } from '../tools/utils';
const keys: InsetItemType[] = [
  {
    key: '6rq7FePnQgE2CgcXCztMCkV2BxR/OkJ6MAoHEAVGPAkyfHEYDUVMSnB5dUVtbQ==',
    startTime: '2023-11-01',
    estimatedEndTime: '2024-11-01',
  },
  {
    key: 'I2Y2tINHAUEUNDEpNjcPSmdIMSpCNgE6EjQxLjhKf0kQQkcmMElwSnpCcVdORw==',
    startTime: '2023-11-01',
    estimatedEndTime: '2024-11-01',
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
