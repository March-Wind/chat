import mongoose, { Schema, model } from 'mongoose';
import Elementary, { preCheckConnection } from '../elementary';
import awaitWrap from '../../await-wrap';
import type { Document, Types, Model, UpdateWriteOpResult } from 'mongoose';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
export type MessageSchema = Message;
const messageSchema = new Schema<Message>({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

interface Topic {
  title?: string;
  createTime?: Date;
  lastUpdateTime?: Date;
  messages: Message[];
}
interface TopicSchema extends Topic {
  messages: Types.DocumentArray<Message>;
}
const topicSchema = new Schema<TopicSchema>({
  title: String,
  createTime: {
    type: Date,
    default: Date.now,
    get: (value: Date) => {
      return value.getTime();
    },
  },
  lastUpdateTime: {
    type: Date,
    default: Date.now,
    get: (value: Date) => {
      return value.getTime();
    },
  },
  messages: {
    type: [messageSchema],
    required: true,
  },
});

interface HistoryMessageT {
  uuid: string;
  topics: Topic[];
}
interface HistoryMessageSchema extends HistoryMessageT {
  topics: Types.DocumentArray<TopicSchema>;
}
const historyScheme = new Schema<HistoryMessageSchema>({
  uuid: {
    type: String,
    required: true,
    index: true,
  },
  topics: {
    // 这里即使不写，也不会校验报错，会默认给一个[]
    type: [topicSchema],
    required: true,
  },
});

historyScheme.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const query = this.getQuery();
  // to do 这里的类型怎么写
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (update && update['$push'] && update['$push']['topics.$.messages']) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const topicIndex = update['$push']['topics.$.messages']['$position'];
    const topicLastUpdateTime = new Date();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.findOneAndUpdate(query, { $set: { [`topics.$.lastUpdateTime`]: topicLastUpdateTime } });
    next();
  } else {
    next();
  }
});

const messageModel = model('message', messageSchema);
// type DFG2 = SchemaParamType<SchemaParamTypeSix<typeof historyModel>>;
// export type MessageSchema = SchemaParamType<typeof messageSchema>;
// type TopicSchema = SchemaParamType<typeof topicSchema>;
// export type TopicType = Part<TransformInterface<TopicSchema>, 'createTime' | "lastUpdateTime">;
// 不知道为啥嵌套的多了，类型就变了 to do 类型对不上
// type HistoryMessageSchema = SchemaParamType<typeof historyScheme>;
// type HistoryMessageSchema = { uuid: string; topics: TopicSchema[] };
// export type HistoryMessageType = TransformInterface<HistoryMessageSchema>;

interface HistoryMessageParams {
  uuid: string;
}

class HistoryMessage extends Elementary {
  protected declare options: HistoryMessageParams;
  schema = historyScheme;
  model: Model<HistoryMessageSchema>;
  static createMessage = (content: string, role: 'user' | 'assistant' | 'system' = 'user'): MessageSchema => {
    return { role, content };
  };
  constructor(options: HistoryMessageParams) {
    const dbName = 'users';
    const collectionName = 'historyMessage';
    const parentOptions = {
      uri: `mongodb://localhost:27017/${dbName}`,
      collectionName,
      dbName,
    };
    super(parentOptions);
    this.options = { uuid: options.uuid };
  }
  @preCheckConnection
  async drop() {
    const { model } = this;
    return await model.collection.drop();
  }

  @preCheckConnection
  async searchUserTopic() {
    const { model, options } = this;
    const { uuid } = options;
    return await model.findOne({ uuid });
  }

  @preCheckConnection
  async queryTopicById(topicId: string): Promise<TopicSchema> {
    const { model, options } = this;
    const { uuid } = options;
    // return await model.findOne({ uuid, 'topics._id': topicId }, { "topics.$": 1 })
    const data = await model.aggregate([
      {
        $match: {
          uuid,
        },
      },
      {
        $unwind: '$topics',
      },
      {
        $match: {
          'topics._id': new mongoose.Types.ObjectId(topicId),
        },
      },
      {
        $project: { _id: 0, topics: { _id: 0, messages: { _id: 0 } } },
      },
    ]);
    return data[0].topics;
  }
  /**
   * 加入一个Topic，会根据数据库的情况选择使用insert还是update还是push
   *
   * @param {Topic} topic
   * @return {*}
   * @memberof HistoryMessage
   */
  @preCheckConnection
  async addTopic(topic: Topic) {
    const [exists, err] = await awaitWrap(Promise.all([this.checkExistentUser(), this.checkExistentTopic()]));
    if (err) {
      return Promise.reject(err);
    }
    if (exists?.[0]) {
      if (exists?.[1]) {
        return await this.pushTopic(topic);
      } else {
        return await this.resetTopic(topic);
      }
    } else {
      return await this.insertTopic(topic);
    }
  }

