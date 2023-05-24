import Router from '@koa/router';
import Chat from '..//tools/openai/chat';
import { PassThrough } from 'stream';
// to do 这里支持单人的
const chat = new Chat();
const playChat = async (router: Router) => {
  router.post('/chat', async (ctx, next) => {
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

    next();
    const { msg = '你好' } = ctx.request.body as { msg: string };
    // to do 这里如果是空字符串，怎么处理
    chat
      .ask(msg)
      .then((resp) => {
        chat.receivingAnswer(resp, (message) => {
          answerStream.write(`${JSON.stringify(message)}`);
        });
      })
      .catch((err) => {
        console.log(11, err);
      });
  });
};
export default playChat;
