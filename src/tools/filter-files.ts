import { isRegExp } from './variable-type';
import { readdirSync } from 'fs';
import Document from './document';
import isDir from './isDir';
import { parsePDF } from './parse-pdf';
interface Props {
  path: string;
  rule?: string | RegExp;
}
class FilterFiles {
  directory: string;
  rule?: string | RegExp;
  filteredPath: string[];
  constructor(props: Props) {
    const { path, rule } = props;
    if (!isDir(path)) {
      throw new Error('filterFiles: path is not a directory');
    }
    Object.defineProperty(this, 'directory', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: path,
    });
    Object.defineProperty(this, 'rule', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: rule,
    });
  }
  filter(_dir?: string) {
    const dir = _dir || this.directory;
    const files = readdirSync(dir, { withFileTypes: true });
    const rule = this.rule ? (isRegExp(this.rule) ? this.rule : new RegExp(this.rule + '$')) : '';
    files.forEach((file) => {
      if (file.isDirectory()) {
        return this.filter(_dir);
      }
      if (rule && file.name.match(rule)) {
        return this.filteredPath.push(file.name);
      }
      if (!rule) {
        return this.filteredPath.push(file.name);
      }
    });
  }
  async load(cb: (document?: Document) => void) {
    // 这里一次性加载所有文件，一定会占用超大内存，甚至会内存溢出，所以支持逐次加载文件
    this.filteredPath.forEach(async (path) => {
      const info = await parsePDF(path).catch((err: any) => {
        console.log(`加载失败：${path}`, err);
      });
      if (!info) {
        cb();
        return;
      }
      const { text, info: metadata } = info;
      const document = new Document({
        pageContent: text,
        metadata,
      });
      cb(document);
    });
  }
}

export default FilterFiles;
