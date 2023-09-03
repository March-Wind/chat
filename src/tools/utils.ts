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

export { sanitizeSlashes };
