import { Mixin } from 'ts-mixer';
import ChatBot from '../tools/openai/chat';
import type { Props as AskParams } from '../tools/openai/chat';
import History from '../tools/mongodb/users/history-message';
import type {} from '../tools/mongodb/users/history-message';

type ChatParams = {
  uuid: string;
  topicId?: string;
};

class Chat {
  chatBot: ChatBot;
  History: History;
  options: ChatParams;
  constructor(options: ChatParams) {
    this.options = options;
    this.chatBot = new ChatBot();
    this.History = new History({ uuid: options.uuid });
  }
}