  /**
   * 没有topic的时候，加入一个topic
   *
   * @param {Topic} topic
   * @return {*}
   * @memberof HistoryMessage
   */
  @preCheckConnection
  async insertTopic(topic: Topic) {
    const { model } = this;
    const { uuid } = this.options;

    const historyMessage = new model({
      uuid,
      topics: topic,
      // topic: [{
      //   createTime: Date.now(),
      //   messages: [message]
      // }]
    });
    return await historyMessage.save();
  }
  /**
   * 将所有的topic重置为一个topic或[].
   *
   * @param {Topic} topic
   * @return {*}
   * @memberof HistoryMessage
   */
  @preCheckConnection
  async resetTopic(topic?: Topic) {
    const { model } = this;
    const { uuid } = this.options;
    const query = { uuid };
    const update = {
      topics: topic ? [] : [topic],
    };
    return await model.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      projection: { topics: { $slice: -1 } },
    });
  }
  /**
   * 删除某个topic
   *
   * @param {string} topicId
   * @return {*}
   * @memberof HistoryMessage
   */
  @preCheckConnection
  async deleteTopic(topicId: string) {
    const { model } = this;
    const { uuid } = this.options;
    // return await model.findOneAndUpdate({ uuid }, {
    return await model.updateOne(
      { uuid },
      {
        $pull: {
          topics: {
            _id: topicId,
          },
        },
      },
    );
  }
  /**
   * 清空所有的topic
   * 是不是和resetTopic方法重复了
   * @return {*}
   * @memberof HistoryMessage
   */
  @preCheckConnection
  async clearTopics() {
    const { model } = this;
    const { uuid } = this.options;
    // return await model.findOneAndUpdate({ uuid }, {
    return await model.updateOne(
      { uuid },
      {
        $set: {
          topics: [],
        },
      },
      { new: true },
    );
  }
  @preCheckConnection
  async pushTopic(topic: Topic) {
    const { model } = this;
    const { uuid } = this.options;
    return await model.findOneAndUpdate(
      { uuid },
      {
        $push: {
          topics: topic,
        },
      },
      { new: true },
    );
  }

  /**
   * push消息
   *
   * @param {string} topicId
   * @param {MessageSchema} message
   * @return {*}
   * @memberof HistoryMessage
   */

  // async pushMessage(topicId: string, message: MessageSchema, queryDoc: true): Promise<Document<unknown, {}, HistoryMessageSchema> | null>
  // async pushMessage(topicId: string, message: MessageSchema, queryDoc: false): Promise<UpdateWriteOpResult>
  // async pushMessage(topicId: string, message: MessageSchema): Promise<UpdateWriteOpResult>
  @preCheckConnection
  async pushMessage(topicId: string, message: MessageSchema): Promise<UpdateWriteOpResult> {
    const { model } = this;
    const { uuid } = this.options;
    const newMessage = new messageModel(message);
    // const fn = queryDoc ? model.findOneAndUpdate : model.updateOne;
    // 不能这样写:{ new: true, projection: { 'topics.$': 1 } }. 更新文档可能导致位置投影发生错误
    // const options = queryDoc ? { projection: { 'topics.$': 1 } } : undefined;
    // return await fn.bind(model)({ uuid, 'topics._id': topicId }, {
    //   $push: {
    //     'topics.$.messages': newMessage
    //   }
    // }, options)
    return await model.updateOne(
      { uuid, 'topics._id': topicId },
      {
        $push: {
          'topics.$.messages': newMessage,
        },
      },
    );
  }
  // /**
  //  * 重置消息
  //  *
  //  * @param {string} topicId
  //  * @param {MessageSchema} message
  //  * @return {*}
  //  * @memberof HistoryMessage
  //  */
  // async resetMessage(topicId: string, message: MessageSchema) {
  //   await this.checkConnect();
  //   const { model } = this;
  //   const { uuid } = this.options;
  //   return await model.findOneAndUpdate({ uuid, 'topics._id': topicId }, {
  //     $set: {
  //       'topics.$.messages': [message]
  //     }
  //   }, { new: true })
  // }
  @preCheckConnection
  async checkExistentUser() {
    const { model } = this;
    const { uuid } = this.options;
    return await model.exists({ uuid });
  }
  @preCheckConnection
  async checkExistentTopic() {
    const { model } = this;
    const { uuid } = this.options;
    const [user, err] = await awaitWrap(model.findOne({ uuid }));
    if (err) {
      return Promise.reject(err);
    }
    if (user?.topics) {
      return true;
    } else {
      return false;
    }
  }
  topic2openaiRequset(topic: Document) {
    return topic.toObject({
      getters: true,
      virtuals: true,
      versionKey: false,
      transform(doc, ret, options) {
        console.log(doc, ret, options);
        delete ret._id;
        delete ret.id;
        return ret;
      },
    });
  }

  @preCheckConnection
  async queryTopics() {
    const { model } = this;
    const { uuid } = this.options;
    return await model.aggregate([
      {
        $match: { uuid },
      },
      {
        $unwind: '$topics',
      },
      {
        $replaceRoot: {
          newRoot: '$topics',
        },
      },
      {
        $sort: { lastUpdateTime: -1 },
      },
      {
        $addFields: {
          lastUpdateTime: { $toLong: '$lastUpdateTime' },
          createTime: { $toLong: '$createTime' },
          id: { $toString: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          messages: 0,
        },
      },
    ]);
  }
  @preCheckConnection
  async queryTopicMessages(topicId: string): Promise<(MessageSchema & { id: string })[]> {
    const { model } = this;
    const { uuid } = this.options;
    return await model.aggregate([
      {
        $match: {
          uuid,
        },
      },
      {
        $unwind: '$topics',
      },
      {
        $match: {
          'topics._id': new mongoose.Types.ObjectId(topicId),
        },
      },
      // $unwind之后再$replaceRoot就成功了
      {
        $unwind: '$topics.messages',
      },
      {
        $addFields: {
          'topics.messages.id': { $toString: '$topics.messages._id' },
        },
      },
      {
        $project: {
          'topics.messages._id': 0, // 0表示不输出该字段
        },
      },
      {
        $replaceRoot: { newRoot: '$topics.messages' },
      },
    ]);
  }

  @preCheckConnection
  async queryFirstFewMessages(topicId: string, count = 3): Promise<MessageSchema[]> {
    const { model } = this;
    const { uuid } = this.options;
    const [data, err] = await awaitWrap(
      model.aggregate([
        {
          $match: {
            uuid,
          },
        },
        {
          $unwind: '$topics',
        },
        {
          $match: {
            'topics._id': new mongoose.Types.ObjectId(topicId),
          },
        },
        {
          $project: {
            _id: 0,
            // messages: {
            //   $slice: ['$topics.messages', 0, count]
            // }
            messages: {
              $slice: [
                {
                  $map: {
                    input: '$topics.messages',
                    as: 'message',
                    in: {
                      role: '$$message.role',
                      content: '$$message.content',
                    },
                  },
                },
                count,
              ],
            },
          },
        },
      ]),
    );
    if (err) {
      return Promise.reject(err);
    }
    const result = data![0]?.messages;
    return result;
  }

  @preCheckConnection
  async setTopicTitle(topicId: string, title: string) {
    const { model } = this;
    const { uuid } = this.options;
    return await model.findOneAndUpdate(
      { uuid, 'topics._id': topicId },
      {
        $set: {
          'topics.$.title': title,
        },
      },
      { new: true },
    );
  }

  @preCheckConnection
  async deleteMessage(topicId: string, messageId: string) {
    const { model } = this;
    const { uuid } = this.options;
    // return await model.findOneAndUpdate({ uuid, 'topics._id': topicId }, {
    return await model.updateOne(
      { uuid, 'topics._id': topicId },
      {
        $pull: {
          'topics.$.messages': {
            _id: new mongoose.Types.ObjectId(messageId),
          },
        },
      },
      { new: true },
    );
  }

  async replaceMessages(topicId: string, newMessage: MessageSchema, messageId: string): Promise<void>;
  async replaceMessages(
    topicId: string,
    newMessage: MessageSchema,
    messageId: undefined,
    reserveIndex: number,
  ): Promise<void>;
  @preCheckConnection
  async replaceMessages(
    topicId: string,
    newMessage: MessageSchema,
    messageId?: string,
    reserveIndex?: number,
  ): Promise<void> {
    const { model } = this;
    const { uuid } = this.options;
    console.log(newMessage, messageId, reserveIndex);
    if (messageId !== undefined) {
      const result = await model.updateOne(
        {
          uuid,
          'topics._id': new mongoose.Types.ObjectId(topicId),
          'topics.messages._id': new mongoose.Types.ObjectId(messageId),
        },
        {
          $set: {
            'topics.$.messages.$[elem]': newMessage,
          },
        },
        { arrayFilters: [{ 'elem._id': { $eq: new mongoose.Types.ObjectId(messageId) } }] },
      );
      if (!result.acknowledged || result.modifiedCount !== 1) {
        throw new Error('替换失败');
      }
    }

    if (reserveIndex !== undefined) {
      const result1 = await model.updateOne(
        { uuid, 'topics._id': new mongoose.Types.ObjectId(topicId) },
        {
          // 删除两个之后的元素成功
          // 因为$slice不能在顶层，因为$slice是一个数组操作符，只能在数组操作符内部使用，所以需要用$push来实现
          // 为什么$each: [],中不能写，$each:[newMessage],暂时不知道，to study
          $push: {
            'topics.$.messages': {
              $each: [],
              $slice: reserveIndex + 1,
            },
          },
        },
      );
      if (!result1.acknowledged || result1.modifiedCount !== 1) {
        throw new Error('删除失败');
      }
      const result2 = await model.updateOne(
        { uuid, 'topics._id': new mongoose.Types.ObjectId(topicId) },
        {
          $push: {
            'topics.$.messages': newMessage,
          },
        },
      );
      if (!result2.acknowledged || result2.modifiedCount !== 1) {
        throw new Error('增加失败');
      }
    }
  }
}

export default HistoryMessage;

// [
//   {
//     uuid: 'xxxx',
//     topics: [
//       {
//         titile: 'xxxx',
//         messages: [
//           { role: 'xxx', content: 'xxx' }
//           // ...有很多条数据
//         ]
//       }
//     ]
//   }
// ]
