// import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from "@marchyang/openai";
// const configuration = new Configuration({
//   apiKey: " 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",
// });
// const openai = new OpenAIApi(configuration);
// const _msg: ChatCompletionRequestMessage[] = [];
// const answer = async (message: string) => {
//   const msgItem: ChatCompletionRequestMessage = {
//     role: 'user', content: message
//   }
//   _msg.push(msgItem)
//   debugger
//   const completion = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: _msg,
//   }, {
//     responseType: 'stream'
//   }).catch((res) => {
//     console.log(res)
//     debugger
//   })
//   debugger
//   if (completion?.data?.choices[0].message) {
//     _msg.push(completion?.data?.choices[0].message)
//     return completion.data.choices[0].message;
//   }
//   console.log(completion)
//   return '我其实报错了'
// };

// export default answer;
import { AxiosResponse } from 'axios';
import { PassThrough } from 'stream';
import Router, { Middleware } from '@koa/router';
import {
  OpenAIApi,
  Configuration,
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from '@marchyang/openai';
const configuration = new Configuration({
  apiKey: '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',
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
    debugger;
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
        debugger;
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
        debugger;
      });
  });
};

export default complete;
