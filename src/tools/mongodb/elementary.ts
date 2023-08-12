import { createConnection, model } from 'mongoose';

import type { Connection, Model, Schema } from 'mongoose';

interface ElementaryOptions {
  uri: string;
  dbName: string;
  collectionName: string;
}
abstract class Elementary {
  protected dbName: string; // 数据库名
  protected collectionName: string; // 集合名字
  protected uri: string;
  protected connection: Connection;
  protected abstract model: Model<any>;
  protected abstract schema: Schema;
  constructor(options: ElementaryOptions) {
    Object.defineProperty(this, 'dbName', {
      value: options.dbName,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.defineProperty(this, 'collectionName', {
      value: options.collectionName,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.defineProperty(this, 'uri', {
      value: options.uri,
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }
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
  onError(cb: (err: any) => void) {
    this.connection.on('error', cb);
  }
  close() {
    this.connection?.close();
  }
}

function preCheckConnection(...arg: any[]) {
  // 装饰器函数
  const [, , descriptor] = arg;
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    (this as any).checkConnection();
    return originalMethod.apply(this, args);
  };
}

export default Elementary;
export { preCheckConnection };
