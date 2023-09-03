import Router from '@koa/router';
import verifyAuth from '../../../tools/koa/middleware/verify-auth';
import HistoryMessage from '../../../tools/mongodb/users/history-message';
import { failStatus, successStatus } from '../../../constant';
import awaitWrap from '../../../tools/await-wrap';
import { isString } from '../../../tools/variable-type';
interface Body {
  topicId: string;
  messageId: string;
}

const checkAuth = verifyAuth();

const validateType = async (body: Body) => {
  const { topicId, messageId } = body;
  if (!isString(topicId) || !isString(messageId)) {
    return Promise.reject('参数不合法！');
  }
};

const deleteTopic = (router: Router) => {
  // 获取所有话题
  router.post('/deleteMessage', checkAuth, async (ctx, next) => {
    const body = ctx.request.body as Body;
    const [, invalid] = await awaitWrap(validateType(body));
    if (invalid) {
      ctx.body = {
        status: failStatus,
        msg: invalid,
      };
      ctx.status = 400;
      return;
    }
    const { topicId, messageId } = body;
    const history = new HistoryMessage({ uuid: ctx.uuid });
    const [data, err] = await awaitWrap(history.deleteMessage(topicId, messageId));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: err,
      };
      ctx.status = 500;
      return;
    }
    if (!data?.acknowledged || data.modifiedCount !== 1) {
      ctx.body = {
        status: failStatus,
        msg: '删除操作出现错误',
      };
      ctx.status = 500;
      return;
    }
    ctx.body = {
      status: successStatus,
      mag: '删除成功',
      data: true,
    };
    ctx.status = 200;
    return await next();
  });
};

export default deleteTopic;
