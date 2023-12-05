import { Context } from 'koa';
import type Koa from 'koa';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import UserBaseInfo from '../../mongodb/users/baseInfo';
import { isObject, isString } from '../../variable-type';
import { failStatus, loginAgain } from '../../../constant';
import { secret_key } from '../../../env';
import awaitWrap from '../../await-wrap';
declare module 'koa' {
  interface Context {
    uuid: string; // 这里的类型可以根据您的需求进行更改
  }
  interface Response {
    access_token?: string;
  }
}

const validateType = (params: any) => {
  const userInfo = new UserBaseInfo();
  return userInfo.checkParamsType(params, ['email', 'name', 'uuid']);
};
const validateUser = async (params: JwtPayload) => {
  const { email, name, uuid } = params;
  const userBaseInfo = new UserBaseInfo();
  const data = await userBaseInfo.searchUserByEmail(email, ['uuid', 'name']);
  const flag =
    data?.name?.firstName === name?.firstName && data?.name?.lastName === name?.lastName && data?.uuid === uuid;
  await userBaseInfo.close();
  return flag;
};
const errBody = (ctx: Context, msg: string) => {
  ctx.body = {
    status: failStatus,
    msg,
  };
  ctx.status = 401;
};
const verifyAuth = () => {
  return async function _verifyAuth(ctx: Context, next: Koa.Next) {
    const { authorization } = ctx.request.header;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      errBody(ctx, '请提供授权凭证！');
      return;
    }
    const token = authorization.replace('Bearer ', '');
    //先验证,再decode
    try {
      const legal = jwt.verify(token, secret_key);
      if (isObject(legal)) {
        // 这里认为是有效的
        const userInfo = legal;
        const typeErr = validateType(userInfo);
        if (typeErr) {
          errBody(ctx, '请提供合法的授权凭证！');
          return;
        }
        const [flag, err] = await awaitWrap(validateUser(userInfo));
        if (err) {
          errBody(ctx, '鉴权失败，请稍后再试~');
          return;
        }
        if (!flag) {
          errBody(ctx, '不正确的授权凭证！');
          return;
        }
        ctx.uuid = userInfo.uuid;
      } else {
        // 不知道legal是string是什么情况
        errBody(ctx, '请提供合法的授权凭证！');
        return;
      }
    } catch (error: any) {
      // 时间过期
      if (error?.message === 'jwt expired') {
        const user = jwt.decode(token);
        if (isObject(user)) {
          // 依然需要校验
          const typeErr = validateType(user);
          if (typeErr) {
            errBody(ctx, '请提供合法的授权凭证！');
            return;
          }
          const [flag, err] = await awaitWrap(validateUser(user));
          if (err) {
            errBody(ctx, '鉴权失败，请稍后再试~');
            return;
          }
          if (!flag) {
            errBody(ctx, '不正确的授权凭证！');
            return;
          }
          // 重新签发或者重新登录
          const { email, name, uuid, exp, id } = user;
          const now = new Date().getTime();
          if (now / 1000 - exp! > 60 * 60 * 72) {
            // 3天就重新登录
            // ctx.redirect('/authentication');
            ctx.body = {
              status: loginAgain,
              msg: '授权凭证已过期，请重新登录！',
            };
            ctx.status = 403;
            return;
          } else {
            ctx.uuid = uuid;
            const _token = jwt.sign({ email, name, uuid, id }, secret_key, { expiresIn: '1h' });
            ctx.set('access_token', _token);
            ctx.set('Access-Control-Allow-Headers', 'Access_Token,Keep-Alive');
          }
        }
      } else {
        errBody(ctx, '请提供合法的授权凭证！');
        return;
      }
    }
    return await next();
  };
};

export default verifyAuth;
