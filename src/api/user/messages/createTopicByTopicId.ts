import type Router from '@koa/router';
import Chat from '../../../tools/openai/chat';
import HistoryMessage from '../../../tools/mongodb/users/history-message';
import { isString } from '../../../tools/variable-type';
import awaitWrap from '../../../tools/await-wrap';
import verifyAuth from '../../../tools/koa/middleware/verify-auth';
import { failStatus, successStatus } from '../../../constant';
import { generateTopic } from '../../../prompt';

const checkAuth = verifyAuth();

interface Body {
  topicId: string;
}

const validateBodyType = async (body: Body) => {
  const { topicId } = body;
  if (isString(topicId) && topicId) {
    return Promise.resolve();
  }

  return Promise.reject('参数不合法!');
};

const createTopicByTopicId = (router: Router) => {
  router.post('/createTopicByTopicId', checkAuth, async (ctx, next) => {
    const body = ctx.request.body as Body;
    const [, err] = await awaitWrap(validateBodyType(body));
    if (err) {
      ctx.body = {
        status: 500,
        msg: err,
      };
      ctx.status = 400;
      return;
    }
    const { topicId } = body;
    const historyDb = new HistoryMessage({ uuid: ctx.uuid });
    const [data, err2] = await awaitWrap(historyDb.queryFirstFewMessages(topicId, 3));
    if (err2) {
      ctx.body = {
        status: 500,
        msg: err2,
      };
      return;
    }

    // 由于第一个是系统设置，所以不是用户对话的过程，不参与生成主题
    if (!data || data.length < 2) {
      ctx.body = {
        status: successStatus,
        data: '',
      };
      ctx.status = 200;
      return await next();
    }
    const prompt = generateTopic(data![0]!.content, data![1]!.content.slice(0, 100));
    const chat = new Chat({
      stream: false,
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    await new Promise((resolve) => {
      chat
        .ask({
          question: prompt,
          cb: (data) => {
            if (data === 'close' || data === 'end') {
              return;
            }
            const content = data[0];
            const title = content?.choices[0]?.message?.content || '';
            historyDb
              .setTopicTitle(topicId, title)
              .then(async () => {
                ctx.body = {
                  status: successStatus,
                  data: title,
                };
                ctx.status = 200;
                resolve('');
              })
              .catch((err) => {
                ctx.body = {
                  status: failStatus,
                  msg: err,
                };
                ctx.status = 500;
                return;
              });
          },
        })
        .catch((err: any) => {
          console.log(err);
        });
    });
    await historyDb.close();
    return await next();
  });
};
export default createTopicByTopicId;
