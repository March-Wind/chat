import { Schema } from 'mongoose';
import Elementary, { preCheckConnection } from '../elementary';
import type { Model, Document } from 'mongoose';

interface IPrompt {
  name: string;
  icon: string;
  content: string;
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
  content: {
    type: String,
    required: true,
  },
});
// const promptModel = model('prompt', promptSchema);

class Prompt extends Elementary {
  schema = promptSchema;
  model: Model<IPrompt>;

  constructor() {
    const dbName = 'settings';
    const collectionName = 'prompts';
    const parentOptions = {
      uri: `mongodb://localhost:27017/${dbName}`,
      dbName,
      collectionName,
    };
    super(parentOptions);
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
  async queryPrompts() {
    const { model } = this;
    return await model.find();
  }
  @preCheckConnection
  async findOne(id: string) {
    const { model } = this;
    return await model.findOne({ _id: id });
  }
  transform(data: Document[]) {
    return data.map((item) => {
      return item.toObject({
        getters: true,
        virtuals: true,
        versionKey: false,
        transform(...arg: any[]) {
          const ret = arg[1];
          delete ret._id;
          return ret;
        },
      });
    });
  }
}

export default Prompt;
