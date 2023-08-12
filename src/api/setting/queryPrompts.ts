import { failStatus, successStatus } from '../../constant';
import awaitWrap from '../../tools/await-wrap';
import Prompt from '../../tools/mongodb/setting/prompt';
import type Router from '@koa/router';

const queryPrompts = (router: Router) => {
  router.get('/queryPrompts', async (ctx, next) => {
    const prompt = new Prompt();
    const [data, err] = await awaitWrap(prompt.queryPrompts());
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: err,
      };
      ctx.status = 500;
      return;
    }
    ctx.body = {
      status: successStatus,
      data: prompt.transform(data!),
    };
    ctx.status = 200;
    return await next();
  });
};

export default queryPrompts;
