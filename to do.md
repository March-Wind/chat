## bug

1. 使用一段时间之后，接口 404，怀疑是验证中间件的问题

## 立即去做的事情

1. 修改 mongoose 的一个数据库不同模型之间共用连接池的问题

   shareConnection.ts

   ```
   const mongoose = require('mongoose');

   const connection1 = mongoose.createConnection('mongodb://localhost/database1', { useNewUrlParser: true, useUnifiedTopology: true });
   const connection2 = mongoose.createConnection('mongodb://localhost/database2', { useNewUrlParser: true, useUnifiedTopology: true });

   connection1.on('error', console.error.bind(console, '连接错误:'));
   connection1.once('open', () => {
     console.log('成功连接到数据库1');
   });

   connection2.on('error', console.error.bind(console, '连接错误:'));
   connection2.once('open', () => {
     console.log('成功连接到数据库2');
   });

   ```

   models/user.ts

   ```
   // model1.js
   const { Schema, model } = require('mongoose');
   const connection1 = require('./connection1'); // 导入连接

   const userSchema = new Schema({
   // 定义模型的字段
   });

   const UserModel1 = connection1.model('User', userSchema);

   module.exports = UserModel1;
   ```

   models/other.ts

   ```
   const UserModel1 = require('./model1');
   const ProductModel2 = require('./model2');

    // 使用 UserModel1
    const user = new UserModel1({ /_ 数据 _/ });
    user.save();

    // 使用 ProductModel2
    const product = new ProductModel2({ /_ 数据 _/ });
    product.save();
   ```

## to do 研究应用

1. 上下文超出限制
2. 产业链图谱(内置了 ai)：https://vip.joinmap.ai/
3. pdf 压缩和转移
4. 处理发送来的空 msg 字符串。
5. mongodb 文档大小优化
6. pm2 平滑更新：https://juejin.cn/post/6850418113196851214

- 目前 restart 模式也还有问题，logs 会被清空

## to perfect 是需要完善的代码

### 优化项目

1. 操作数据库的时候(不止 save 是的时候)也应该进行类型校验。[要调研一下 mongoose 的 findOneAndUpdate 等方法进行类型艳艳到什么程度]

## to optimize

代码出有这个标识就是要优化的。

## finish

1. 将回答的内容进行格式化
2. 域名，免费证书，DNS 解析
3. 防止 noSQL 注入
4. 区分用户和话题维度的上下文
5. 修复报错：The operation was aborted.
   > 如果已经终止了链接，就会报这个错，所以终止之前先判断状态：!(this.resp as Stream<ChatCompletionChunk>)?.controller?.signal.aborted

- 用户登录，产生话题 id
- 上下文生产

5. updateOne 替换 findOneAndUpdate
6. debugger 时，导致消息堆积在一起，无法 JSON.parse

- 每次消息之后加"\n\n"这样在分割的时候可以分隔开

## @resolve 是解决疑问了

###

"dev:node2": "node --inspect-brk --loader ts-node/esm ./src/index.ts",
"dev:node:debug2": "node --inspect-brk --loader ts-node/esm ./src/index.ts",

```

```
