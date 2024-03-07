import Router from '@koa/router';
import mongoose from 'mongoose';
import Chat from '../../../tools/openai/chat';
import { PassThrough } from 'stream';
import verifyAuth from '../../../tools/koa/middleware/verify-auth';
import HistoryMessage from '../../../tools/mongodb/users/history-message';
import UserPrompt from '../../../tools/mongodb/users/prompt';
import { isNumber, isString } from '../../../tools/variable-type';
import awaitWrap from '../../../tools/await-wrap';
import type { Message } from '../../../tools/mongodb/users/history-message';
import type { IPrompt } from '../../../tools/mongodb/users/prompt';
import { failStatus, waitingForCompletion } from '../../../constant';
import SystemPrompt from '../../../tools/mongodb/setting/prompt';
const checkAuth = verifyAuth();

interface Body {
  msg: string; // 本次的消息
  topicId: string;
  prePrompt: {
    id: string;
    name: string;
    avatar: string;
    type: 'user' | 'system'; // 用户设置和系统设置
  };
  userModalConfig?: IPrompt['modelConfig'];
}

const validateType = async (body: Body) => {
  const { msg, topicId, prePrompt } = body;
  if (!isString(msg)) {
    return Promise.reject('参数不合法');
  }
  if (topicId && !isString(topicId)) {
    return Promise.reject('参数不合法');
  }
  if (prePrompt && !isString(prePrompt.id)) {
    return Promise.reject('参数不合法');
  }
};

export const padContext = async (uuid: string, context: Message[], prePrompt?: Body['prePrompt']) => {
  if (!prePrompt) {
    return {
      context,
      temperature: 0.2,
    };
  }
  if (prePrompt.type === 'user') {
    const userPromptDb = new UserPrompt({ uuid });
    const [result, err] = await awaitWrap(userPromptDb.findOne(prePrompt.id));
    if (err) {
      await userPromptDb.close();
      return Promise.reject(err);
    }
    if (!result) {
      await userPromptDb.close();
      return Promise.reject('没有找到预设提示词');
    }
    type D = (typeof result)[0]['context'] & { _id: mongoose.Types.ObjectId };
    const _prePrompt = UserPrompt.transform(result![0]!.context as D, true);
    const modelConfig = result![0]!.modelConfig;
    await userPromptDb.close();
    return {
      context: ([] as Message[]).concat(..._prePrompt).concat(context),
      ...modelConfig,
    };
  }
  // 补全系统预设提示词
  if (prePrompt.type === 'system') {
    const prompt = new SystemPrompt();
    const [data, err] = await awaitWrap(prompt.findOne(prePrompt.id));
    if (err) {
      return Promise.reject(err);
    }
    if (!data) {
      return Promise.reject('没有找到预设提示词');
    }
    const _data = data?.toObject({
      versionKey: false,
      getters: true,
      virtuals: true,
      transform: (...[, ret]: any[]) => {
        delete ret._id;
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    });
    const modelConfig = _data!.modelConfig;
    await prompt.close();
    return {
      context: ([] as Message[]).concat(..._data.context).concat(context),
      ...modelConfig,
    };
    // delete context[0].prePromptId
  }
};
interface GetContextParams {
  uuid: string;
  msg?: string;
  topicId?: string;
  prePrompt?: Body['prePrompt'];
  removeMessageIndex?: number; // 保留的索引从0开始
}
export const getContext = async (params: GetContextParams) => {
  const { uuid, msg, topicId, prePrompt, removeMessageIndex } = params;
  const historyDb = new HistoryMessage({ uuid });
  const context: Message[] = [];
  let _topicId: string;
  // let messageId: string;
  let _prePrompt: Body['prePrompt'] | undefined;
  if (topicId) {
    _topicId = topicId;
    if (msg) {
      const message = HistoryMessage.createMessage(msg);
      const [result, err] = await awaitWrap(historyDb.pushMessage(topicId, message));
      if (err || !result?.acknowledged) {
        return Promise.reject(err);
      }
    }
    const [topic, err2] = await awaitWrap(historyDb.queryTopicById(topicId));
    if (err2) {
      return Promise.reject(err2);
    }
    // const lastMessageId = messages![messages!.length - 1]!.id;
    // messageId = lastMessageId;
    _prePrompt = topic!.prePrompt;
    const msgs = topic!.messages!.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = item;
      return rest;
    });
    context.push(...msgs);
  } else {
    _prePrompt = prePrompt;
    msg &&
      context.push({
        role: 'user',
        content: msg,
      });
    const _topicIdBuffer = new mongoose.Types.ObjectId();
    _topicId = _topicIdBuffer.toString();
    const [, err] = await awaitWrap(
      historyDb.addTopic({
        _id: _topicIdBuffer, // 创建一个新的 ObjectId
        messages: context,
        prePrompt,
      }),
    );
    await historyDb.close();
    if (err) {
      return Promise.reject(err);
    }
  }

  return {
    context: isNumber(removeMessageIndex) ? context.slice(0, removeMessageIndex + 1) : context,
    topicId: _topicId,
    prePrompt: _prePrompt,
  };
};
export const listenClientEvent = (answerStream: PassThrough, close: Function) => {
  let closed = 0;
  answerStream.on('close', () => {
    if (!closed) {
      close();
      closed = 1;
    }
  });
  // answerStream.on('resume', (str: any) => {
  //   console.log(str);
  //   debugger
  // })
  // answerStream.on('end', (str: any) => {
  //   console.log(str);
  //   debugger
  // })
  // answerStream.on('error', (str: any) => {
  //   console.log(str);
  //   debugger
  // })
  // answerStream.on('finish', (str: any) => {
  //   console.log(str);
  //   debugger
  // })
  // answerStream.on('drain', (str: any) => {
  //   console.log(str);
  //   debugger
  // })
};
const pushMessage = async (uuid: string, topicId: string, message: Message) => {
  const historyDb = new HistoryMessage({ uuid });
  const [result, err] = await awaitWrap(historyDb.pushMessage(topicId, message));
  await historyDb.close();
  if (err || !result?.acknowledged) {
    return Promise.reject();
  }
};

