import { Schema, Document } from 'mongoose';
import Elementary, { ElementaryOptions, preCheckConnection } from '../elementary';
import { messageSchema } from '../users/history-message';
import { mongodb_uri } from '../../../env';
import type { Model, Types } from 'mongoose';
import type { Message } from '../users/history-message';
import { isObject } from '../../../tools/variable-type';

type Context = Message;

const contextScheme = messageSchema;

export interface IPrompt {
  name: string;
  icon: string;
  context: Omit<Context, 'prePromptId'>[];
  modelConfig: {
    temperature: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

const promptSchema = new Schema<IPrompt>({
  name: {
    type: String,
    required: true,
  },
  icon: {
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
// const promptModel = model('prompt', promptSchema);
interface PromptParams extends Partial<ElementaryOptions> {}
class Prompt extends Elementary {
  schema = promptSchema;
  model: Model<IPrompt>;

  constructor(options: PromptParams = {}) {
    const dbName = 'settings';
    const collectionName = 'prompts';
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
  async insertOne(data: IPrompt) {
    const { model } = this;
    const doc = new model(data);
    return await doc.save();
  }
  @preCheckConnection
  async insertMany(data: IPrompt[]) {
    const { model } = this;
    return await model.insertMany(data);
  }
  @preCheckConnection
  async queryPrompts(): Promise<(IPrompt & { _id: Types.ObjectId })[]> {
    const { model } = this;
    // return await model.find({}, { context: 0 });
    return await model.aggregate([
      {
        $project: {
          name: 1,
          icon: 1,
          modelConfig: 1,
          context: {
            $filter: {
              input: '$context',
              as: 'item',
              cond: { $ne: ['$$item.role', 'system'] },
            },
          },
        },
      },
    ]);
  }
  @preCheckConnection
  async findOne(id: string) {
    const { model } = this;
    return await model.findOne({ _id: id });
  }
  // transform(data: Document[]) {
  //   if (data[0] instanceof Document) {
  //     return data.map((item) => {
  //       return item.toObject({
  //         getters: true,
  //         virtuals: true,
  //         versionKey: false,
  //         transform(...arg: any[]) {
  //           const ret = arg[1];
  //           delete ret._id;
  //           return ret;
  //         },
  //       });
  //     });
  //   }
  //   if (isObject(data[0])) {
  //     return data.map((item) => {
  //       const { _id, ...rest } = item;
  //       return {
  //         ...rest,
  //         id: _id.toString()
  //       }
  //     })
  //   }

  // }
}

export default Prompt;
