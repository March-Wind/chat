import crypto from 'crypto';
/**
 * 清除路经中多余的"/"
 * tip: 如果":"出现在路经之中，没有办法处理这部分。
 * @param {string} str
 * @return {*}
 */
const sanitizeSlashes = (str: string) => {
  // (^|[^:])  这是一个捕获组，匹配行的非冒号字符的开头，如果是冒号字符就忽略，只留后面
  const processed = str.replace(/(^|[^:])\/{2,}/g, '$1/');
  return processed;
};

/**
 * 生成随机字符串
 * @param {number} length
 * @return {*}
 */
const randomString = (length: number) => {
  // 在这段代码中，length 参数表示要生成的十六进制字符串的长度。
  // 由于 crypto.randomBytes() 方法生成的是字节（bytes）
  // 而每个字节可以表示两个十六进制字符，所以需要将 length 除以 2，以确保生成的字节数与所需的十六进制字符长度相匹配。
  const bytes = crypto.randomBytes(length / 2);
  return bytes.toString('hex');
};

export { sanitizeSlashes, randomString };
