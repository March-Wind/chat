import { Context } from 'koa';
import type Koa from 'koa';
import UserBaseInfo from '../../mongodb/users/baseInfo';
import { isString } from '@marchyang/lib-core';
import { failStatus, remindRecharge, loginAgain } from '../../../constant';
import { awaitWrap } from '@marchyang/enhanced_promise';
declare module 'koa' {
  interface Context {
    uuid: string; // 这里的类型可以根据您的需求进行更改
  }
  interface Response {
    access_token?: string;
  }
}

const errBody = (ctx: Context, status: number, msg: string) => {
  ctx.body = {
    status,
    msg,
  };
};
const verifyTokens = () => {
  return async function _verifyTokens(ctx: Context, next: Koa.Next) {
    const uuid = ctx.uuid;
    if (!isString(uuid)) {
      errBody(ctx, failStatus, '请提供授权凭证来获取您的tokens数量！');
      ctx.status = 401;
      return;
    }
    const userBaseInfo = new UserBaseInfo();
    const [tokens, tokensErr] = await awaitWrap(userBaseInfo.queryTokens(uuid));
    if (tokensErr) {
      errBody(ctx, failStatus, '获取tokens失败，请稍后再试~');
      ctx.status = 401;
      return;
    }
    if (tokens === undefined || tokens === null) {
      errBody(ctx, failStatus, '未找到用户对应信息！');
      ctx.status = 401;
      return;
    }
    if (tokens <= 0) {
      errBody(ctx, remindRecharge, 'token数量不足，请充值后再使用~');
      ctx.status = 403;
      return;
    }
    return await next();
  };
};

export default verifyTokens;
