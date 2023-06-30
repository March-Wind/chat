import { Context } from 'koa';
import { isString } from '../../variable-type';
export const getClientIP = (ctx: Context) => {
  let ip =
    ctx.request.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
    ctx.request.ip ||
    ctx.request.socket.remoteAddress; // 判断后端的 socket 的 IP
  if (isString(ip)) {
    ip = ip.replace('::ffff:', '');
    return ip;
  }
  if (Array.isArray(ip)) {
    ip = ip[ip.length - 1];
    return ip;
  }
};
