import { Schema } from 'mongoose';
import Elementary, { preCheckConnection } from '../elementary';
import type { BuiltinComponents } from '@fingerprintjs/fingerprintjs';
import type { Model } from 'mongoose';
// 用于获取Schema的参数ts类型
type SchemaParamType<T> = T extends Schema<any, any, any, any, any, any, any, infer ParamsType> ? ParamsType : never;

export interface FingerprintOptions {
  uri: string;
}
// export type FingerprintSchema = Omit<SchemaParamType<Fingerprint['schema']>, 'uuid'> & { uuid: string };
export type FingerprintSchema = SchemaParamType<Fingerprint['schema']>;

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
// const _model = model(collectionName, _schema);
/**
 * 用户数据库之指纹
 *
 * @class UserDb
 * @extends {MG}
 */
class Fingerprint extends Elementary {
  protected schema = _schema;
  protected model: Model<FingerprintSchema>;
  constructor() {
    const defaultOptions = {
      uri: 'mongodb://localhost:27017/fingerprints',
      dbName: 'users',
      collectionName: 'fingerprint',
    };
    super(defaultOptions);
  }
  // 根据邮箱查询用户是否存在
  @preCheckConnection
  async searchUserByEmail(uuid: string) {
    const { model } = this;
    return await model.findOne({ uuid }, { components: 1 });
  }
  // 查看数据库有多少条数据
  @preCheckConnection
  async countUser() {
    const { model } = this;
    return await model.countDocuments();
  }
  // 将注册的用户指纹放进数据库
  @preCheckConnection
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
