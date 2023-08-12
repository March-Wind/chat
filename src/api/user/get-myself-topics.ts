import Router from '@koa/router';
import verifyAuth from '../../tools/koa/middleware/verify-auth';
import HistoryMessage from '../../tools/mongodb/users/history-message';
import { failStatus, successStatus } from '../../constant';
import awaitWrap from '../../tools/await-wrap';

const checkAuth = verifyAuth();
const getMyselfTopics = (router: Router) => {
  // 获取所有话题
  router.get('/getMyselfTopics', checkAuth, async (ctx, next) => {
    const history = new HistoryMessage({ uuid: ctx.uuid });
    const [data, err] = await awaitWrap(history.queryTopics());
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

export default getMyselfTopics;
