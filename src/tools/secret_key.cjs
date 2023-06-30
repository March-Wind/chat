const crypto = require('crypto');
// 使用这段代码生成登录态加密的 secret key
// 生成随机的 secret key
const generateSecretKey = () => {
  const length = 32; // 密钥长度为 32 字节
  return crypto.randomBytes(length).toString('hex');
};

const secretKey = generateSecretKey();
console.log('生成的 Secret Key：', secretKey);
