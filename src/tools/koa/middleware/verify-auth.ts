import { Context } from 'koa';
import type Koa from 'koa';
import jwt from 'jsonwebtoken';
import UserBaseInfo from '../../mongodb/users/baseInfo';
import { isString } from '../../variable-type';
import { failStatus } from '../../../constant';
import { secret_key } from '../../../env';
// import type { Secret } from 'jsonwebtoken'

// import * as Koa from "koa";

declare module 'koa' {
  interface Response {
    access_token: string;
  }
}
const verifyAuth = () => {
  return async function _verifyAuth(ctx: Context, next: Koa.Next) {
    const { authorization } = ctx.request.header;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      ctx.body = {
        status: failStatus,
        msg: '请提供授权凭证！',
      };
      ctx.status = 401;
      return;
    }
    const token = authorization.replace('Bearer ', '');
    try {
      const decode = jwt.verify(token, secret_key);
      if (!isString(decode)) {
        const { email, name, uuid, exp } = decode;
        const userBaseInfo = new UserBaseInfo();
        const data = await userBaseInfo.searchUserByEmail(email, ['uuid', 'name']);
        if (
          data?.name?.firstName === name?.firstName &&
          data?.name?.lastName === name?.lastName &&
          data?.uuid === uuid &&
          exp
        ) {
          // 校验1小时过期时间
          if (exp! - Date.now() > 1000 * 60 * 60) {
            // 不在有效期内
            const token = jwt.sign({ email, name, uuid }, secret_key, { expiresIn: '1h' });
            ctx.response['access_token'] = token;
            return await next();
          }
          // 校验48小时过期时间，如果过期时间大于48小时，就重新登录
          if (exp! - Date.now() > 1000 * 60 * 60 * 2) {
            ctx.redirect('/authentication');
            return;
          }
          return await next();
        } else {
          ctx.body = {
            status: failStatus,
            msg: '授权凭证不正确！',
          };
          ctx.status = 401;
          return;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return true;
  };
};

export default verifyAuth;
