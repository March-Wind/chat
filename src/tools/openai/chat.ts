import IOpenAI from './base';
import { SocksProxyAgent } from 'socks-proxy-agent';
import Tokens from './tokens';
import { openai_key_40, openai_key_35, proxy } from '../../env';
import type { CreateChatCompletionResponse, ChatCompletionRequestMessage } from 'openai';
import type { AxiosResponse } from 'axios';
import type { IncomingMessage } from 'http';
import type { Stream_CreateChatCompletionResponse } from './types';
const agent = proxy ? new SocksProxyAgent(proxy) : undefined;
export interface Props {
  model?: Tokens['model']; // 模型
  // model?: string;
  stream?: boolean; //是否是流式
  context?: ChatCompletionRequestMessage[]; // 上下文
  temperature?: number; // 回答的温度，也是答案概率程度
  frequency_penalty?: number; // 生成的词，会进行去重处理
}

// 回答格式
type AnswerFormatNormal = AxiosResponse<IncomingMessage, any>;
type AnswerFormatStream = AxiosResponse<IncomingMessage, any>;
type AnswerFormat = AnswerFormatNormal | AnswerFormatStream;
class Chat extends IOpenAI {
  private tokens: Tokens;
  private tokensCount: number;
  public answer: ChatCompletionRequestMessage & { receiving?: string; id?: string };
  private model: Tokens['model'];
  private stream: boolean;
  private context: ChatCompletionRequestMessage[]; // 上下文
  private askContent: ChatCompletionRequestMessage[]; // 提问内容
  private temperature: number;
  private resp: AnswerFormat | undefined = undefined;
  constructor(props?: Props) {
    const defaultOptions: Required<Props> = {
      stream: true,
      model: 'gpt-3.5-turbo',
      // model: 'gpt-4',
      context: [],
      temperature: 0.5,
      frequency_penalty: 0.5,
    };
    const initOptions = {
      ...defaultOptions,
      ...props,
    };
    // 设置对应的模型的key
    const apiKey_4_0 = openai_key_40?.split(',') || [];
    const apiKey_3_5 = openai_key_35?.split(',') || [];
    const apiKey = initOptions.model === 'gpt-4' ? apiKey_4_0[0] : apiKey_3_5[0];
    super({ apiKey });
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
    });
  }
  callOpenAi(): Promise<AnswerFormat> {
    const stream = this.stream;
    const modal = this.model;
    this.askContent.forEach((item) => {
      console.log(item.content + '\n\n');
    });
    const answer = this.openai.createChatCompletion(
      {
        model: modal,
        messages: this.askContent,
        stream,
        temperature: this.temperature,
      },
      {
        httpsAgent: agent,
        httpAgent: agent,
        // ...(stream ? { responseType: 'stream' } : {}),
        responseType: 'stream',
        proxy: false,
      },
    ) as unknown as Promise<AnswerFormat>;
    // processCb(answer);
    return answer;
  }
  ask(question?: string) {
    question &&
      this.askContent.push({
        role: 'user',
        content: question,
      });
    const answer = this.callOpenAi();
    answer
      .then((resp) => {
        this.receivingAnswer(resp, this.pushHistoryMsg.bind(this));
      })
      .catch((err) => {
        console.log('class Chat extends IOpenAI内部统计：', err);
      });
    question && this.recordTokensCount(question);
    return answer;
  }
  close() {
    this.resp?.data.destroy();
    if (this.answer) {
      this.answer.content = this.answer.receiving as string;
    }
    this.resp = undefined;
  }
  receivingAnswer(
    resp: AnswerFormat,
    cb: (response: CreateChatCompletionResponse[] | 'end' | 'close') => void,
    errCb?: (err: any) => void,
  ) {
    const that = this;
    this.resp = resp;
    // answerPromise.then((resp) => {
    const contentType: AnswerFormat['headers']['Content-Type'] = resp.headers['content-type'] || 'text/event-stream';

    type Data<T> = T extends 'text/event-stream'
      ? Buffer
      : T extends 'application/json'
      ? CreateChatCompletionResponse
      : never;
    type Resp<T> = T extends 'text/event-stream'
      ? AnswerFormatStream
      : T extends 'application/json'
      ? AnswerFormatNormal
      : never;
    switch (contentType) {
      case 'text/event-stream': {
        type ContentType = typeof contentType;
        (resp as Resp<ContentType>).data.on('data', (data: Data<ContentType>) => {
          const response = that.parseStreamMsg(data);
          cb(response);
        });
        (resp as Resp<ContentType>).data.on('error', (err) => {
          errCb?.(err);
        });
        (resp as Resp<ContentType>).data.on('end', () => {
          cb('end');
        });
        (resp as Resp<ContentType>).data.on('close', () => {
          cb('close');
        });
        break;
      }
      case 'application/json': {
        type ContentType = typeof contentType;
        // cb([(resp as Resp<ContentType>).data]);
        let result = '';
        (resp as Resp<ContentType>).data.on('data', (data: Buffer) => {
          // const response = that.parseStreamMsg(data);
          try {
            result += data.toString();
          } catch (error) {
            console.log(error);
          }
        });
        (resp as Resp<ContentType>).data.on('end', () => {
          try {
            cb([JSON.parse(result)]);
          } catch (error) {
            console.log(error);
          }
        });
        (resp as Resp<ContentType>).data.on('error', (err) => {
          errCb?.(err);
        });
        (resp as Resp<ContentType>).data.on('close', () => {
          cb('close');
        });

        break;
      }
    }
    // }).catch((err) => {
    //   console.log(err)
    // })
  }
  pushHistoryMsg(responseJsons: CreateChatCompletionResponse[] | 'end' | 'close') {
    if (responseJsons === 'end' || responseJsons === 'close') {
      return;
    }
    responseJsons.forEach((json) => {
      const answer = this.answer;
      const {
        choices,
        id,
        // object, model
      } = json;
      const {
        message,
        // index,
        finish_reason,
      } = choices[0]!; // 流式返回类型需要做的处理
      const { role, content = '' } = message!;
      // json形式返回
      if (finish_reason === 'stop' && !answer?.receiving) {
        this.answer = {
          role,
          content,
          // id,
        };
        this.recordTokensCount(content);
        return;
      }
      // stream形式返回的结束
      if (finish_reason === 'stop' && answer?.receiving) {
        answer.content = answer.receiving as string;
        delete answer.receiving;
        delete answer.id;
        this.recordTokensCount(answer.content);
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
      this.answer = {
        role,
        content,
        id,
        receiving: content,
      };
    });
  }
  parseStreamMsg(buffers: Buffer): CreateChatCompletionResponse[] {
    const msgs = buffers
      .toString()
      .split('\n\n')
      .filter((item) => !!item);
    return msgs
      .map((item) => {
        let json: CreateChatCompletionResponse | undefined = undefined;
        try {
          const jsonStr = item.replace(/^data:/, '');
          const _json = JSON.parse(jsonStr) as Stream_CreateChatCompletionResponse;
          const { delta: message, index, finish_reason } = _json.choices[0]!;
          json = {
            id: _json.id,
            object: _json.object,
            created: _json.created,
            model: _json.model,
            choices: [
              {
                message,
                index,
                finish_reason,
              },
            ],
          };
        } catch (error) {
          return json;
        }
        return json;
      })
      .filter((item): item is CreateChatCompletionResponse => !!item);
  }
  recordTokensCount(text: string) {
    const tokenizer = this.tokens.tokenizer(text);
    this.tokensCount += this.tokens.tokensCount(tokenizer);
  }
}

export default Chat;
