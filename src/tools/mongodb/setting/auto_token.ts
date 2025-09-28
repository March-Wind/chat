import { Schema } from 'mongoose';
import Elementary, { ElementaryOptions, preCheckConnection } from '../elementary';
import { mongodb_uri } from '../../../env';
import type { Model, Types, FilterQuery } from 'mongoose';
// 这里忽略的token的状态
export interface AutoTokenModel {
  key: string;
  keyState: 'occupied' | 'idle' | 'expired';
  tokenType: 'copilot' | 'transfer' | 'openai';
  origin: string;
  times: number;
  requestTokenUrl?: string;
  token?: string;
  tokenExpiredTime?: Date;
  startTime?: string;
  estimatedEndTime?: string;
  rateLimiting?: Date;
  exChangeTokenRestTime?: Date;
  requestTokenHeaders?: Record<string, string>;
  headers?: Record<string, string>;
}
export type InsetItemType = Required<Pick<AutoTokenModel, 'key' | 'requestTokenUrl'>> &
  Partial<Omit<AutoTokenModel, 'key' | 'headers'>> & { headers?: Partial<AutoTokenModel['headers']> };
export const defaultHeaders = {
  'vscode-machineid': '4b01dcbd455bdb9b67e196b03672a81e9b7fd071a0df0a6bc6c27495e7c3b9e9',
  'editor-version': 'vscode/1.86.2',
  'editor-plugin-version': 'copilot-chat/0.12.2',
  'openai-organization': 'github-copilot',
  'openai-intent': 'conversation-panel',
  'copilot-integration-id': 'vscode-chat',
  'content-type': 'application/json',
  'user-agent': 'GitHubCopilotChat/0.12.2',
  'x-github-api-version': '2023-07-07',
};

const autoTokenSchema = new Schema<AutoTokenModel>(
  {
    key: { type: String, required: true, index: true },
    keyState: {
      type: String,
      enum: ['occupied', 'idle', 'invalid'],
      default: 'idle',
      required: true,
    },
    tokenType: {
      type: String,
      enum: ['copilot', 'transfer', 'openai'],
      required: true,
    },
    origin: {
      type: String,
    },
    requestTokenUrl: { type: String },
    token: { type: String },
    tokenExpiredTime: { type: Date },
    times: { type: Number, required: true, default: 0 },
    startTime: { type: String, required: true },
    estimatedEndTime: { type: String, required: true },
    rateLimiting: { type: Date },
    exChangeTokenRestTime: { type: Date },
    requestTokenHeaders: {
      type: Object,
    },
    headers: {
      type: Object,
      required: true,
      default: defaultHeaders,
    },
  },
  { timestamps: true },
);

interface AutoTokenParams extends Partial<ElementaryOptions> {}

class AutoToken extends Elementary {
  schema = autoTokenSchema;
  model: Model<AutoTokenModel>;

