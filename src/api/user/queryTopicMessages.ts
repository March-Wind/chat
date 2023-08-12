import Router from '@koa/router';
import verifyAuth from '../../tools/koa/middleware/verify-auth';
import HistoryMessage from '../../tools/mongodb/users/history-message';
import { failStatus, successStatus } from '../../constant';
import awaitWrap from '../../tools/await-wrap';
import { isString } from '../../tools/variable-type';

interface Body {
  topicId: string;
}

const validateBodyType = async (body: Body) => {
  const { topicId } = body;
  if (isString(topicId)) {
    return Promise.resolve();
  }

  return Promise.reject('参数不合法!');
};
const checkAuth = verifyAuth();
const queryTopicMessages = (router: Router) => {
  // 获取所有话题
  router.post('/queryTopicMessages', checkAuth, async (ctx, next) => {
    const body = ctx.request.body as Body;
    const [, invalid] = await awaitWrap(validateBodyType(body));
    if (invalid) {
      ctx.body = {
        status: 500,
        msg: invalid,
      };
      ctx.status = 400;
      return;
    }
    const { topicId } = body;
    const history = new HistoryMessage({ uuid: ctx.uuid });
    const [data, err] = await awaitWrap(history.queryTopicMessages(topicId));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: '查询失败',
      };
      ctx.status = 500;
      return;
    }
    ctx.body = {
      status: successStatus,
      data,
    };
    ctx.status = 200;
    return await next();
  });
};

export default queryTopicMessages;
