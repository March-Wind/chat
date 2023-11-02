## bug

1. 使用一段时间之后，接口 404，怀疑是验证中间件的问题

## 立即去做的事情

## to do 研究应用

1. 上下文超出限制
2. 产业链图谱(内置了 ai)：https://vip.joinmap.ai/
3. pdf 压缩和转移
4. 处理发送来的空 msg 字符串。
5. mongodb 文档大小优化
6. pm2 平滑更新：https://juejin.cn/post/6850418113196851214
   - 目前 restart 模式也还有问题，logs 会被清空

### 优化项目

1. 操作数据库的时候(不止 save 是的时候)也应该进行类型校验。[要调研一下 mongoose 的 findOneAndUpdate 等方法进行类型艳艳到什么程度]

## finish

1. 将回答的内容进行格式化
2. 域名，免费证书，DNS 解析
3. 防止 noSQL 注入
4. 区分用户和话题维度的上下文
   - 用户登录，产生话题 id
   - 上下文生产
5. updateOne 替换 findOneAndUpdate
6. debugger 时，导致消息堆积在一起，无法 JSON.parse
   - 每次消息之后加"\n\n"这样在分割的时候可以分隔开

## @resolve 是解决疑问了

###

"dev:node2": "node --inspect-brk --loader ts-node/esm ./src/index.ts",
"dev:node:debug2": "node --inspect-brk --loader ts-node/esm ./src/index.ts",
