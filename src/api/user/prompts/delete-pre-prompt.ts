import Router from '@koa/router';
import Prompt from '../../../tools/mongodb/users/prompt';
import type { IPrompt } from '../../../tools/mongodb/users/prompt';
import { isNumber, isString } from '../../../tools/variable-type';
import awaitWrap from '../../../tools/await-wrap';
import { failStatus, successStatus } from '../../../constant';
import verifyAuth from '../../../tools/koa/middleware/verify-auth';

const checkAuth = verifyAuth();
interface Body {
  id: string;
}

const validateType = async (body: Body) => {
  const { id } = body;
  if (!isString(id)) {
    return Promise.reject('参数不合法');
  }
};

const process = async (uuid: string, body: Body) => {
  const promptDb = new Prompt({ uuid });
  const { id } = body;
  const [result, err] = await awaitWrap(promptDb.deletePrompt(id));
  await promptDb.close();
  if (err) {
    return Promise.reject(err);
  }
  return result?.acknowledged && (result?.modifiedCount === 1 || result?.upsertedCount === 1);
};

const deleteUserPrePrompt = (router: Router) => {
  router.post('/deleteUserPrePrompt', checkAuth, async (ctx, next) => {
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

    const [result, err] = await awaitWrap(process(ctx.uuid, body));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: err,
      };
      ctx.status = 500;
      return;
    }
    if (!result) {
      ctx.body = {
        status: failStatus,
        msg: '未知错误',
      };
      ctx.status = 500;
      return;
    }
    ctx.body = {
      status: successStatus,
      data: 'success',
    };
    ctx.status = 200;
    return await next();
  });
};

export default deleteUserPrePrompt;
