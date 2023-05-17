import Document from './document';
import type * as tiktokenType from '@dqbd/tiktoken';
import tiktoken from '@dqbd/tiktoken';

interface TextSplitterParams {
  chunkSize: number;
  chunkOverlap: number;
}

/**
 * 文本切割
 * splitDocuments： 将多个文档切割成多个文档, 暴露给用户的接口
 * createDocuments：将所有的文字切割成多段文字, 用metadatas来标识来源，createDocuments是splitDocuments的内部实现
 * splitText 是切割文本的方法，可以根据自己的需求，实现自己的切割方法
 * mergeSplits：合并切割出来的小文档，使其加起来也不超过要求，比如一共切割出来99段文字，按照一定规则，合并成了20个文档,20哥文档的大小都不超过4000个字
 * @export
 * @abstract
 * @class TextSplitter
 * @implements {TextSplitterParams}
 */
export abstract class TextSplitter implements TextSplitterParams {
  chunkSize: number;
  chunkOverlap: number;
  constructor(fields?: Partial<TextSplitterParams>) {
    Object.defineProperty(this, 'chunkSize', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 1000,
    });
    Object.defineProperty(this, 'chunkOverlap', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 200,
    });
    this.chunkSize = fields?.chunkSize ?? this.chunkSize;
    this.chunkOverlap = fields?.chunkOverlap ?? this.chunkOverlap;
    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('Cannot have chunkOverlap >= chunkSize');
    }
  }
  /**
   * 根据文本内容，分割成多个文本，每个类都有自己的分割规则
   *
   * @abstract
   * @param {string} text
   * @return {*}  {Promise<string[]>}
   * @memberof TextSplitter
   */
  abstract splitText(text: string): Promise<string[]>;

  /**
   * 创建文档：将所有的文字切割成多段文字
   *
   * @param {string[]} texts
   * @param {Record<string, any>[]} [metadatas=[]]
   * @return {*}  {Promise<Document[]>}
   * @memberof TextSplitter
   */
  async createDocuments(texts: string[], metadatas: Record<string, any>[] = []): Promise<Document[]> {
    const _metadatas = metadatas.length > 0 ? metadatas : new Array(texts.length).fill({});
    const documents = [];
    for (let i = 0; i < texts.length; i += 1) {
      const text = texts[i];
      for (const chunk of await this.splitText(text)) {
        documents.push(new Document({ pageContent: chunk, metadata: _metadatas[i] }));
      }
    }
    return documents;
  }
  /**
   * 分割文档：将所有的文件切割成多端文字
   * 单个文件的切割，可能会导致上下文不完整，所以要选择能更好保留上下文的切割方法
   *
   * @param {Document[]} documents
   * @return {*}  {Promise<Document[]>}
   * @memberof TextSplitter
   */
  splitDocuments(documents: Document[]): Promise<Document[]> {
    const texts = documents.map((doc) => doc.pageContent);
    const metadatas = documents.map((doc) => doc.metadata);
    return this.createDocuments(texts, metadatas);
  }
  private joinDocs(docs: string[], separator: string) {
    const text = docs.join(separator).trim();
    return text === '' ? null : text;
  }
  mergeSplits(splits: string[], separator: string): string[] {
    const docs = [];
    const currentDoc = [];
    let total = 0;
    for (const d of splits) {
      const _len = d.length;
      if (total + _len >= this.chunkSize) {
        if (total > this.chunkSize) {
          console.warn(`Created a chunk of size ${total}, +
which is longer than the specified ${this.chunkSize}`);
        }
        if (currentDoc.length > 0) {
          const doc = this.joinDocs(currentDoc, separator);
          if (doc !== null) {
            docs.push(doc);
          }
          // Keep on popping if:
          // - we have a larger chunk than in the chunk overlap
          // - or if we still have any chunks and the length is long
          while (total > this.chunkOverlap || (total + _len > this.chunkSize && total > 0)) {
            total -= currentDoc[0].length;
            currentDoc.shift();
          }
        }
      }
      currentDoc.push(d);
      total += _len;
    }
    const doc = this.joinDocs(currentDoc, separator);
    if (doc !== null) {
      docs.push(doc);
    }
    return docs;
  }
}
interface CharacterParam {
  separator: string;
}
/**
 * 简单的字符串切割
 *
 * @export
 * @class CharacterTextSplitter
 * @extends {TextSplitter}
 */
