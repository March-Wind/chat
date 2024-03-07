import apiChannelScheduler from './apiChannelScheduler';
import Tokens from './tokens';
import { retry } from '@marchyang/enhanced_promise';
import type { ChatCompletionMessageParam, ChatCompletionChunk } from 'openai/src/resources/chat/completions';
import type { Stream } from 'openai/src/streaming';
import type { ChatCompletion } from 'openai/resources/index';
import type { EncapsulatedOpenAI, EncapsulatedCopilot } from './apiChannelScheduler';
// ChatCompletion, ChatCompletionMessageParam
// import type { Stream_ChatCompletion } from './types';
export interface Props {
  model?: Tokens['model']; // 模型
  // model?: string;
  stream?: boolean; //是否是流式
  context?: ChatCompletionMessageParam[]; // 上下文
  temperature?: number; // 回答的温度，也是答案概率程度
  frequency_penalty?: number; // 生成的词，会进行去重处理
  presence_penalty?: number; //
}

class Chat {
  private tokens: Tokens;
  private tokensCount: number;
  public answer: ChatCompletionMessageParam & { receiving?: string; id?: string };
  private model: Tokens['model'];
  private stream: boolean;
  private context: ChatCompletionMessageParam[]; // 上下文
  private askContent: ChatCompletionMessageParam[]; // 提问内容
  private temperature: number;
  private frequency_penalty: number;
  private presence_penalty: number;
  private resp: ChatCompletion | Stream<ChatCompletionChunk> | null = null;
  // private unexpectedReturns = '';
  // private callerFinish: Function | null = null
  private caller: EncapsulatedOpenAI | EncapsulatedCopilot;
  constructor(props?: Props) {
    const defaultOptions: Required<Props> = {
      stream: true,
      // model: 'gpt-3.5-turbo',
      // model: 'gpt-4-32k',
      model: 'gpt-4',
      context: [],
      temperature: 0.5,
      frequency_penalty: 1,
      presence_penalty: 1,
    };
    const initOptions = {
      ...defaultOptions,
      ...props,
    };

    // 设置对应的模型的key
    // const apiKey_4_0 = openai_key_40?.split(',') || [];
    // const apiKey_3_5 = openai_key_35?.split(',') || [];
    // const apiKey = initOptions.model === 'gpt-4' ? apiKey_4_0[0] : apiKey_3_5[0];
    // super({ apiKey });
    // 初始化对话上下文以及对话的规格参数
    this.context = initOptions.context;
    this.askContent = this.context;
    this.tokens = new Tokens({ model: initOptions.model });
    // this.recordTokensCount(initOptions.system);
    Object.defineProperties(this, {
      stream: {
        enumerable: true,
        configurable: false,
        writable: false,
        value: initOptions.stream,
      },
      model: {
        enumerable: true,
        configurable: false,
        writable: false,
        value: initOptions.model,
      },
      temperature: {
        enumerable: true,
        configurable: false,
        writable: false,
        value: initOptions.temperature,
      },
      frequency_penalty: {
        enumerable: true,
        configurable: false,
        writable: false,
        value: initOptions.frequency_penalty,
      },
      presence_penalty: {
        enumerable: true,
        configurable: false,
        writable: false,
        value: initOptions.presence_penalty,
      },
    });
  }
  async callOpenAi() {
    const stream = this.stream;
    let model = this.model;
    // to optimize
    if (/gpt-4/.test(model)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model = 'gpt-4-turbo-preview';
    }
    const _this = this;

    const answerFn = async () => {
      const caller = await apiChannelScheduler.returnAPICaller();
      _this.caller = caller;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return caller.openai.chat.completions.create(
        {
          model: model,
          messages: this.askContent,
          stream,
          temperature: this.temperature,
          frequency_penalty: this.frequency_penalty || 0.5,
          presence_penalty: this.presence_penalty || 0.5,
          top_p: 1,
          n: 1,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // response_format: { "type": "json_object" },
          // stream: true
        },
        {
          // httpsAgent: agent,
          ...caller.axiosRequestConfig,
          // ...(stream ? { responseType: 'stream' } : {}),
          // responseType: 'stream',
          stream: true,
          // proxy: false,
        },
      );
    };

    const answer = retry(answerFn, {
      times: 2,
      assessment: async (type, data) => {
        if (type === 'catch') {
          switch (data?.status) {
            case 401: {
              // 401 unauthorized: token expired
              await (this.caller as EncapsulatedCopilot)
                ?.updateCopilotTokenState?.({ deleteTokenField: true })
                .catch((err: any) => {
                  console.log('updateCopilotTokenState: db出错：', err);
                });
              return true;
            }
            case 429: {
              // 速率限制
              await (this.caller as EncapsulatedCopilot)
                ?.updateCopilotTokenState?.({ deleteTokenField: true, rateLimiting: true })
                .catch((err: any) => {
                  console.log('updateCopilotTokenState: db出错：', err);
                });
              return true;
            }
          }
          return false;
        }
        return false;
      },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.resp = answer;
    return answer;
  }
  async ask(params: {
    question?: string;
    streamCb?: (data: ChatCompletionChunk | 'end' | 'close') => void;
    cb?: (data: ChatCompletion) => void;
    errCb?: (err: any) => void;
  }): Promise<unknown> {
    const { question, cb, streamCb, errCb } = params;
    question &&
      this.askContent.push({
        role: 'user',
        content: question,
      });
    const answer = await this.callOpenAi().catch((err: any) => {
      console.log(err);
      errCb?.('接口出错，请稍后再试~');
    });
    if (!answer) {
      return;
    }
    if (this.stream) {
      for await (const chunk of answer as unknown as Stream<ChatCompletionChunk>) {
        if (!chunk.id) {
          // 兼容copilot接口
          continue;
        }
        if (/unauthorized: token expired/.test(chunk as unknown as string)) {
          // 兼容copilot接口,如果token失效,就删除token,重新请求
          (this.caller as EncapsulatedCopilot)?.updateCopilotTokenState?.({ deleteTokenField: true });
          return this.ask(params);
        }
        this.handleMessage(chunk);
        streamCb?.(chunk);
      }
    } else {
      this.handleMessage(answer as ChatCompletion);
      cb?.(answer as ChatCompletion);
    }
  }
  async close() {
    try {
      await (this.caller as EncapsulatedCopilot)?.updateCopilotTokenState?.();
      // 多次调用好像会报错
      if (
        (this.resp as Stream<ChatCompletionChunk>)?.controller &&
        !(this.resp as Stream<ChatCompletionChunk>)?.controller?.signal.aborted
      ) {
        (this.resp as Stream<ChatCompletionChunk>)?.controller?.abort();
      }
      if (this.answer) {
        this.answer.content = this.answer.receiving as string;
      }
      this.resp = null;
    } catch (error) {
      console.error('close error:', error);
      console.log('close error:', error);
    }
  }
  handleMessage(msgItem: ChatCompletionChunk | ChatCompletion | 'end' | 'close') {
    if (msgItem === 'close' || msgItem === 'end') {
      return;
    }
    const {
      choices,
      // id,
      // object, model
    } = msgItem;
    const {
      // message,
      // index,
      finish_reason,
    } = choices[0]!;
    // 针对返回类型分别处理
    switch (finish_reason) {
      case 'function_call':
        // 模型决定调用函数
        break;
      case 'content_filter':
        // 有害输出,直接结束
        break;
      case 'length': {
        // 超过上下文
        // 带上返回继续请求会返回400
        return '';
      }
      case 'stop':
      // 已经返回完整信息，正常结束
      // eslint-disable-next-line no-fallthrough
      case null:
      case undefined: // 兼容copilot接口
        // API 响应仍在进行中或不完整
        this.pushHistoryMsg(msgItem);
        break;
    }
  }
  pushHistoryMsg(msgItem: ChatCompletionChunk | ChatCompletion) {
    const answer = this.answer;
    const {
      choices,
      id,
      // object, model
    } = msgItem;
    const {
      // delta: message1,
      // message,
      // index,
      finish_reason,
    } = choices[0]!;
    const message = (choices[0] as ChatCompletionChunk.Choice).delta || (choices[0] as ChatCompletion.Choice).message;
    const { role, content = '' } = message;
    if (finish_reason === 'stop' || finish_reason === 'length') {
      // json形式一次性返回
      // stream形式返回的结束
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.answer = {
        role: role || this.answer.role || 'assistant',
        content: content || this.answer.receiving || '',
        // id,
      };
      this.recordTokensCount(content || '');
      return;
    }
    // stream形式返回的收集
    if (answer?.id === id) {
      const { receiving = '' } = answer;
      answer.receiving = receiving + content;
      return;
    }
    // 包含两种情况
    // 1. 没有对话记录的状态 lastMsg是undefined
    // 2. 问完等待回答的状态，lastMsg的role是user,现在回答的role是assistant
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.answer = {
      role: role || this.answer.role || 'assistant',
      id,
      receiving: content || '',
    };
  }
  recordTokensCount(text: string) {
    const tokenizer = this.tokens.tokenizer(text);
    this.tokensCount += this.tokens.tokensCount(tokenizer);
  }
}

export default Chat;
