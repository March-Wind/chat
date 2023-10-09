import Koa from 'koa';
import cors from 'koa2-cors';
import bodyParser from 'koa-bodyparser';
import router from './createRoutes';
import { userTemporaryStore } from './tools/mongodb/setting/user-temporary';

// 洋葱圈模型，如果每个组件都 await next();就能保证洋葱圈顺序，如果想做非阻塞的程序，就不要await就行了。参考/chat的api里请求外部接口就是异步的，非阻塞的。可能中间件都走完了，请求外部接口还没返回，这样就不影响后面的中间件执行了。
const app = new Koa();
// app.keys = ['wuli'];
// app.use(session({
//   store: new SessionStore({
//     dbName: 'settings',
//     collectionName: 'sessions',
//     uri: 'mongodb://localhost:27017/settings'
//   }),
//   externalKey: {
//     // get: async (ctx) => {
//     get: (ctx) => {
//       const authorization = ctx.request.header['authorization'];
//       if (!authorization) {
//         return '';
//       }
//       const token = authorization.replace('Bearer ', '');
//       try {
//         const userInfo = jwt.decode(token);
//         if (isObject(userInfo)) {
//           return userInfo.id
//         } else {
//           return ''
//         }
//       } catch (error) {
//         return ''
//       }
//       // const session = await app.sessionStore.get(key);
//       // return session ? session.externalKey : null;
//     },
//     // set: async (key, externalKey) => {
//     set: (ctx, value) => {
//       console.log(ctx, value)
//       debugger
//       // const session = await app.sessionStore.get(key);
//       // if (session) {
//       //   session.externalKey = externalKey;
//       //   await app.sessionStore.set(key, session);
//       // }
//     },
//   },
// }, app));

app.use(
  cors({
    // withCredentials为true时，Access-Control-Allow-Origin不能为*，需要指定具体的域名
    origin: (ctx) => {
      // const clientIp = getClientIP(ctx);
      // 区分本地和线上环境process.env.NODE_ENV === 'development'
      if (ctx.request.headers.origin === 'http://localhost:4000') {
        // return true;
        return 'http://localhost:4000';
      }
      if (ctx.request.headers.origin === 'http://127.0.0.1:4000') {
        // return true;
        return 'http://127.0.0.1:4000';
      }
      return false;
    }, // 允许所有来源的请求访问
    // origin: 'http://localhost:4000',
    // origin: '*',  // 允许所有来源的请求访问
    maxAge: 86400, // 有效期为1天
    credentials: true, // 允许发送cookie
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 设置允许的HTTP请求方法
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'], // 设置允许的HTTP请求头
    exposeHeaders: ['Access_Token'], // 暴露给js访问的headers
  }),
);
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Headers', 'Access_Token,Keep-Alive,Date');
  ctx.set('Access-Control-Expose-Header', 'Access_Token');
  await next();
});
app.use(userTemporaryStore(app));
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());
app.listen(4001);

// import path from 'path';
// import { parsePDF } from './tools/parse-pdf';
// const filePath = path.resolve(process.cwd(), 'src/assets/finance.pdf')
// // 获取到pdf的文字
// const text = await parsePDF(filePath)

// const require = createRequire(import.meta.url)
// import tiktoken, { Tiktoken } from "@dqbd/tiktoken/lite";
// import { load } from "@dqbd/tiktoken/load";
// // import registry from "@dqbd/tiktoken/registry.json";
// // import models from "@dqbd/tiktoken/model_to_encoding.json";
// const registry = require("@dqbd/tiktoken/registry.json")
// const models = require("@dqbd/tiktoken/model_to_encoding.json")
// import { createRequire } from "module";

// type Model = typeof models;
// type ModalKeys = keyof Model;
// type Registry = typeof registry;
// type RegistryKeys = keyof Registry;

// async function main() {

//   //
//   const encoderType: RegistryKeys = models["gpt-3.5-turbo" as ModalKeys] as RegistryKeys;
//   const model = await load(registry[encoderType]);
//   const encoder = new Tiktoken(
//     model.bpe_ranks,
//     model.special_tokens,
//     model.pat_str
//   );
//   const tokens = encoder.encode(`下游多点开花，未来空间可期：1）半导体零部件：美国联合日荷对我国
//   半导体产业链限制日益加剧，设备/零部件/材料国产替代进程有望加速。等
//   离子体刻蚀（PlasmaEtch）、增强气相沉积（PECVD）、气相清洗等设备所
//   用射频电源中的真空电容器当前由日本明电舍、瑞士 comet 主导，壁垒高
//   格局好。公司深耕数年实现突破，性能参数可匹敌国外厂商且成本较低，
//   已导入头部设备/零部件厂，当前全球份额低，未来有望助力国产替代，实
//   现数倍增长。2）新能源车：高压快充趋势下，主回路接触器真空化大势所
//   趋，公司凭借数十年技术沉淀成功导入下游头部客户，与特斯拉合作也在
//   推进中。公司在手及意向订单充沛，产能是主要瓶颈，随着未来可转债项
//   目 648 万只直流接触器项目落地，有望助力业绩快速释放。3）风光储：高
//   压大功率趋势下，直交流侧均带来真空接触器需求，公司已实现向头部逆
//   变器客户批量供货，更多大客户也在开拓中。未来可转债项目将新增 165
//   万只年产能，有力支撑订单兑现。4）其他：特种装备卡位放量，潜力巨大；
//   有源器件助力核心大科学项目，彰显真空技术实力。`);
//   // (new TextDecoder()).decode(encoder.decode(tokens))
//   encoder.free();
// }
// main();
