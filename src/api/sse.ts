import Router, { Middleware } from '@koa/router';
import { PassThrough } from 'stream';

const sse = (router: Router) => {
  const cb: Middleware = (ctx) => {
    // 设置header
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache,no-transfrom', // ,no-transfrom是防止webpack-server-dev压缩
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // 如果网站使用了Nginx做反向代理，默认会对应用的响应做缓冲(buffering),以至于应用返回的消息没有立马发出去。
    });
    const res = new PassThrough();
    ctx.body = res;
    const interval = setInterval(() => {
      res.write(`data: ${new Date()}\n\n`);
    }, 1000);
    res.on('close', () => {
      clearInterval(interval);
    });
  };
  // return ['/test', cb]
  router.get('/test', cb);
};

// router.get('/test', async (ctx) => {
//   const { query } = ctx.request;
//   const message = query.a as string;
//   const result = await answer(message);
//   // const result = await answer();
//   ctx.body = result;
// })
export default sse;

// axios请求方法
// import axios from "axios";
// const instance = axios.create({
//   baseURL: 'http://43.153.51.25:3000',

// })
// debugger

// instance.get('/test', {
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
