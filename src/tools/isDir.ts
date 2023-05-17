import { lstatSync } from 'fs';
// import Path from 'path';

/**
 * 是文件夹吗
 * @param path
 * @returns
 */
const isDir = (path: string) => {
  return lstatSync(path).isDirectory();
};
export default isDir;
