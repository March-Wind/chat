import Router from '@koa/router';
import Prompt from '../../../tools/mongodb/users/prompt';
import awaitWrap from '../../../tools/await-wrap';
import { failStatus, successStatus } from '../../../constant';
import verifyAuth from '../../../tools/koa/middleware/verify-auth';
// import type { GetDocumentDoc, ExtractDocumentType } from '../../../tools/mongodb/types'

// type TransformDocumentResult<T> = GetDocumentDoc<ExtractDocumentType<T>>
// to do 分页
const checkAuth = verifyAuth();

const process = async (uuid: string) => {
  const promptDb = new Prompt({ uuid });
  const [result, err] = await awaitWrap(promptDb.findOne());
  await promptDb.close();
  if (err) {
    return Promise.reject(err);
  }
  if (result === null) {
    return [];
  }
  return Prompt.transform(result!);
};

const queryUserPrePrompt = (router: Router) => {
  router.post('/queryUserPrePrompt', checkAuth, async (ctx, next) => {
    const [result, err] = await awaitWrap(process(ctx.uuid));
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
      data: result,
    };
    ctx.status = 200;
    return await next();
  });
};

export default queryUserPrePrompt;
