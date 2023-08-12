import Router from '@koa/router';
import Chat from '../../tools/openai/chat';
import { PassThrough } from 'stream';
import verifyAuth from '../../tools/koa/middleware/verify-auth';
import HistoryMessage from '../../tools/mongodb/users/history-message';
import { isNumber, isString } from '../../tools/variable-type';
import awaitWrap from '../../tools/await-wrap';
import type { ChatCompletionRequestMessage } from 'openai';
import { failStatus } from '../../constant';
const checkAuth = verifyAuth();

interface Body {
  reserveIndex: number; // 本次的消息
  topicId: string;
}
const validateType = async (body: Body) => {
  const { reserveIndex, topicId } = body;
  if (!isNumber(reserveIndex)) {
    return Promise.reject('参数不合法');
  }
  if (topicId && !isString(topicId)) {
    return Promise.reject('参数不合法');
  }
};

const getContext = async (uuid: string, topicId: string, reserveIndex: number) => {
  const historyDb = new HistoryMessage({ uuid });
  let context: ChatCompletionRequestMessage[] = [];
  const [messages, err] = await awaitWrap(historyDb.queryTopicMessages(topicId));
  if (err) {
    return Promise.reject(err);
  }
  context = messages!.slice(0, reserveIndex + 1).map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = item;
    return rest as ChatCompletionRequestMessage;
  });
  return {
    context,
    reserveIndex: reserveIndex,
  };
};

const replaceMessage = async (
  uuid: string,
  topicId: string,
  removeMessageIndex: number,
  newMsg: ChatCompletionRequestMessage,
) => {
  const historyDb = new HistoryMessage({ uuid });
  return await historyDb.replaceMessages(topicId, newMsg, undefined, removeMessageIndex);
};

const regenerateContent = (router: Router) => {
  router.post('/regenerate-content', checkAuth, async (ctx, next) => {
    const body = ctx.request.body as Body;
    const [, illegality] = await awaitWrap(validateType(body));
    if (illegality) {
      ctx.body = {
        status: failStatus,
        msg: illegality,
      };
      ctx.status = 400;
      return;
    }
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
    const { topicId, reserveIndex } = body;
    const [data, err] = await awaitWrap(getContext(ctx.uuid, topicId, reserveIndex));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: '服务器错误',
      };
      ctx.status = 500;
      return;
    }
    const { context } = data!;
    const chat = new Chat({ context });
    chat
      .ask()
      .then((resp) => {
        chat.receivingAnswer(resp, (message) => {
          // 还是以\n\n分隔，然后在客户端处理的时候，进行\n\n分隔，然后将分隔的数组遍历一次，和前面的元素加起来进行JSON.parse,如果能parse，就是一个对象，如果不能parse，就是一个这个对象的一部分，继续找遍历后面元素，找到能parse的完整的对象
          answerStream.write(`${JSON.stringify(message)}\n\n`);
          if (message[message.length - 1]?.choices[0]?.finish_reason === 'stop') {
            replaceMessage(ctx.uuid, topicId, reserveIndex, chat.answer)
              .then((res) => {
                console.log('continue', res);
              })
              .catch((err) => {
                console.log(err);
                answerStream.write(`${JSON.stringify([{ error: '写入数据库错误，请稍后再试~' }])}\n\n`);
              })
              .finally(() => {
                answerStream.end();
              });
          }
        });
      })
      .catch((err) => {
        console.log(11, err);
      });
    return await next();
  });
};

export default regenerateContent;
