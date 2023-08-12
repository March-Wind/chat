import IOpenAI from './base';
import { SocksProxyAgent } from 'socks-proxy-agent';
import Tokens from './tokens';
import { proxy } from '../../env';
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
  constructor(props?: Props) {
    super();
    const defaultOptions: Required<Props> = {
      stream: true,
      model: 'gpt-3.5-turbo',
      context: [],
    };
    const initOptions = {
      ...defaultOptions,
      ...props,
    };
    this.context = initOptions.context;
    this.askContent = this.context;

    this.tokens = new Tokens({ model: initOptions.model });
    // this.recordTokensCount(initOptions.system);
    Object.defineProperty(this, 'stream', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: initOptions.stream,
    });
    Object.defineProperty(this, 'model', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: initOptions.model,
    });
  }
  callOpenAi(): Promise<AnswerFormat> {
    const stream = this.stream;
    const modal = this.model;
    const answer = this.openai.createChatCompletion(
      {
        model: modal,
        messages: this.askContent,
        stream,
        temperature: 0,
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
        console.log(err);
      });
    question && this.recordTokensCount(question);
    return answer;
  }
  receivingAnswer(resp: AnswerFormat, cb: (response: CreateChatCompletionResponse[]) => void) {
    const that = this;
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
        break;
      }
      case 'application/json': {
        type ContentType = typeof contentType;
        // cb([(resp as Resp<ContentType>).data]);
        (resp as Resp<ContentType>).data.on('data', (data: Buffer) => {
          // const response = that.parseStreamMsg(data);
          try {
            cb([JSON.parse(data.toString())]);
          } catch (error) {
            console.log(error);
          }
        });
        break;
      }
    }
    // }).catch((err) => {
    //   console.log(err)
    // })
  }
  pushHistoryMsg(responseJsons: CreateChatCompletionResponse[]) {
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
      const { role, content } = message!;
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