export class CharacterTextSplitter extends TextSplitter {
  separator: string;
  constructor(fields?: Partial<CharacterParam & TextSplitterParams>) {
    super(fields);
    Object.defineProperty(this, 'separator', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: '\n\n',
    });
    this.separator = fields?.separator ?? this.separator;
  }
  async splitText(text: string) {
    // First we naively split the large input into a bunch of smaller ones.
    let splits;
    if (this.separator) {
      splits = text.split(this.separator);
    } else {
      splits = text.split('');
    }
    return this.mergeSplits(splits, this.separator);
  }
}
interface RecursiveCharacterParam {
  separators: string[];
}
/**
 * 使用第一个切割符号后过于长的文本，还会使用后面的切割符号继续切割，以此类推
 *
 * @export
 * @class RecursiveCharacterTextSplitter
 * @extends {TextSplitter}
 */
export class RecursiveCharacterTextSplitter extends TextSplitter {
  separators: string[];
  constructor(fields?: Partial<RecursiveCharacterParam & TextSplitterParams>) {
    super(fields);
    Object.defineProperty(this, 'separators', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ['\n\n', '\n', ' ', ''],
    });
    this.separators = fields?.separators ?? this.separators;
  }
  /**
   * 使用第一个切割符号后过于长的文本，还会使用后面的切割符号继续切割，以此类推
   *
   * @param {string} text
   * @return {*}  {Promise<string[]>}
   * @memberof RecursiveCharacterTextSplitter
   */
  async splitText(text: string): Promise<string[]> {
    const finalChunks = [];
    // Get appropriate separator to use
    let separator = this.separators[this.separators.length - 1];
    for (const s of this.separators) {
      if (s === '') {
        separator = s;
        break;
      }
      if (text.includes(s)) {
        separator = s;
        break;
      }
    }
    // Now that we have the separator, split the text
    let splits;
    if (separator) {
      splits = text.split(separator);
    } else {
      splits = text.split('');
    }
    // Now go merging things, recursively splitting longer texts.
    let goodSplits = [];
    for (const s of splits) {
      if (s.length < this.chunkSize) {
        goodSplits.push(s);
      } else {
        if (goodSplits.length) {
          const mergedText = this.mergeSplits(goodSplits, separator);
          finalChunks.push(...mergedText);
          goodSplits = [];
        }
        const otherInfo = await this.splitText(s);
        finalChunks.push(...otherInfo);
      }
    }
    if (goodSplits.length) {
      const mergedText = this.mergeSplits(goodSplits, separator);
      finalChunks.push(...mergedText);
    }
    return finalChunks;
  }
}
export interface TokenTextSplitterParams extends TextSplitterParams {
  encodingName: tiktokenType.TiktokenEncoding;
  allowedSpecial: 'all' | Array<string>;
  disallowedSpecial: 'all' | Array<string>;
}
/**
 * 根据openai的tiktoken分词结果来切割文本
 * 这个很慢
 * @export
 * @class TokenTextSplitter
 * @extends {TextSplitter}
 */
export class TokenTextSplitter extends TextSplitter {
  encodingName: tiktokenType.TiktokenEncoding;
  allowedSpecial: 'all' | Array<string>;
  disallowedSpecial: 'all' | Array<string>;
  private tokenizer: tiktokenType.Tiktoken;
  private registry: FinalizationRegistry<unknown>;
  constructor(fields?: Partial<TokenTextSplitterParams>) {
    super(fields);
    Object.defineProperty(this, 'encodingName', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    Object.defineProperty(this, 'allowedSpecial', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    Object.defineProperty(this, 'disallowedSpecial', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    Object.defineProperty(this, 'tokenizer', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    Object.defineProperty(this, 'registry', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    this.encodingName = fields?.encodingName ?? 'gpt2';
    this.allowedSpecial = fields?.allowedSpecial ?? [];
    this.disallowedSpecial = fields?.disallowedSpecial ?? 'all';
  }
  async splitText(text: string) {
    if (!this.tokenizer) {
      // const tiktoken = await TokenTextSplitter.imports();
      this.tokenizer = tiktoken.get_encoding(this.encodingName);
      // We need to register a finalizer to free the tokenizer when the
      // splitter is garbage collected.
      this.registry = new FinalizationRegistry((t: any) => t.free());
      this.registry.register(this, this.tokenizer);
    }
    const splits = [];
    const input_ids = this.tokenizer.encode(text, this.allowedSpecial, this.disallowedSpecial);
    let start_idx = 0;
    let cur_idx = Math.min(start_idx + this.chunkSize, input_ids.length);
    let chunk_ids = input_ids.slice(start_idx, cur_idx);
    const decoder = new TextDecoder();
    while (start_idx < input_ids.length) {
      splits.push(decoder.decode(this.tokenizer.decode(chunk_ids)));
      start_idx += this.chunkSize - this.chunkOverlap;
      cur_idx = Math.min(start_idx + this.chunkSize, input_ids.length);
      chunk_ids = input_ids.slice(start_idx, cur_idx);
    }
    return splits;
  }
}
