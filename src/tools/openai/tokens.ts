import {
  encoding_for_model,
  // get_encoding,
  type Tiktoken,
  type TiktokenModel,
  // type TiktokenEncoding,
} from '@dqbd/tiktoken';
import Graphemer from 'graphemer';
import BN from 'bignumber.js';

const textDecoder = new TextDecoder();
const graphemer = new ((Graphemer as any).default as unknown as typeof Graphemer)();
type TokenizerResponse = { text: string; tokens: { id: number; idx: number }[] }[];

interface Props {
  model: TiktokenModel; // 模型
}
class Tokens {
  private model: TiktokenModel;
  private encoder: Tiktoken;
  private PRICING: Record<string, BN>;
  constructor(props: Props) {
    const { model } = props;
    Object.defineProperty(this, 'model', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: model,
    });
    Object.defineProperty(this, 'PRICING', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: {
        'gpt-4': BN('0.03').div(1000),
        'gpt-4-32k': BN('0.03').div(1000),
        'gpt-3.5-turbo': BN('0.002').div(1000),
      },
    });
    if (model === 'gpt-4' || model === 'gpt-4-32k' || model === 'gpt-3.5-turbo') {
      this.encoder = encoding_for_model(model, {
        // "<|im_start|>": 100264, // 将组合的字符转换为单个字符
        // "<|im_end|>": 100265,
        // "<|im_sep|>": 100266,
      });
    }

    this.encoder = encoding_for_model(model);
  }
  tokenizer(text: string): TokenizerResponse {
    const encoder = this.encoder;
    const encoding = encoder.encode(text, 'all');
    const segments: { text: string; tokens: { id: number; idx: number }[] }[] = [];

    let byteAcc: number[] = [];
    let tokenAcc: { id: number; idx: number }[] = [];
    let inputGraphemes = graphemer.splitGraphemes(text);
    for (let idx = 0; idx < encoding.length; idx++) {
      const token = encoding[idx]!;
      byteAcc.push(...encoder.decode_single_token_bytes(token));
      tokenAcc.push({ id: token, idx });

      const segmentText = textDecoder.decode(new Uint8Array(byteAcc));
      const graphemes = graphemer.splitGraphemes(segmentText);

      if (graphemes.every((item, idx) => inputGraphemes[idx] === item)) {
        segments.push({ text: segmentText, tokens: tokenAcc });

        byteAcc = [];
        tokenAcc = [];
        inputGraphemes = inputGraphemes.slice(graphemes.length);
      }
    }

    return segments;
  }
  tokensCount(tokenizer: TokenizerResponse) {
    return tokenizer.reduce((acc, cur) => acc + cur.tokens.length, 0);
  }
  priceCount(tokenizer: TokenizerResponse) {
    const count = this.tokensCount(tokenizer);
    return this.PRICING[this.model]?.multipliedBy(count)?.toFixed();
  }
}

export default Tokens;
