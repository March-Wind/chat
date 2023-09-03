import Router from '@koa/router';
import Prompt from '../../../tools/mongodb/users/prompt';
import type { IPrompt } from '../../../tools/mongodb/users/prompt';
import { isNumber, isString } from '../../../tools/variable-type';
import awaitWrap from '../../../tools/await-wrap';
import { failStatus, successStatus } from '../../../constant';
import verifyAuth from '../../../tools/koa/middleware/verify-auth';
import mongoose from 'mongoose';

const checkAuth = verifyAuth();
interface Body extends IPrompt {}

const validateType = async (body: Body) => {
  const { name, avatar, context, modelConfig } = body;

  if (!isString(name) || !isString(avatar) || !Array.isArray(context)) {
    return Promise.reject('参数不合法');
  }
  if (context.length === 0) {
    return Promise.reject('参数不合法');
  }
  const validateItem = context.find((item) => {
    return !['system', 'user', 'assistant'].includes(item.role) || !isString(item.content);
  });
  if (validateItem) {
    return Promise.reject('参数不合法');
  }
  if (modelConfig && !isNumber(modelConfig.temperature)) {
    return Promise.reject('参数不合法');
  }
};

const process = async (uuid: string, body: Body) => {
  const promptDb = new Prompt({ uuid });
  const _id = new mongoose.Types.ObjectId();
  const [result, err] = await awaitWrap(promptDb.addPrompt(body));
  await promptDb.close();
  if (err) {
    return Promise.reject(err);
  }
  if (result?.acknowledged && (result?.modifiedCount === 1 || result?.upsertedCount === 1)) {
    return _id.toString();
  } else {
    return Promise.reject('未知错误');
  }
};

const addPrePrompt = (router: Router) => {
  router.post('/saveUserPrePrompt', checkAuth, async (ctx, next) => {
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

    const [id, err] = await awaitWrap(process(ctx.uuid, body));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: err,
      };
      ctx.status = 500;
      return;
    }
    if (!id) {
      ctx.body = {
        status: failStatus,
        msg: '未知错误',
      };
      ctx.status = 500;
      return;
    }
    ctx.body = {
      status: successStatus,
      data: id,
    };
    ctx.status = 200;
    return await next();
  });
};

export default addPrePrompt;
