import { Schema } from 'mongoose';
import { Context } from 'koa';
import jwt from 'jsonwebtoken';
import Elementary, { ElementaryOptions, preCheckConnection } from '../elementary';
import { isObject } from '../../../tools/variable-type';
import { mongodb_uri } from '../../../env';
import type { Model } from 'mongoose';
import type Koa from 'koa';
export interface Session {
  userId: string;
  // event: string;
  data: Record<string, any>;
  updatedAt: Date;
  maxAge: number;
}

const sessionSchema = new Schema<Session>({
  userId: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
  maxAge: {
    type: Number,
    required: true,
  },
});

interface UserTemporaryParams extends Partial<ElementaryOptions> {}
class UserTemporary extends Elementary {
  schema = sessionSchema;
  model: Model<Session>;
  id: string;
  constructor(options: UserTemporaryParams = {}) {
    const dbName = 'settings';
    const collectionName = 'sessions';
    const defaultParentOptions = {
      uri: mongodb_uri,
      collectionName,
      dbName,
    };
    const parentOptions = options;
    const newParentOptions = {
      ...defaultParentOptions,
      ...parentOptions,
    };
    super(newParentOptions);
  }
  @preCheckConnection
  async get() {
    if (!this.id) {
      return {};
    }
    const { model } = this;
    const { data = {} } = (await model.findById(this.id)) || { data: {} };
    return data;
  }
  @preCheckConnection
  async set(data: Record<string, any>, maxAge: number) {
    if (this.id) {
      const { model } = this;
      const record = { _id: this.id, data, updatedAt: new Date(), maxAge };
      await model.findByIdAndUpdate(this.id, record, { upsert: true, safe: true });
    }
    return;
  }
  @preCheckConnection
  async drop() {
    const { model } = this;
    return await model.collection.drop();
  }
  @preCheckConnection
  async destroy(id: string) {
    const { model } = this;
    return model.deleteOne({ _id: id });
  }
  setId(id: string) {
    this.id = id;
  }
}

export default UserTemporary;

declare module 'koa' {
  interface Context {
    userTemporaryStore: UserTemporary; // 这里的类型可以根据您的需求进行更改
  }
}

const USER_TEMPORARY_STORE = Symbol('context#userTemporaryStore');
const _USER_TEMPORARY_STORE = Symbol('context#_userTemporaryStore');
const extendContext = (ctx: Koa.DefaultContext) => {
  Object.defineProperties(ctx, {
    [USER_TEMPORARY_STORE]: {
      // 防止外部修改
      get() {
        if (this[_USER_TEMPORARY_STORE]) return this[_USER_TEMPORARY_STORE];
        this[_USER_TEMPORARY_STORE] = new UserTemporary();
        return this[_USER_TEMPORARY_STORE];
      },
    },
    userTemporaryStore: {
      // 通过symbol作为key,来初始化对象，能防止外部访问和修改
      get() {
        return this[USER_TEMPORARY_STORE];
      },
      configurable: true,
    },
  });
};
const userTemporaryStore = (app: Koa<Koa.DefaultState, Koa.DefaultContext>) => {
  extendContext(app.context);
  return async function userTemporaryStore(ctx: Koa.Context, next: Koa.Next) {
    const authorization = ctx.request.header['authorization'];
    if (authorization) {
      const token = authorization.replace('Bearer ', '');
      try {
        const userInfo = jwt.decode(token);
        if (isObject(userInfo)) {
          const id = userInfo.id;
          ctx.userTemporaryStore.setId(id);
        }
      } catch (error) {
        console.log(error);
      }
    }
    await next();
  };
};
export { userTemporaryStore };
