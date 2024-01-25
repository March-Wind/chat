import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import HistoryMessage from '@/tools/mongodb/users/history-message';
import awaitWrap from '@/tools/await-wrap';

describe('操作topic的方法', () => {
  let mongoServer: MongoMemoryServer;
  let historyMessageDb: HistoryMessage;
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    historyMessageDb = new HistoryMessage({
      uuid: 'test',
      uri: mongoUri,
    });
  });

  afterAll(async () => {
    await historyMessageDb.drop();
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  it('step1: insert topic', async () => {
    const _id = new mongoose.Types.ObjectId();
    const [result, err] = await awaitWrap(
      historyMessageDb.addTopic({
        _id,
        title: '询问帮助',
        messages: [
          {
            role: 'user',
            content: '你好',
          },
        ],
      }),
    );
    expect(err).toBeUndefined();
    expect(result?.acknowledged).toBeTruthy();
    expect(result?.upsertedCount).toBe(1);

    await awaitWrap(historyMessageDb.queryTopicById(_id.toString()));
    const expectData = {
      uuid: 'test',
      topic: [
        {
          title: '询问帮助',
          createTime: expect.any(Number),
          messages: [
            {
              role: 'user',
              content: '你好',
            },
          ],
        },
      ],
    };

    expect(actualData).toEqual(expectData);
  });
  it('step2: push topic', async () => {
    const [result, err] = await awaitWrap(
      historyMessageDb.pushTopic({
        title: '健身计划',
        messages: [
          {
            role: 'user',
            content: '给我一个健身计划',
          },
        ],
      }),
    );
    expect(err).toBeUndefined();
    const expectResult = {
      acknowledged: true,
      modifiedCount: 1,
    };
    expect(result).toMatchObject(expectResult);
    const [user] = await awaitWrap(historyMessageDb.searchUserTopic());
    const actualData = user?.toObject({
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
    const expectData = {
      uuid: 'test',
      topic: [
        {
          title: '询问帮助',
          createTime: expect.any(Number),
          messages: [
            {
              role: 'user',
              content: '你好',
            },
          ],
        },
        {
          title: '健身计划',
          messages: [
            {
              role: 'user',
              content: '给我一个健身计划',
            },
          ],
        },
      ],
    };
    expect(actualData).toMatchObject(expectData);
  });
  it('step3: update topic', async () => {
    const [data, err] = await awaitWrap(
      historyMessageDb.resetTopic({
        title: '数字',
        messages: [
          {
            role: 'user',
            content: '1111',
          },
        ],
      }),
    );
    const actualData = data?.toObject({
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
    const expectData = {
      uuid: 'test',
      topic: [
        {
          title: '数字',
          createTime: expect.any(Number),
          messages: [
            {
              role: 'user',
              content: '1111',
            },
          ],
        },
      ],
    };
    expect(err).toBeUndefined();
    expect(actualData).toEqual(expectData);
  });

  // role: "assistant",
  // content: '您好，请问有什么需要帮助吗',
});

describe('操作messages的方法', () => {
  let mongoServer: MongoMemoryServer;
  let historyMessageDb: HistoryMessage;
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    historyMessageDb = new HistoryMessage({
      uuid: 'test',
      uri: mongoUri,
    });
    await historyMessageDb.connect();
    // await mongoose.connect(mongoUri);
    // db = mongoose.connection;
  });

  afterAll(async () => {
    await historyMessageDb.drop();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('已有topic 并且messages至少是[]时, push message', async () => {
    const [data, err] = await awaitWrap(
      historyMessageDb.insertTopic({
        title: '询问帮助',
        messages: [
          {
            role: 'user',
            content: '你好',
          },
        ],
      }),
    );
    expect(err).toBeUndefined();
    expect(typeof data?.topic?.[0]?.id).toBe('string');
    // to continue
    const [result, err2] = await awaitWrap(
      historyMessageDb.pushMessage(data?.topic?.[0]?.id, {
        role: 'assistant',
        content: '您好，请问有什么需要帮助吗',
      }),
    );
    expect(err2).toBeUndefined();
    const actualData = result?.toObject({
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
    const expectData = {
      uuid: 'test',
      topic: [
        {
          createTime: expect.any(Number),
          messages: [
            {
              role: 'user',
              content: '你好',
            },
            {
              role: 'assistant',
              content: '您好，请问有什么需要帮助吗',
            },
          ],
        },
      ],
    };
    expect(actualData).toMatchObject(expectData);
  });
});
