import IOpenAI from './base';
import { SocksProxyAgent } from 'socks-proxy-agent';
import Tokens from './tokens';
import type { CreateChatCompletionResponse, ChatCompletionRequestMessage } from 'openai';
import type { AxiosResponse } from 'axios';
import type { IncomingMessage } from 'http';
import type { Stream_CreateChatCompletionResponse } from './types';
const httpsAgent = new SocksProxyAgent('socks5://127.0.0.1:1086');
interface Props {
  model?: Tokens['model']; // 模型
  // model?: string;
  system?: string; // 系统级别的设定和行为
  stream?: boolean; //是否是流式
}

// 回答格式
type AnswerFormatNormal = AxiosResponse<CreateChatCompletionResponse, any>;
type AnswerFormatStream = AxiosResponse<IncomingMessage, any>;
type AnswerFormat = AnswerFormatNormal | AnswerFormatStream;
class Chat extends IOpenAI {
  private tokens: Tokens;
  private tokensCount: number;
  private history: (ChatCompletionRequestMessage & { receiving?: string; id?: string })[] = [];
  private model: Tokens['model'];
  private stream: boolean;
  constructor(props?: Props) {
    super();
    const defaultOptions: Required<Props> = {
      stream: true,
      system: '你是一个有用的智能助手，你总是给出最靠谱的回答。',
      model: 'gpt-3.5-turbo',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    };
    const initOptions = {
      ...defaultOptions,
      ...props,
    };

    this.history = [
      {
        role: 'system',
        content: initOptions.system,
      },
    ];
    // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // // @ts-ignore
    // global.history = this.history
    this.tokens = new Tokens({ model: initOptions.model });
    this.recordTokensCount(initOptions.system);
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
        messages: this.history,
        stream,
        temperature: 0.2,
      },
      {
        httpsAgent,
        httpAgent: httpsAgent,
        // ...(stream ? { responseType: 'stream' } : {}),
        responseType: 'stream',
        proxy: false,
      },
    ) as unknown as Promise<AnswerFormat>;
    // processCb(answer);
    return answer;
  }
  ask(question: string) {
    this.history.push({
      role: 'user',
      content: question,
    });
    debugger;
    const answer = this.callOpenAi();

    answer
      .then((resp) => {
        this.receivingAnswer(resp, this.pushHistoryMsg.bind(this));
      })
      .catch((err) => {
        console.log(err);
      });
    this.recordTokensCount(question);
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
        cb([(resp as Resp<ContentType>).data]);
        break;
      }
    }
    // }).catch((err) => {
    //   console.log(err)
    //   debugger

    // })
  }
  pushHistoryMsg(responseJsons: CreateChatCompletionResponse[]) {
    responseJsons.forEach((json) => {
      const lastMsg = this.history[this.history.length - 1];
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
      if (finish_reason === 'stop' && !lastMsg?.receiving) {
        this.history.push({
          role,
          content,
          // id,
        });
        this.recordTokensCount(content);
        return;
      }
      // stream形式返回的结束
      if (finish_reason === 'stop' && lastMsg?.receiving) {
        lastMsg.content = lastMsg.receiving as string;
        delete lastMsg.receiving;
        delete lastMsg.id;
        this.recordTokensCount(lastMsg.content);
        return;
      }
      // stream形式返回的收集
      if (lastMsg?.id === id) {
        const { receiving = '' } = lastMsg;
        lastMsg.receiving = receiving + content;
        return;
      }
      // 包含两种情况
      // 1. 没有对话记录的状态 lastMsg是undefined
      // 2. 问完等待回答的状态，lastMsg的role是user,现在回答的role是assistant
      this.history.push({
        role,
        content,
        id,
        receiving: content,
      });
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
