// import MG from "../base";
// import type { MGOptions } from "../base";
import mongoose, { Schema, model } from 'mongoose';
// import awaitWrap from "../../await-wrap";
// import { Mixin } from 'ts-mixer';
import type { SchemaParamType } from '../types';
import type { UpdatedInterface } from '../../../tool';
// const { Schema, Document } = mongoose;
export interface baseInfoOptions {
  uri: string;
}
// export type BaseInfoSchema = Omit<SchemaParamType<BaseInfo['schema']>, 'uuid'> & { uuid: string };
export type BaseInfoSchema = SchemaParamType<BaseInfo['schema']>;

const collectionName = 'baseInfo';
const _schema = new Schema({
  // schame模式定义的类型校验在set之前校验
  uuid: {
    type: String,
    required: true,
    index: true,
    get: (value: Buffer): string => value.toString(), // 转换为字符串
    set: (value: string): Buffer => Buffer.from(value, 'utf-8'), // 转换为 Buffer
  },
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
    validate: {
      validator: (v: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: '请输入有效的邮箱地址',
    },
  },
  name: {
    // required: true,
    firstName: {
      type: String,
      required: true,
      validate: [
        {
          validator: (v: string) => {
            return /^[A-Za-z\u4e00-\u9fa5]{1,10}$/.test(v);
          },
          message: '请输入有效的姓氏',
        },
      ],
    },
    lastName: {
      type: String,
      required: true,
      validate: [
        {
          validator: (v: string) => {
            return /^[A-Za-z\u4e00-\u9fa5]{1,10}$/.test(v);
          },
          message: '请输入有效的名字',
        },
      ],
    },
  },
  password: {
    type: String,
    required: true,
    validate: [
      {
        validator: (v: string) => {
          return /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[\!\@\#\$\%\^\&\*\-\_\?])[0-9a-zA-Z\!\@\#\$\%\^\&\*\-\_\?]+$/g.test(v);
        },
        message: '必须包含数字、字母、部分特殊符号,这三种字符类型',
      },
      {
        validator: (v: string) => {
          return /[A-Z]+/.test(v);
        },
        message: '至少有一个大写字母',
      },
      {
        validator: (v: string) => {
          return /^.{8,16}$/.test(v);
        },
        message: '密码长度为8~16位',
      },
    ],
  },
});
// 上升到程序里是唯一的，保证不重复创建模型
const _model = model(collectionName, _schema);
/**
 * 用户数据库之基础信息
 *
 * @class UserDb
 * @extends {MG}
 */
class BaseInfo {
  protected dbName = 'users'; // 数据库名
  protected collectionName = collectionName; // 集合名字
  options: baseInfoOptions;
  private schema = _schema;
  private model = _model;
  constructor(options?: Partial<baseInfoOptions>) {
    Object.defineProperty(this, 'dbName', {
      value: this.dbName,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.defineProperty(this, 'collectionName', {
      value: this.collectionName,
      writable: false,
      enumerable: false,
      configurable: false,
    });

    const defaultOptions: baseInfoOptions = {
      uri: `mongodb://localhost:27017/${this.dbName}`,
    };
    const _options: baseInfoOptions = {
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
  async searchUserByEmail(email: string, pick: (keyof BaseInfoSchema)[] = ['email', 'name']) {
    const { model } = this;
    await this.checkConnect();
    const projection: Partial<UpdatedInterface<BaseInfoSchema, number>> = {};
    pick.forEach((item) => {
      projection[item] = 1;
    });
    return await model.findOne({ email }, projection);
  }
  // 查看数据库有多少条数据
  async countUser() {
    const { model } = this;
    return await model.countDocuments();
  }
  // 将注册的用户放进数据库
  async insertUser(user: BaseInfoSchema) {
    const { model } = this;
    const { email, uuid, password, name } = user;
    const _baseInfo: BaseInfoSchema = {
      email,
      uuid,
      password,
      name,
    };
    const data = new model(_baseInfo);
    return await data.save();
  }
  async close() {
    await mongoose.connection.close();
  }
}

export default BaseInfo;
