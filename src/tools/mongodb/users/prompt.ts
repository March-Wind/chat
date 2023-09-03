import { Schema } from 'mongoose';
import Elementary, { preCheckConnection } from '../elementary';
import { messageSchema } from '../users/history-message';
import { mongodb_uri } from '../../../env';
import type { Model, Document, Types } from 'mongoose';
import type { Message } from '../users/history-message';
import type { ElementaryOptions } from '../elementary';

type Context = Omit<Message, 'prePromptId'>;

const contextScheme = messageSchema;

export interface IPrompt {
  name: string;
  avatar: string;
  context: Context[];
  modelConfig: {
    temperature: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}
interface IPromptDoc extends IPrompt {
  _id?: Types.ObjectId;
}
const promptSchema = new Schema<IPrompt>({
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  context: {
    type: [contextScheme],
    required: true,
  },
  modelConfig: {
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      required: true,
    },
    frequency_penalty: {
      type: Number,
      min: -2,
      max: 2,
    },
    presence_penalty: {
      type: Number,
      min: -2,
      max: 2,
    },
  },
});

interface UserPrompt {
  uuid: string;
  prompts: IPromptDoc[];
}

const UserPromptSchema = new Schema<UserPrompt>({
  uuid: {
    type: String,
    required: true,
  },
  prompts: {
    type: [promptSchema],
    required: true,
  },
});
// const promptModel = model('prompt', promptSchema);
interface Options extends Partial<ElementaryOptions> {
  uuid: string;
}

class Prompt extends Elementary {
  schema = UserPromptSchema;
  model: Model<UserPrompt>;
  options: Options;
  constructor(options: Options) {
    const { uuid, ...parentOptions } = options;
    const dbName = 'users';
    const collectionName = 'prompts';
    const defaultParentOptions = {
      uri: mongodb_uri,
      collectionName,
      dbName,
    };
    const newParentOptions = {
      ...defaultParentOptions,
      ...parentOptions,
    };
    super(newParentOptions);
    this.options = { uuid };
  }
  /**
   * 增加一条用户prompt，如果有这个用户就push prompt，没有就创建一个用户并添加prompt数据
   *
   * @param {IPromptDoc} data
   * @return {*}
   * @memberof Prompt
   */
  @preCheckConnection
  async addPrompt(data: IPromptDoc) {
    const { model, options } = this;
    return await model.updateOne(
      { uuid: options.uuid },
      {
        $push: { prompts: data }, // 添加到 prompts 数组
        $setOnInsert: { uuid: options.uuid }, // 在插入时设置 uuid.(插入时才会生效)
      },
      { upsert: true },
    );
  }
  @preCheckConnection
  async queryPrompts() {
    const { model, options } = this;
    const { uuid } = options;
    return await model.findOne({ uuid }, { prompts: 1 });
  }
  @preCheckConnection
  async findOne(id?: string) {
    const { model, options } = this;
    const { uuid } = options;
    return await model.findOne({ uuid, ...(id ? { 'prompts._id': id } : {}) }, id ? { 'prompts.$': 1 } : {});
  }
  @preCheckConnection
  async updatePrompt(id: string, data: IPromptDoc) {
    const { model, options } = this;
    const { uuid } = options;
    const update: Record<string, any> = {};
    (Object.keys(data) as (keyof IPrompt)[]).forEach((key) => {
      update[`prompts.$.${key}`] = data[key];
    });
    return await model.updateOne(
      { uuid, 'prompts._id': id },
      {
        $set: update,
      },
    );
  }
}

export default Prompt;
