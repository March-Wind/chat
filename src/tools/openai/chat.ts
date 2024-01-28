import apiChannelScheduler from './apiChannelScheduler';
import Tokens from './tokens';
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
    const model = this.model;
    // to optimize
    // if (/gpt-4/.test(model)) {
    //   model = 'gpt-4-1106-preview';
    // }
    const caller = await apiChannelScheduler.returnAPICaller();
    this.caller = caller;
    const answer = await caller.openai.chat.completions.create(
      {
        model: model,
        messages: this.askContent,
        stream,
        temperature: this.temperature,
        frequency_penalty: this.frequency_penalty || 1,
        presence_penalty: this.presence_penalty || 1,
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

    // processCb(answer);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.resp = answer;
    return answer;

    // for await (const chunk of answer) {
    //   console.log(chunk);
    //   debugger
    // }
  }
  async ask(params: {
    question?: string;
    streamCb?: (data: ChatCompletionChunk | 'end' | 'close') => void;
    cb?: (data: ChatCompletion) => void;
    errCb?: (err: any) => void;
  }): Promise<unknown> {
    const { question, cb, streamCb } = params;
    question &&
      this.askContent.push({
        role: 'user',
        content: question,
      });
    const answer = await this.callOpenAi();
    if (this.stream) {
      for await (const chunk of answer as unknown as Stream<ChatCompletionChunk>) {
        if (!chunk.id) {
          // 兼容copilot接口
          continue;
        }
        if (/unauthorized: token expired/.test(chunk as unknown as string)) {
          // 兼容copilot接口,如果token失效,就删除token,重新请求
          (this.caller as EncapsulatedCopilot)?.updateCopilotTokenState?.(true);
          return this.ask(params);
        }
        this.handleMessage(chunk);
        streamCb?.(chunk);
      }
    } else {
      this.handleMessage(answer as ChatCompletion);
      cb?.(answer as ChatCompletion);
    }

    // answer
    //   .then((resp) => {
    //     this.receivingAnswer(resp, (response) => {
    //       this.handleMessage(response);
    //       // this.pushHistoryMsg(response);
    //       cb?.(response);
    //     });
    //   })
    //   .catch((err) => {
    //     debugger
    //     console.log('class Chat extends IOpenAI内部统计：', err);
    //   });
    // question && this.recordTokensCount(question);
    // return answer;
  }
  async close() {
    await (this.caller as EncapsulatedCopilot)?.updateCopilotTokenState?.();
    (this.resp as Stream<ChatCompletionChunk>)?.controller?.abort();
    if (this.answer) {
      this.answer.content = this.answer.receiving as string;
    }
    this.resp = null;
  }
  // receivingAnswer(
  //   resp: AnswerFormat,
  //   cb: (response: ChatCompletion[] | 'end' | 'close') => void,
  //   errCb?: (err: any) => void,
  // ) {
  //   const that = this;
  //   this.resp = resp;
  //   // answerPromise.then((resp) => {
  //   debugger
  //   const contentType: AnswerFormat['headers']['Content-Type'] = resp.headers['content-type'] || 'text/event-stream';

  //   type Data<T> = T extends 'text/event-stream'
  //     ? Buffer
  //     : T extends 'application/json'
  //     ? ChatCompletion
  //     : never;
  //   type Resp<T> = T extends 'text/event-stream'
  //     ? AnswerFormatStream
  //     : T extends 'application/json'
  //     ? AnswerFormatNormal
  //     : never;
  //   switch (contentType) {
  //     case 'text/event-stream': {
  //       type ContentType = typeof contentType;
  //       (resp as Resp<ContentType>).data.on('data', (data: Data<ContentType>) => {
  //         const response = that.parseStreamMsg(data);
  //         cb(response);
  //       });
  //       (resp as Resp<ContentType>).data.on('error', (err) => {
  //         errCb?.(err);
  //       });
  //       (resp as Resp<ContentType>).data.on('end', () => {
  //         cb('end');
  //       });
  //       (resp as Resp<ContentType>).data.on('close', () => {
  //         cb('close');
  //       });
  //       break;
  //     }
  //     case 'application/json': {
  //       type ContentType = typeof contentType;
  //       // cb([(resp as Resp<ContentType>).data]);
  //       let result = '';
  //       (resp as Resp<ContentType>).data.on('data', (data: Buffer) => {
  //         // const response = that.parseStreamMsg(data);
  //         try {
  //           result += data.toString();
  //         } catch (error) {
  //           console.log(error);
  //         }
  //       });
  //       (resp as Resp<ContentType>).data.on('end', () => {
  //         try {
  //           cb([JSON.parse(result)]);
  //         } catch (error) {
  //           console.log(error);
  //         }
  //       });
  //       (resp as Resp<ContentType>).data.on('error', (err) => {
  //         errCb?.(err);
  //       });
  //       (resp as Resp<ContentType>).data.on('close', () => {
  //         cb('close');
  //       });

  //       break;
  //     }
  //   }
  //   // }).catch((err) => {
  //   //   console.log(err)
  //   // })
  // }
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
    // // json形式一次性返回
    // if (finish_reason === 'stop' && !answer?.receiving) {
    //   this.answer = {
    //     role,
    //     content,
    //     // id,
    //   };
    //   this.recordTokensCount(content);
    //   return;
    // }
    // // stream形式返回的结束
    // if (finish_reason === 'stop' && answer?.receiving) {
    //   answer.content = answer.receiving as string;
    //   delete answer.receiving;
    //   delete answer.id;
    //   this.recordTokensCount(answer.content);
    //   return;
    // }
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
  // parseStreamMsg(buffers: Buffer): ChatCompletion[] {
  //   // bug：openai stream模式会返回不完整对象，例如data: {"id":"chatcmpl-88fnMltq7wZuouVuosLcOcJqHRODS","object":"chat.completion.chunk","crea
  //   // 使用这种补丁的方式，拿到完整的返回，一次性来解析。
  //   let processString = this.unexpectedReturns.replace(/ /g, '');
  //   processString = processString.replace(/^data:|\n\ndata:/g, '\n\n');

  //   const content = buffers.toString().replace(/ /g, '');
  //   const msgs = (content + processString).split('\n\n').filter((item) => !!item);
  //   let err = false
  //   debugger
  //   const result = msgs
  //     .map((_item) => {
  //       const item = _item.replace(/^data:|\n\ndata:/g, '');
  //       let json: ChatCompletion | undefined = undefined;
  //       if (item === '[DONE]') {
  //         return '';
  //       }
  //       try {
  //         const jsonStr = item.replace(/^data:/, '');
  //         const _json = JSON.parse(jsonStr) as ChatCompletionChunk;
  //         const { delta: message, index, finish_reason } = _json.choices[0]!;
  //         json = {
  //           id: _json.id,
  //           //@ts-ignore
  //           object: _json.object,
  //           created: _json.created,
  //           model: _json.model,
  //           choices: [
  //             {
  //               //@ts-ignore
  //               message,
  //               index,
  //               //@ts-ignore
  //               finish_reason,
  //             },
  //           ],
  //         };
  //       } catch (error) {
  //         if (!err) {
  //           this.unexpectedReturns += content;
  //         }
  //         err = true
  //         return json;
  //       }
  //       return json;
  //     })
  //     .filter((item): item is ChatCompletion => !!item);
  //   debugger
  //   if (err) {
  //     return [{
  //       id: '500',
  //       // @ts-ignore
  //       object: '500',
  //       created: 500,
  //       model: 'gpt-4',
  //       choices: [
  //         {
  //           message: {
  //             role: 'assistant',
  //             content: ''
  //           },
  //           index: 0,
  //           // @ts-ignore
  //           finish_reason: undefined,
  //         },
  //       ],
  //     }]
  //   } else {
  //     this.unexpectedReturns = '';
  //     return result;
  //   }
  // }
  recordTokensCount(text: string) {
    const tokenizer = this.tokens.tokenizer(text);
    this.tokensCount += this.tokens.tokensCount(tokenizer);
  }
}

export default Chat;
