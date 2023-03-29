import Koa from 'koa';
import router from './createRoutes';
const app = new Koa();
app.use(router.routes()).use(router.allowedMethods());
// app.use((ctx) => {
//   ctx.body = 'nihao'
// });

app.listen(3000);
console.log('开始监听');
// node /www/wwwroot/openai/chat5.cjs

// curl https://api.openai.com/v1/chat/completions \
// -H "Content-Type: application/json" \
// -H "Authorization: Bearer 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" \
// -d '{
// "model": "gpt-3.5-turbo",
//   "messages": [{ "role": "user", "content": "你现在是nodejs大师，请交给我stream相关的知识" }],
//     "temperature": 0.7
//    }'

// axios请求方法
// import axios from "axios";
// const instance = axios.create({
//   baseURL: 'http://43.153.51.25:3000',

// })
// debugger

// instance.get('/?a=你好，请讲个笑话', {
//   responseType: 'stream',
// }).then((res) => {
//   debugger
//   res.data.on('data', (data: Buffer) => {
//     console.log(data.toString())
//   })
// }).catch((err) => {
//   debugger

//   console.log(err)
// })

// axios.get('http://43.153.51.25:3000/?a=怎么使用请求openai api的sse接口', {
//   responseType: 'stream',
// }).then((res) => {
//   debugger
//   res.data.on('data', (data: Buffer) => {
//     console.log(data.toString())
//   })
// }).catch((err) => {
//   debugger

//   console.log(err)
// })
