// import dotenv from 'dotenv';
// dotenv.config()
import Koa from 'koa';
import cors from 'koa2-cors';
import bodyParser from 'koa-bodyparser';
import router from './createRoutes';
// import { getClientIP } from './tools/koa/middleware/get-client-ip';

// 洋葱圈模型，如果每个组件都 await next();就能保证洋葱圈顺序，如果想做非阻塞的程序，就不要await就行了。参考/chat的api里请求外部接口就是异步的，非阻塞的。可能中间件都走完了，请求外部接口还没返回，这样就不影响后面的中间件执行了。
const app = new Koa();
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
// app.use(async (ctx, next) => {
//   ctx.set('Access-Control-Allow-Headers', 'Access_Token,Keep-Alive,Date')
//   ctx.set('Access-Control-Expose-Header', 'Access_Token')

//   await next();
// })
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());
app.listen(4001);
console.log('开始监听');
// console.log(222, process.env.SOCKS_PROCY)
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

// import wasm from "@dqbd/tiktoken/lite/tiktoken_bg.wasm";
// import model from "@dqbd/tiktoken/encoders/cl100k_base.json";
// import { init, Tiktoken } from "@dqbd/tiktoken/lite/init";

// export const config = { runtime: "edge" };

// async function as() {
//   await init((imports) => WebAssembly.instantiate(wasm, imports));

//   const encoding = new Tiktoken(
//     model.bpe_ranks,
//     model.special_tokens,
//     model.pat_str
//   );

//   const tokens = encoding.encode("hello world");
//   encoding.free();

//   console.log(11, tokens)
// }

// as();

// import HistoryMessage from "./tools/mongodb/users/history-message";

// const uuid = '44fe00b3-1214-4294-813c-3c1d4046fbab';

// const historyDb = new HistoryMessage({ uuid });
// debugger
// // const data = await historyDb.addTopic({ messages: [{ role: 'user', content: '1' }] })
// // const id = '64d3344d46c84cc4b3ec3a22';
// // await historyDb.pushMessage(id, { role: 'user', content: '2' })
// // await historyDb.pushMessage(id, { role: 'user', content: '3' })
// // await historyDb.pushMessage(id, { role: 'user', content: '4' })
// // await historyDb.pushMessage(id, { role: 'user', content: '5' })
// // await historyDb.pushMessage(id, { role: 'user', content: '6' })
// // const data = await historyDb.replaceMessages('64d3345f74f3ad7c10c42db0', { role: 'user', content: 'replace' }, undefined, 1)
// // const data = await historyDb.deleteTopic('64d1ad7cdf025f1ec909261b');
// const data = await historyDb.clearTopics()
// console.log(11, data);
// debugger

// import Prompt from "./tools/mongodb/setting/prompt";

// const promptDb = new Prompt();

// // promptDb.insertOne({
// //   "icon": "1f4d5",
// //   "name": "小红书写手",
// //   "content": "你是小红书爆款写作专家，请你用以下步骤来进行创作，首先产出5个标题（含适当的emoji表情），其次产出1个正文（每一个段落含有适当的emoji表情，文末有合适的tag标签）\n\n    一、在小红书标题方面，你会以下技能：\n    1. 采用二极管标题法进行创作\n    2. 你善于使用标题吸引人的特点\n    3. 你使用爆款关键词，写标题时，从这个列表中随机选1-2个\n    4. 你了解小红书平台的标题特性\n    5. 你懂得创作的规则\n\n    二、在小红书正文方面，你会以下技能：\n    1. 写作风格\n    2. 写作开篇方法\n    3. 文本结构\n    4. 互动引导方法\n    5. 一些小技巧\n    6. 爆炸词\n    7. 从你生成的稿子中，抽取3-6个seo关键词，生成#标签并放在文章最后\n    8. 文章的每句话都尽量口语化、简短\n    9. 在每段话的开头使用表情符号，在每段话的结尾使用表情符号，在每段话的中间插入表情符号\n\n    三、结合我给你输入的信息，以及你掌握的标题和正文的技巧，产出内容。请按照如下格式输出内容，只需要格式描述的部分，如果产生其他内容则不输出：\n    一. 标题\n    [标题1到标题5]\n    [换行]\n    二. 正文\n    [正文]\n    标签：[标签]"
// // })

// const data = await promptDb.queryPrompts();
// const data2 = data.map(item => {
//   return item.toObject({
//     getters: true,
//     virtuals: true,
//     versionKey: false,
//     transform(...arg) {
//       const ret = arg[1];
//       delete ret._id;
//       return ret;
//     },
//   })
// })
// console.log(data2)
// debugger

// import BaseInfo from "./tools/mongodb/users/baseInfo";

// const users = new BaseInfo()

// // const data = await users.searchUserByEmail("zhiyang1.liu@ximalaya.com")

// const data = await users.countUser()

// console.log(data);
