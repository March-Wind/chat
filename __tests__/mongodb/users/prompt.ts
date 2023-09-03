import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Prompt from '@/tools/mongodb/users/prompt';
import awaitWrap from '@/tools/await-wrap';

describe('user-prompts', () => {
  jest.setTimeout(15000);
  let mongoServer: MongoMemoryServer;
  let promptDb: Prompt;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    promptDb = new Prompt({
      uuid: 'ming',
      uri: mongoUri + 'test',
    });
  });

  afterEach(async () => {
    await promptDb.drop();
  });
  afterAll(async () => {
    // await promptDb.drop();
    await promptDb.close();
    await mongoServer.stop();
  });

  it('insert a user prompt and findOne.[addPrompt-findOne]', async () => {
    const _id = new mongoose.Types.ObjectId();
    const [result, err] = await awaitWrap(
      promptDb.addPrompt({
        _id,
        name: '提示词1',
        icon: 'icon1',
        context: [{ role: 'system', content: '你来担任web专家来回答我的问题' }],
        modelConfig: {
          temperature: 0.2,
        },
      }),
    );
    expect(err).toBeUndefined();
    expect(result?.acknowledged).toBeTruthy();
    expect(result?.upsertedCount).toBe(1);

    // 查询验证
    const id = _id.toString();
    const [userPrompt, err2] = await awaitWrap(promptDb.findOne(id));
    expect(err2).toBeUndefined();
    expect(userPrompt?.prompts[0]?.name).toBe('提示词1');
  });

  it('push a user prompt and findOne.[addPrompt-findOne]', async () => {
    // 前置数据
    const _id1 = new mongoose.Types.ObjectId();
    const [result1, err1] = await awaitWrap(
      promptDb.addPrompt({
        _id: _id1,
        name: '提示词1',
        icon: 'icon1',
        context: [{ role: 'system', content: '你来担任web专家来回答我的问题' }],
        modelConfig: {
          temperature: 0.2,
        },
      }),
    );
    expect(err1).toBeUndefined();
    expect(result1?.acknowledged).toBeTruthy();
    expect(result1?.upsertedCount).toBe(1);

    // 测试用例
    const _id = new mongoose.Types.ObjectId();
    const [result, err] = await awaitWrap(
      promptDb.addPrompt({
        _id,
        name: '提示词2',
        icon: 'icon2',
        context: [{ role: 'system', content: '你来担任投资机构的芯片专家来回答我的问题' }],
        modelConfig: {
          temperature: 0,
        },
      }),
    );
    expect(err).toBeUndefined();
    expect(result?.acknowledged).toBeTruthy();
    expect(result?.modifiedCount || result?.upsertedCount).toBe(1);
    // 查询验证
    const id = _id.toString();
    const [userPrompt, err2] = await awaitWrap(promptDb.findOne(id));
    expect(err2).toBeUndefined();
    expect(userPrompt?.prompts[0]?.name).toBe('提示词2');
  });

  it('update a user prompt and findOne.[updatePrompt-findOne]', async () => {
    // 前置数据
    const _id1 = new mongoose.Types.ObjectId();
    const [result1, err1] = await awaitWrap(
      promptDb.addPrompt({
        _id: _id1,
        name: '提示词1',
        icon: 'icon1',
        context: [{ role: 'system', content: '你来担任web专家来回答我的问题' }],
        modelConfig: {
          temperature: 0.2,
        },
      }),
    );
    expect(err1).toBeUndefined();
    expect(result1?.acknowledged).toBeTruthy();
    expect(result1?.upsertedCount).toBe(1);

    // 测试用例
    const id = _id1.toString();
    const [result2, err2] = await awaitWrap(
      promptDb.updatePrompt(id, {
        name: '提示词replace',
        icon: 'icon1',
        context: [{ role: 'system', content: '你来担任投资机构的芯片专家来回答我的问题' }],
        modelConfig: {
          temperature: 0.5,
        },
      }),
    );
    expect(err2).toBeUndefined();
    expect(result2?.acknowledged).toBeTruthy();
    expect(result2?.modifiedCount).toBe(1);

    // 查询验证
    const [userPrompt3, err3] = await awaitWrap(promptDb.findOne());
    expect(err3).toBeUndefined();
    expect(userPrompt3?.prompts[0]?.name).toBe('提示词replace');
  });

  // it('find a user all prompts.[findOne]', async () => {
  //   const [userPrompt, err2] = await awaitWrap(promptDb.findOne());
  //   expect(err2).toBeUndefined();
  //   expect(userPrompt?.prompts[0]?.name).toBe('提示词replace');
  //   expect(userPrompt?.prompts[1]?.name).toBe('提示词2');
  // })
});
