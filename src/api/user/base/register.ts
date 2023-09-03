import Router from '@koa/router';
import UserBase from '../../../tools/mongodb/users/baseInfo';
import Fingerprint from '../../../tools/mongodb/users/fingerprint';
import awaitWrap from '../../../tools/await-wrap';
import { v4 as uuidV4 } from 'uuid';
import { successStatus, failStatus } from '../../../constant';
import type { BaseInfoSchema } from '../../../tools/mongodb/users/baseInfo';
import type { FingerprintSchema } from '../../../tools/mongodb/users/fingerprint';
type UserSchema = BaseInfoSchema & FingerprintSchema;
// 检验类型以防止noSQL注入
const validateType = (user: UserSchema) => {
  const userBase = new UserBase();
  return userBase.checkParamsType(user);
};

const process = async (user: UserSchema) => {
  const typeErr = validateType(user);
  if (typeErr) {
    return Promise.reject('参数不合法!');
  }

  const userBase = new UserBase();

  // 检查用户名是否已经存在
  const { fingerComponents, ...baseInfo } = user;
  const { email } = baseInfo;
  const data = await userBase.searchUserByEmail(email);
  if (data) {
    return Promise.reject('用户已存在');
  }
  // // 将排名数字作为uid
  // const uid = await userBase.countUser();
  // 随机uuid作为用户唯一标识，因为后面可能要分布式，也不想暴露用户数量和顺序。
  const uuid = uuidV4();

  const fingerprint = new Fingerprint();
  // 将用户注册信息放进数据库
  const [, err] = await awaitWrap(
    Promise.all([
      userBase.insertUser({ ...baseInfo, uuid }),
      fingerprint.insertFingerPrint({ uuid, fingerComponents }),
    ]),
  );
  if (err) {
    return Promise.reject(err);
  }
  userBase.close();
  return Promise.resolve('注册成功');
};

const registerUser = async (router: Router) => {
  // 注册接口
  router.post('/register', async (ctx, next) => {
    const user: UserSchema = ctx.request.body as UserSchema;
    const [data, err] = await awaitWrap(process(user));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: err,
      };
      ctx.status = 400;
    } else {
      ctx.body = {
        status: successStatus,
        msg: data,
      };
    }
    return await next();
  });
};
export default registerUser;
