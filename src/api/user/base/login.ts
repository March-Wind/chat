import jwt from 'jsonwebtoken';
import Router from '@koa/router';
import UserBase from '../../../tools/mongodb/users/baseInfo';
import type { BaseInfoSchema } from '../../../tools/mongodb/users/baseInfo';
import awaitWrap from '../../../tools/await-wrap';
import { secret_key } from '../../../env';
import { successStatus, failStatus } from '../../../constant';
import { isString } from '../../../tools/variable-type';

import type { Secret } from 'jsonwebtoken';
type Body = Pick<BaseInfoSchema, 'email' | 'password'>;

const validateType = async (body: Body) => {
  const { email, password } = body;
  if (!isString(email)) {
    return Promise.reject('参数不合法');
  }
  if (!isString(password)) {
    return Promise.reject('参数不合法');
  }
};
const process = async (body: Body) => {
  const [, err] = await awaitWrap(validateType(body));
  if (err) {
    return Promise.reject('参数不合法!');
  }

  const { email, password } = body;
  if (email) {
    const userBase = new UserBase();
    const data = await userBase.searchUserByEmail(email, ['uuid', 'name', 'password']);
    if (!data) {
      return Promise.reject('用户不存在');
    }
    if (data) {
      if (data.password !== password) {
        return Promise.reject('密码错误');
      }
    }
    const _data = UserBase.transformDocument(data);
    await userBase.close();
    return Promise.resolve(_data);
  }
};
const loginUser = (router: Router) => {
  // 登录接口
  router.post('/login', async (ctx, next) => {
    const body = ctx.request.body as Body;
    const [data, err] = await awaitWrap(process(body));
    if (err) {
      ctx.body = {
        status: failStatus,
        msg: err,
      };
      ctx.status = 400;
    } else {
      const token = jwt.sign(
        { email: body.email, name: data!.name, uuid: data!.uuid, id: data!.id },
        secret_key as Secret,
        {
          expiresIn: '1h',
        },
      );
      ctx.body = {
        status: successStatus,
        msg: '登录成功',
        data: {
          token,
          name: data!.name,
          email: body.email,
        },
      };
    }
    return await next();
  });
};

export default loginUser;
