import { PassThrough } from 'stream';
import Router from '@koa/router';
import Chat from '../../../tools/openai/chat';
import verifyAuth from '../../../tools/koa/middleware/verify-auth';
import HistoryMessage, { Message } from '../../../tools/mongodb/users/history-message';
import { isNumber, isString } from '../../../tools/variable-type';
import awaitWrap from '../../../tools/await-wrap';
import { failStatus, waitingForCompletion } from '../../../constant';
import { getContext, padContext, listenClientEvent } from './chat';
import type { IPrompt } from '../../../tools/mongodb/users/prompt';

const checkAuth = verifyAuth();

interface Body {
  reserveIndex: number; // 保留的消息
  topicId: string;
  userModalConfig?: IPrompt['modelConfig'];
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

const replaceMessage = async (uuid: string, topicId: string, removeMessageIndex: number, newMsg: Message) => {
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

    const [userTS, UTSError] = await awaitWrap(ctx.userTemporaryStore.get());
    if (UTSError) {
      ctx.body = {
        status: failStatus,
        msg: UTSError,
      };
      ctx.status = 500;
      return;
    }
    if (userTS?.chatting) {
      ctx.body = {
        status: waitingForCompletion,
        msg: '请等待上一个聊天完成，再开启下一个聊天~',
      };
      ctx.status = 403;
      return;
    }
    // 开始进行聊天，锁住未来的对话，等待当前对话完成
    const [, tError] = await awaitWrap(ctx.userTemporaryStore.set({ ...userTS, chatting: 1 }, 0));
    if (tError) {
      ctx.body = {
        status: failStatus,
        msg: tError,
      };
      ctx.status = 500;
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
    const { topicId, reserveIndex, userModalConfig } = body;
    const _reserveIndex = reserveIndex;
    const [data, err] = await awaitWrap(getContext({ uuid: ctx.uuid, topicId, removeMessageIndex: _reserveIndex }));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: '服务器错误',
      };
      ctx.status = 500;
      return;
    }
    const { context, prePrompt } = data!;
    const [config, err2] = await awaitWrap(padContext(ctx.uuid, context, prePrompt));
    if (err2) {
      ctx.body = {
        status: failStatus,
        msg: '服务器错误',
      };
      ctx.status = 500;
      return;
    }
    const chat = new Chat({ ...userModalConfig, ...config });
    let stopFlag = false;
    const stopFn = () => {
      if (stopFlag) {
        return;
      }
      if (!chat.answer) {
        // openai api接口报错的分支，就会没有answer
        ctx.userTemporaryStore
          .set({ ...userTS, chatting: 0 }, 0)
          // .then(() => {
          //   answerStream?.write(`${JSON.stringify([{ error: '聊天机器人出错了，请稍后再试~' }])}\n\n`);
          // })
          .catch(() => {
            answerStream?.write(
              `${JSON.stringify([{ error: '聊天机器人出错了，并且转化对话状态失败，请联系管理员~' }])}\n\n`,
            );
          })
          .finally(() => {
            answerStream?.end();
          });
        return;
      }
      stopFlag = true;
      const message = {
        role: chat.answer.role,
        content: chat.answer.content || '',
      };
      replaceMessage(ctx.uuid, topicId, _reserveIndex, message)
        .catch((err) => {
          console.log(err);
          answerStream.write(`${JSON.stringify([{ error: '写入数据库错误，请稍后再试~' }])}\n\n`);
        })
        .finally(() => {
          answerStream.end();
        });
    };
    chat
      .ask({
        cb(message) {
          if (message === 'end') {
            answerStream.end();
            return;
          }
          if (message === 'close') {
            answerStream.end();
            return;
          }
          // 还是以\n\n分隔，然后在客户端处理的时候，进行\n\n分隔，然后将分隔的数组遍历一次，和前面的元素加起来进行JSON.parse,如果能parse，就是一个对象，如果不能parse，就是一个这个对象的一部分，继续找遍历后面元素，找到能parse的完整的对象
          answerStream.write(`${JSON.stringify(message)}\n\n`);
          if (message[message.length - 1]?.choices[0]?.finish_reason === 'length') {
            answerStream?.write(
              `${JSON.stringify([
                { error: '对话上下文超出限制，请重新开始一个对话，站长在找好的处理方式，敬请期待！' },
              ])}\n\n`,
            );
            stopFn();
          }
          if (message[message.length - 1]?.choices[0]?.finish_reason === 'stop') {
            stopFn();
          }
        },
      })
      .catch((err) => {
        console.log('regenerate-content', err);
        stopFn();
      });
    listenClientEvent(answerStream, () => {
      chat.close();
      stopFn();
    });
    return await next();
  });
};

export default regenerateContent;
