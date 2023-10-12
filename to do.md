## bug

1. 使用一段时间之后，接口 404，怀疑是验证中间件的问题

## 立即去做的事情

1. 上下文连接
2. 区分用户和话题维度的上下文
   - 用户登录，产生话题 id
   - 上下文生产
3. updateOne 替换 findOneAndUpdate

## to do 研究应用

1. 产业链图谱(内置了 ai)：https://vip.joinmap.ai/
2. pdf 压缩和转移
3. debugger 时，导致消息堆积在一起，无法 JSON.parse
4. 处理发送来的空 msg 字符串。
5. mongodb 文档大小优化

### 优化项目

1. 操作数据库的时候(不止 save 是的时候)也应该进行类型校验。[要调研一下 mongoose 的 findOneAndUpdate 等方法进行类型艳艳到什么程度]

## finish

1. 将回答的内容进行格式化
2. 域名，免费证书，DNS 解析
3. 防止 noSQL 注入

## @resolve 是解决疑问了

###

"dev:node2": "node --inspect-brk --loader ts-node/esm ./src/index.ts",
"dev:node:debug2": "node --inspect-brk --loader ts-node/esm ./src/index.ts",
