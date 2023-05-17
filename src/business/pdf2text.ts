import path from 'path';
import { parsePDF } from '../tools/parse-pdf';

const pdf2text = async (src: string) => {
  console.log(src);
  const filePath = path.resolve(process.cwd(), 'src/assets/finance.pdf');
  // 获取到pdf的文字
  const text = await parsePDF(filePath);
  return text;
};
export { pdf2text };
