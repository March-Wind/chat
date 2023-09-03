import { createConnection, model } from 'mongoose';
import { sanitizeSlashes } from '../../tools/utils';
import type { Connection, Model, Schema, Document } from 'mongoose';

export interface ElementaryOptions {
  uri: string;
  dbName: string;
  collectionName: string;
}
type DocumentToObject<T> = Omit<T, '_id'> & {
  id?: string;
};
abstract class Elementary {
  protected dbName: string; // 数据库名
  protected collectionName: string; // 集合名字
  protected uri: string;
  protected connection: Connection | null;
  protected abstract model: Model<any>;
  protected abstract schema: Schema;
  constructor(options: ElementaryOptions) {
    const { dbName, collectionName, uri } = options;
    Object.defineProperties(this, {
      dbName: {
        value: dbName,
        writable: false,
        enumerable: false,
        configurable: false,
      },
      collectionName: {
        value: collectionName,
        writable: false,
        enumerable: false,
        configurable: false,
      },
      uri: {
        value: sanitizeSlashes(`${uri}/${dbName}`),
        writable: false,
        enumerable: false,
        configurable: false,
      },
    });
  }
  // async connect() {
  //   const { uri } = this;
  //   this.connection = await createConnection(uri);
  //   this.model = await this.connection.model(this.collectionName, this.schema);
  // }
  // async checkConnection() {
  //   if (!this.connection || this.connection.readyState === 0) {
  //     await this.connect();
  //   }
  // }
  connect() {
    const { uri } = this;
    this.connection = createConnection(uri);
    this.model = this.connection.model(this.collectionName, this.schema);
  }
  checkConnection() {
    if (!this.connection || this.connection.readyState === 0) {
      this.connect();
    }
  }
  async onError(cb: (err: any) => void) {
    // await this.checkConnection();
    this.checkConnection();
    this.connection?.on('error', cb);
  }
  async close() {
    await this.connection?.close();
    this.connection = null;
  }
  async drop() {
    // await this.checkConnection();
    this.checkConnection();
    const { model } = this;
    return await model.collection.drop();
  }
  /**
   * 将文档转成对象
   *
   * @static
   * @template T
   * @param {(T[] | T)} data
   * @return {*}  {(DocumentToObject<T>[] | DocumentToObject<T>)}
   * @memberof Elementary
   */
  static transform<T extends Document>(data: T): DocumentToObject<T>;
  static transform<T extends Document>(data: T[]): DocumentToObject<T>[];
  static transform<T extends Document>(data: T[] | T, removeId = false): DocumentToObject<T>[] | DocumentToObject<T> {
    const _transformDocument = (input: T): DocumentToObject<T> => {
      return input.toObject({
        getters: true,
        virtuals: true,
        versionKey: false,
        transform(...arg: any[]) {
          const ret = arg[1];
          delete ret._id;
          removeId && delete ret.id;
          return ret;
        },
      });
    };
    if (Array.isArray(data)) {
      return data.map((item) => {
        return _transformDocument(item);
      });
    }
    return _transformDocument(data);
  }
}

function preCheckConnection(...arg: any[]) {
  // 装饰器函数
  const [, , descriptor] = arg;
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    (this as any).checkConnection();
    // @resolve: 如果是异步，那么将返回promise,没有改变函数的返回结果。
    return originalMethod.apply(this, args);
  };
}

export default Elementary;
export { preCheckConnection };