const playChat = async (router: Router) => {
  router.post('/chat', checkAuth, async (ctx, next) => {
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
    const { msg, topicId, prePrompt, userModalConfig } = body;
    const [data, err] = await awaitWrap(getContext({ uuid: ctx.uuid, msg, topicId, prePrompt }));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: '服务器错误',
      };
      ctx.status = 500;
      await ctx.userTemporaryStore.set({ ...userTS, chatting: 0 }, 0);
      return;
    }
    const { context, topicId: thisTopicId, prePrompt: _prePrompt } = data!;
    const [config, err2] = await awaitWrap(padContext(ctx.uuid, context, _prePrompt));
    if (err2) {
      ctx.body = {
        status: failStatus,
        msg: '服务器错误',
      };
      ctx.status = 500;
      await ctx.userTemporaryStore.set({ ...userTS, chatting: 0 }, 0);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const chat = new Chat({ ...userModalConfig, ...config });
    let stopFlag = false;
    const stopFn = () => {
      if (stopFlag) {
        return;
      }
      chat.close();
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      pushMessage(ctx.uuid, thisTopicId, message)
        .catch((err: any) => {
          console.log(err);
          answerStream?.write(`${JSON.stringify([{ error: '写入数据库错误，请稍后再试~' }])}\n\n`);
        })
        .finally(async () => {
          await ctx.userTemporaryStore.set({ ...userTS, chatting: 0 }, 0);
          answerStream?.end();
        });
    };
    answerStream.write(`${JSON.stringify([{ type: 'topicId', topicId: thisTopicId }])}\n\n`);

    chat
      .ask({
        streamCb(data) {
          if (data === 'end' || data === 'close') {
            // 由于在 finish_reason === 'stop'做了结束，所以这里直接返回就行了
            return;
          }
          const lastChoice = data.choices[data.choices.length - 1]!;

          data.choices = data.choices.map((item) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            item.message = item.delta;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            delete item.delta;
            return item;
          });
          // 还是以\n\n分隔，然后在客户端处理的时候，进行\n\n分隔，然后将分隔的数组遍历一次，和前面的元素加起来进行JSON.parse,如果能parse，就是一个对象，如果不能parse，就是一个这个对象的一部分，继续找遍历后面元素，找到能parse的完整的对象
          // console.log(message[message.length - 1]?.choices[0]?.message?.content)
          answerStream.write(`${JSON.stringify(data)}\n\n`);
          if (lastChoice.finish_reason === 'length') {
            answerStream?.write(
              `${JSON.stringify([
                { error: '对话上下文超出限制，请重新开始一个对话，站长在找好的处理方式，敬请期待！' },
              ])}\n\n`,
            );
            stopFn();
          }
          if (lastChoice.finish_reason === 'stop') {
            stopFn();
          }
        },
        errCb() {
          answerStream?.write(`${JSON.stringify([{ error: '对话接口出错，请稍后再试~' }])}\n\n`);
          stopFn();
        },
      })
      .catch((err) => {
        console.log(err);
        answerStream?.write(`${JSON.stringify([{ error: '对话接口出错，请稍后再试~' }])}\n\n`);
        stopFn();
      });
    listenClientEvent(answerStream, async () => {
      stopFn();
    });
    return await next();
  });
};
export default playChat;
