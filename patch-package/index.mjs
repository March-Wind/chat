import fs from 'fs';
import path from 'path';


const run = () => {
  const _path = path.resolve(process.cwd(), './node_modules/@dqbd/tiktoken/package.json');
  const json = fs.readFileSync(_path, 'utf8');
  const newJson = JSON.parse(json);
  newJson.main = './tiktoken.js';
  newJson.type = 'module';
  delete newJson.exports;
  fs.writeFileSync(_path, JSON.stringify(newJson, null, 2), 'utf8');
}

run()
