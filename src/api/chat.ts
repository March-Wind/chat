import Router from '@koa/router';
import Chat from '..//tools/openai/chat';
import { PassThrough } from 'stream';
import verifyAuth from '../tools/koa/middleware/verify-auth';
// to do 这里支持单人的
const chat = new Chat();
const checkAuth = verifyAuth();
const playChat = async (router: Router) => {
  router.post('/chat', checkAuth, async (ctx, next) => {
    ctx.set({
      // 'Content-Type': 'text/event-stream',
      'Content-Type': 'text/event-stream;',
      // 'Content-Type': 'application/json;charset=utf-8',
      // 'Cache-Control': 'no-cache,no-transfrom', // ,no-transfrom是防止webpack-server-dev压缩
      'Cache-Control': 'no-cache', // ,no-transfrom是防止webpack-server-dev压缩
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // 如果网站使用了Nginx做反向代理，默认会对应用的响应做缓冲(buffering),以至于应用返回的消息没有立马发出去。
      // 'Transfer-Encoding': 'identity',  // 禁用分块传输编码
    });
    const answerStream = new PassThrough();
    ctx.body = answerStream;

    const { msg = '你好' } = ctx.request.body as { msg: string };
    // to do 这里如果是空字符串，怎么处理
    chat
      .ask(msg)
      .then((resp) => {
        chat.receivingAnswer(resp, (message) => {
          // to do 还是以\n\n分隔，然后在客户端处理的时候，进行\n\n分隔，然后将分隔的数组遍历一次，和前面的元素加起来进行JSON.parse,如果能parse，就是一个对象，如果不能parse，就是一个这个对象的一部分，继续找遍历后面元素，找到能parse的完整的对象
          answerStream.write(`${JSON.stringify(message)}\n\n`);
          if (message[message.length - 1]?.choices[0]?.finish_reason === 'stop') {
            answerStream.end();
          }
        });
      })
      .catch((err) => {
        console.log(11, err);
      });
    return await next();
  });
};
export default playChat;
