import { Schema } from 'mongoose';
import Elementary, { ElementaryOptions, preCheckConnection } from '../elementary';
import { mongodb_uri } from '../../../env';
import type { Model, Types, FilterQuery } from 'mongoose';
// 这里忽略的token的状态
export interface AutoTokenModel {
  key: string;
  keyState: 'occupied' | 'idle' | 'expired';
  times: number;
  requestTokenUrl: string;
  token?: string;
  tokenExpiredTime?: Date;
  startTime?: string;
  estimatedEndTime?: string;
  rateLimiting?: Date;
  headers?: {
    // 'x-request-id': string;
    // 'vscode-sessionid': string;
    'vscode-machineid': string;
    'editor-version': string;
    'editor-plugin-version': string;
    'openai-organization': string;
    'openai-intent': string;
    'user-agent': string;
  };
}
export type InsetItemType = Required<Pick<AutoTokenModel, 'key' | 'requestTokenUrl'>> &
  Partial<Omit<AutoTokenModel, 'key' | 'headers'>> & { headers?: Partial<AutoTokenModel['headers']> };
export const defaultHeaders = {
  'vscode-machineid': '4b01dcbd455bdb9b67e196b03672a81e9b7fd071a0df0a6bc6c27495e7c3b9e9',
  'editor-version': 'vscode/1.84.2',
  'editor-plugin-version': 'copilot-chat/0.10.1',
  'openai-organization': 'github-copilot',
  'openai-intent': 'conversation-panel',
  'content-type': 'application/json',
  'user-agent': 'GitHubCopilotChat/0.10.1',
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
    requestTokenUrl: { type: String, required: true },
    token: { type: String },
    tokenExpiredTime: { type: Date },
    times: { type: Number, required: true, default: 0 },
    startTime: { type: String, required: true },
    estimatedEndTime: { type: String, required: true },
    rateLimiting: { type: Date },
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
  async findOneAndUpdate(query: FilterQuery<AutoTokenModel>, data: Partial<AutoTokenModel>) {
    const { model } = this;
    return await model.findOneAndUpdate(query, { $set: data });
  }
  async getIdleAutoToken() {
    const data = await this.findOneAndUpdate({ keyState: 'idle' }, { keyState: 'occupied' });
    if (!data) {
      return '';
    }
    const doc = Elementary.transform(data);
    return doc;
  }
}

export default AutoToken;