  constructor(options: AutoTokenParams = {}) {
    const dbName = 'settings';
    const collectionName = 'auto-tokens';
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
  async drop() {
    const { model } = this;
    return await model.collection.drop();
  }
  @preCheckConnection
  async insertOne(data: InsetItemType) {
    const { model } = this;
    const doc = new model(data);
    return await doc.save();
  }
  @preCheckConnection
  async insertMany(data: InsetItemType[]) {
    const { model } = this;
    return await model.insertMany(data);
  }
  @preCheckConnection
  async queryAutoTokens(): Promise<(AutoTokenModel & { _id: Types.ObjectId })[]> {
    const { model } = this;
    return await model.find({});
  }
  @preCheckConnection
  async findOne(key: string) {
    const { model } = this;
    return await model.findOne({ key });
  }
  /**
   * 更新字段，传多少字段就更新多少字段
   *
   * @param {string} key
   * @param {Partial<AutoTokenModel>} data
   * @return {*}
   * @memberof AutoToken
   */
  @preCheckConnection
  async updateOne(key: string, data: Partial<AutoTokenModel>) {
    const { model } = this;
    // 如果更新了token，那么更新token的时间
    if (data.token) {
      const now = new Date(); // 获取当前时间
      now.setMinutes(now.getMinutes() + 10);
      data.tokenExpiredTime = now;
    }
    return await model.updateOne({ key }, { $set: data });
  }

  // @preCheckConnection
  // async updateOne_field<FieldName extends keyof AutoTokenModel>(key: string, field: FieldName, data: AutoTokenModel[FieldName]) {
  //   const { model } = this;
  //   return await model.updateOne({ key }, { $set: { [field]: data } });
  // }
  // @preCheckConnection
  // async updateOne_fields(key: string, data: AutoTokenModel) {
  //   if (isObject(data) === false) {
  //     throw new Error('data is not object')
  //   }
  //   const { model } = this;
  //   return await model.updateOne({ key }, { $set: data });
  // }
  @preCheckConnection
  async findOneAndUpdate(query: FilterQuery<AutoTokenModel>, data: Partial<AutoTokenModel> | Record<string, any>) {
    const { model } = this;
    // 如果 data 包含 MongoDB 操作符（如 $inc, $set 等），直接使用
    if (data && typeof data === 'object' && Object.keys(data).some((key) => key.startsWith('$'))) {
      return await model.findOneAndUpdate(query, data);
    }
    // 否则使用 $set 操作符
    return await model.findOneAndUpdate(query, { $set: data });
  }
  async getIdleAutoToken(tokenType: AutoTokenModel['tokenType'] = 'copilot') {
    // 构建查询条件
    const queryConditions: any[] = [
      { keyState: 'idle', tokenType: tokenType },
      { $or: [{ exChangeTokenRestTime: { $exists: false } }, { exChangeTokenRestTime: { $lt: new Date() } }] },
      { $or: [{ rateLimiting: { $exists: false } }, { rateLimiting: { $lt: new Date() } }] },
    ];

    // 如果不是 copilot 类型，添加 times < 10 的条件
    if (tokenType !== 'copilot') {
      queryConditions.push({ times: { $lt: 10 } });
    }

    const data = await this.findOneAndUpdate(
      // 当前时间超出速率限制时间，和超出交换token冷静期
      {
        $and: queryConditions,
        //     keyState: 'idle',
        //   $or: [
        //     { exChangeTokenRestTime: { $exists: false } }, // 没有exChangeTokenRestTime字段
        //     { exChangeTokenRestTime: { $lt: new Date() } } // exChangeTokenRestTime大于当前时间
        // ],
        //   exChangeTokenRestTime: { $lt: new Date() }, rateLimiting: { $lt: new Date() }
      },

      tokenType === 'copilot' ? { keyState: 'occupied' } : { $inc: { times: 1 } },
    );
    if (!data) {
      return '';
    }
    const doc = Elementary.transform(data);
    return doc;
  }

  /**
   * 减少指定 key 的 times 计数
   * 只有当 times > 0 时才执行减法，确保 times 不会小于 0
   *
   * @param {string} key
   * @return {*} 返回更新结果，包含 matchedCount 和 modifiedCount
   * @memberof AutoToken
   */
  @preCheckConnection
  async decreaseTimes(key: string) {
    const { model } = this;
    const result = await model.updateOne(
      { key, times: { $gt: 0 } }, // 只有当 times > 0 时才更新
      { $inc: { times: -1 } },
    );

    // 添加日志以便调试
    if (result.matchedCount === 0) {
      console.warn(`decreaseTimes: 没有找到匹配的记录或 times <= 0, key: ${key}`);
    } else if (result.modifiedCount === 0) {
      console.warn(`decreaseTimes: 找到记录但未修改, key: ${key}`);
    } else {
      console.log(`decreaseTimes: 成功减少 times, key: ${key}`);
    }

    return result;
  }
}

export default AutoToken;
