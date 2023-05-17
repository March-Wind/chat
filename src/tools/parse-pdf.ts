import fs from 'fs';
import pdf from 'pdf-parse';
const parsePDF = (path: string) => {
  // const pdfBuffer = fs.createReadStream(path);
  const pdfBuffer = fs.readFileSync(path);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js')
  return pdf(pdfBuffer); // 如果报错的话，是因为pdf-parse的index.js判断了debug模式，如果是debug模式，就会报错，所以需要修改源码
};

// await parsePDF();
export { parsePDF };
