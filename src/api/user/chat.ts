import Router from '@koa/router';
import Chat from '../../tools/openai/chat';
import { PassThrough } from 'stream';
import verifyAuth from '../../tools/koa/middleware/verify-auth';
import HistoryMessage from '../../tools/mongodb/users/history-message';
import { isString } from '../../tools/variable-type';
import awaitWrap from '../../tools/await-wrap';
import type { ChatCompletionRequestMessage } from 'openai';
import type { UpdateWriteOpResult } from 'mongoose';
import { failStatus } from '../../constant';

const checkAuth = verifyAuth();

interface Body {
  msg: string; // 本次的消息
  topicId: string;
}

const validateType = async (body: Body) => {
  const { msg, topicId } = body;
  if (!isString(msg)) {
    return Promise.reject('参数不合法');
  }
  if (topicId && !isString(topicId)) {
    return Promise.reject('参数不合法');
  }
};
const getContext = async (uuid: string, msg: string, topicId?: string) => {
  const historyDb = new HistoryMessage({ uuid });
  const context: ChatCompletionRequestMessage[] = [];
  let _topicId: string;
  let messageId: string;
  if (topicId) {
    _topicId = topicId;
    const message = HistoryMessage.createMessage(msg);
    const [result, err] = await awaitWrap(historyDb.pushMessage(topicId, message));
    if (err || !result?.acknowledged) {
      return Promise.reject(err);
    }
    const [messages, err2] = await awaitWrap(historyDb.queryTopicMessages(topicId));
    if (err2) {
      return Promise.reject(err);
    }
    const lastMessageId = messages![messages!.length - 1]!.id;
    messageId = lastMessageId;
    const msgs = messages!.map((item) => {
      const { id, ...rest } = item;
      return rest;
    });
    context.concat(msgs);
  } else {
    context.push({
      role: 'system',
      content: '你是一个有用的智能助手，你总是给出最靠谱的回答。',
    });
    msg &&
      context.push({
        role: 'user',
        content: msg,
      });
    const [historyMessages, err] = await awaitWrap(
      historyDb.addTopic({
        messages: context,
      }),
    );
    if (err) {
      return Promise.reject(err);
    }
    type ThisHM = Exclude<typeof historyMessages, UpdateWriteOpResult | undefined | null>;
    _topicId = (historyMessages as ThisHM).topics[0]?.id;
  }
  return {
    context,
    topicId: _topicId,
  };
};
const pushMessage = async (uuid: string, topicId: string, message: ChatCompletionRequestMessage) => {
  const historyDb = new HistoryMessage({ uuid });
  const [result, err] = await awaitWrap(historyDb.pushMessage(topicId, message));
  if (err || !result?.acknowledged) {
    return Promise.reject();
  }
};
const playChat = async (router: Router) => {
  router.post('/chat', checkAuth, async (ctx, next) => {
    const body = ctx.request.body as Body;
    const [legal, illegality] = await awaitWrap(validateType(body));
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

    const { msg, topicId } = body;
    const [data, err] = await awaitWrap(getContext(ctx.uuid, msg, topicId));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: '服务器错误',
      };
      ctx.status = 500;
      return;
    }
    const { context, topicId: thisTopicId } = data!;
    const chat = new Chat({ context });
    const stopFn = () => {
      // const err = [{
      //   error: '服务器错误',
      // }]
      // answerStream.push(JSON.stringify(err) + '\n\n');
      // return;
      pushMessage(ctx.uuid, thisTopicId, chat.answer)
        .then((res) => {
          console.log(111, res);
        })
        .catch((err: any) => {
          console.log(err);
          answerStream.write(`${JSON.stringify([{ error: '写入数据库错误，请稍后再试~' }])}\n\n`);
        })
        .finally(() => {
          answerStream.end();
        });
    };
    answerStream.write(`${JSON.stringify([{ type: 'topicId', topicId: thisTopicId }])}\n\n`);
    chat
      .ask(msg)
      .then((resp) => {
        chat.receivingAnswer(resp, (message) => {
          // 还是以\n\n分隔，然后在客户端处理的时候，进行\n\n分隔，然后将分隔的数组遍历一次，和前面的元素加起来进行JSON.parse,如果能parse，就是一个对象，如果不能parse，就是一个这个对象的一部分，继续找遍历后面元素，找到能parse的完整的对象
          answerStream.write(`${JSON.stringify(message)}\n\n`);
          if (message[message.length - 1]?.choices[0]?.finish_reason === 'stop') {
            stopFn();
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
