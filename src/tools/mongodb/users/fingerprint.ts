import mongoose, { Schema, model } from 'mongoose';
import type { BuiltinComponents } from '@fingerprintjs/fingerprintjs';

// 用于获取Schema的参数ts类型
type SchemaParamType<T> = T extends Schema<any, any, any, any, any, any, any, infer ParamsType> ? ParamsType : never;

export interface FingerprintOptions {
  uri: string;
}
// export type FingerprintSchema = Omit<SchemaParamType<Fingerprint['schema']>, 'uuid'> & { uuid: string };
export type FingerprintSchema = SchemaParamType<Fingerprint['schema']>;

const collectionName = 'fingerprint';
const _schema = new Schema({
  uuid: {
    type: String,
    required: true,
    index: true,
    get: (v: Buffer) => v.toString(),
    set: (v: string) => Buffer.from(v, 'utf-8'),
  },
  fingerComponents: {} as BuiltinComponents,
});
const _model = model(collectionName, _schema);
/**
 * 用户数据库之指纹
 *
 * @class UserDb
 * @extends {MG}
 */
class Fingerprint {
  protected dbName = 'users'; // 数据库名
  protected collectionName = collectionName; // 集合名字
  options: FingerprintOptions;
  schema = _schema;
  private model = _model;
  constructor(options?: Partial<FingerprintOptions>) {
    Object.defineProperty(this, 'dbName', {
      value: 'users',
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.defineProperty(this, 'collectionName', {
      value: 'fingerprint',
      writable: false,
      enumerable: false,
      configurable: false,
    });

    const defaultOptions: FingerprintOptions = {
      uri: `mongodb://localhost:27017/${this.dbName}`,
    };
    const _options: FingerprintOptions = {
      ...defaultOptions,
      ...options,
    };
    this.options = _options;
  }
  async connect() {
    const { uri } = this.options;
    await mongoose.connect(uri);
  }
  // 检查连接状态
  async checkConnect() {
    // to experiment
    console.log(mongoose.connections);
    console.log(mongoose.connection.models);
    const { readyState } = mongoose.connection;
    if (readyState === 0 || readyState === 99) {
      await this.connect();
    }
  }
  // 根据邮箱查询用户是否存在
  async searchUserByEmail(uuid: string) {
    const { model } = this;
    return await model.findOne({ uuid }, { components: 1 });
  }
  // 查看数据库有多少条数据
  async countUser() {
    const { model } = this;
    return await model.countDocuments();
  }
  // 将注册的用户指纹放进数据库
  async insertFingerPrint(user: FingerprintSchema) {
    const { model } = this;
    const { uuid, fingerComponents } = user;
    const _fingerPrint = {
      uuid,
      fingerComponents,
    };
    const data = new model(_fingerPrint);
    return await data.save();
  }
}

export default Fingerprint;
