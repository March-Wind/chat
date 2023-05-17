import { AxiosResponse } from 'axios';
import { PassThrough } from 'stream';
import Router from '@koa/router';
import {
  OpenAIApi,
  Configuration,
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from '@marchyang/openai';
import { openai_key } from '../env';
const configuration = new Configuration({
  apiKey: openai_key,
});
const openai = new OpenAIApi(configuration);
const _msg: ChatCompletionRequestMessage[] = [];
const complete = async (router: Router) => {
  router.get('/complete', async (ctx) => {
    const { query } = ctx.request;
    const message = query.a as string;
    // const result = await answer(message);
    // // const result = await answer();
    // ctx.body = result;

    const msgItem: ChatCompletionRequestMessage = {
      role: 'user',
      content: message,
    };
    _msg.push(msgItem);
    const response = openai.createCompletion(
      {
        model: 'text-davinci-003',
        prompt: 'hello world',
        max_tokens: 100,
        temperature: 0,
        stream: true,
      },
      { responseType: 'stream' },
    );
    ctx.set({
      'Content-Type': 'text/event-stream',
      // 'Cache-Control': 'no-cache,no-transfrom', // ,no-transfrom是防止webpack-server-dev压缩
      'Cache-Control': 'no-cache', // ,no-transfrom是防止webpack-server-dev压缩
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // 如果网站使用了Nginx做反向代理，默认会对应用的响应做缓冲(buffering),以至于应用返回的消息没有立马发出去。
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS', //允许支持的请求方式
    });
    const answerStream = new PassThrough();
    ctx.body = answerStream;
    response
      .then((resp) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (resp as AxiosResponse<CreateChatCompletionResponse, any>).data.on('data', (data) => {
          const msg = data.toString();
          console.log(msg);
          answerStream.write(`data: ${msg}\n\n`);
        });
      })
      .catch((res) => {
        console.log(res);
      });
  });
};

export default complete;
