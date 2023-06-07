import { SocksProxyAgent } from 'socks-proxy-agent';
const httpsAgent = new SocksProxyAgent('socks5://127.0.0.1:1086');
import { AxiosResponse } from 'axios';
import { PassThrough } from 'stream';
import Router from '@koa/router';
import { OpenAIApi, Configuration, ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import { openai_key } from '../env';
const configuration = new Configuration({
  apiKey: openai_key,
});
const openai = new OpenAIApi(configuration);
const _msg: ChatCompletionRequestMessage[] = [];
const getAnswer = async (router: Router) => {
  router.get('/question', async (ctx, next) => {
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
    const answer = openai.createChatCompletion(
      {
        model: 'gpt-3.5-turbo',
        messages: _msg,
        stream: true,
        temperature: 0.2,
      },
      {
        httpsAgent,
        httpAgent: httpsAgent,
        responseType: 'stream',
        proxy: false,
      },
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
    answer
      .then((resp) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (resp as AxiosResponse<CreateChatCompletionResponse, any>).data.on('data', (data: Buffer) => {
          const _msg = data.toString();
          answerStream.write(`data: ${_msg}\n\n`);
        });
      })
      .catch((res) => {
        console.log(res);
      });

    next();
  });
};

export default getAnswer;
