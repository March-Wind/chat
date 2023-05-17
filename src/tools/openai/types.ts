import type { ChatCompletionResponseMessage } from 'openai';
/**
 *
 * @export
 * @interface CreateChatCompletionResponseChoicesInner
 */
export interface CreateChatCompletionResponseChoicesInner {
  /**
   *
   * @type {number}
   * @memberof CreateChatCompletionResponseChoicesInner
   */
  index?: number;
  /**
   *
   * @type {ChatCompletionResponseMessage}
   * @memberof CreateChatCompletionResponseChoicesInner
   */
  delta: ChatCompletionResponseMessage;
  /**
   *
   * @type {string}
   * @memberof CreateChatCompletionResponseChoicesInner
   */
  finish_reason?: string;
}

export interface Stream_CreateChatCompletionResponse {
  /**
   *
   * @type {string}
   * @memberof CreateChatCompletionResponse
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof CreateChatCompletionResponse
   */
  object: string;
  /**
   *
   * @type {number}
   * @memberof CreateChatCompletionResponse
   */
  created: number;
  /**
   *
   * @type {string}
   * @memberof CreateChatCompletionResponse
   */
  model: string;
  /**
   *
   * @type {Array<CreateChatCompletionResponseChoicesInner>}
   * @memberof CreateChatCompletionResponse
   */
  choices: Array<CreateChatCompletionResponseChoicesInner>;
}
