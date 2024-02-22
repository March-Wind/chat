import jwt from 'jsonwebtoken';
import Router from '@koa/router';
import UserBase from '../../../tools/mongodb/users/baseInfo';
import type { BaseInfoSchema } from '../../../tools/mongodb/users/baseInfo';
import awaitWrap from '../../../tools/await-wrap';
import { secret_key } from '../../../env';
import { successStatus, failStatus } from '../../../constant';
import { isString } from '../../../tools/variable-type';
import { verifyAuth } from '../../../tools/koa/middleware/verify-auth';
import type { Secret } from 'jsonwebtoken';
type Body = Pick<BaseInfoSchema, 'email' | 'password'>;

const checkAuth = verifyAuth();

const loginUser = (router: Router) => {
  // 登录接口
  router.post('/queryUserInfo', checkAuth, async (ctx, next) => {
    const uuid = ctx.uuid;

    const useBase = new UserBase();
    const [userInfo, userInfoErr] = await awaitWrap(useBase.queryUserByUuid(uuid));
    if (userInfoErr) {
      ctx.body = {
        status: failStatus,
        msg: userInfoErr,
      };
      ctx.status = 500;
      return;
    }
    if (!userInfo) {
      ctx.body = {
        status: failStatus,
        data: '没有找到用户信息！',
      };
      ctx.status = 200;
      return;
    }
    const data = UserBase.transform(userInfo);
    const resultInfo = {
      tokens: data.tokens,
      name: data.name,
      email: data.email,
    };
    ctx.body = {
      status: successStatus,
      msg: '登录成功',
      data: resultInfo,
    };
    ctx.status = 200;
    return await next();
  });
};

export default loginUser;
