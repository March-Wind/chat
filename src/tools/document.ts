/**
 * 处理文件信息的对象
 *
 * @class Document
 */
class Document {
  pageContent: string;
  metadata: Record<string, any>;
  constructor(fields: { pageContent: string; metadata: Record<string, any> }) {
    Object.defineProperty(this, 'pageContent', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    Object.defineProperty(this, 'metadata', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    this.pageContent = fields?.pageContent ?? this.pageContent;
    this.metadata = fields?.metadata ?? {};
  }
}

export default Document;
