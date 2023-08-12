import Router from '@koa/router';
import verifyAuth from '../../tools/koa/middleware/verify-auth';
import HistoryMessage from '../../tools/mongodb/users/history-message';
import { failStatus, successStatus } from '../../constant';
import awaitWrap from '../../tools/await-wrap';

const checkAuth = verifyAuth();

const clearTopics = (router: Router) => {
  // 获取所有话题
  router.post('/clearTopics', checkAuth, async (ctx, next) => {
    const history = new HistoryMessage({ uuid: ctx.uuid });
    const [data, err] = await awaitWrap(history.clearTopics());
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: err,
      };
      ctx.status = 500;
      return;
    }
    if (!data?.acknowledged) {
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

export default clearTopics;
