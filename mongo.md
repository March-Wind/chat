## 启动 mongodb

1. 安装好 mongodb
2. 创建 db 目录和 log 目录，log 目录里面有 mongo.log，是 logpath
3. 启动 mongodb:
   > mongod --dbpath=/Users/xmly/Documents/shadow/chat-gpt/chat/mongodb/data --logpath=/Users/xmly/Documents/shadow/chat-gpt/chat/mongodb/log/mongo.log

## mongodb 文档大小优化




#### 高并发发送求报错

```
Error: getaddrinfo ENOTFOUND push2his.eastmoney.com
       at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:69:26)
       at GetAddrInfoReqWrap.callbackTrampoline (internal/async_hooks.js:131:17)
```

定位问题是 DNS 服务器解析遇到了错误
解决办法：

```
var options = {
  host: '_host_',
  family: 4, // 设置解析是ipv4，默认是是ipv4和ipv6
  port: 80,
  path: '/'
};
http.get(options, cb);
```

出自： https://github.com/nodejs/node/issues/5436
As a workaround, try http.get({ family: 4, ... }, cb), that tells node not to use AI_V4MAPPED. Use { family: 6 } if you want an IPv6 connection.

<!-- 猜想是：dns 模块对域名解析有一定的性能限制，当并发量达到一定程度时，就会出现超时，从而导致各种问题。那为什么使用IP-v4就能得到一定程度的改善呢？我的猜想是：默认情况下，dns 模块使用的是IP-v4和IP-v6进行域名解析，在切换解析规则时或者使用不同的规则对性能有一定的依赖，当指定使用IP-v4的时候，能够使得 dns 模块发挥最佳的性能，从而使问题得到一定的改善。 -->

附录：

1. IPv6 与 IPv4 的互操作性：https://tinypiggy.github.io/2019/06/24/unp-note/#ipv4%E5%AE%A2%E6%88%B7%E7%AB%AF%E8%BF%9E%E6%8E%A5ipv6%E6%9C%8D%E5%8A%A1%E7%AB%AF
2. node dns 模块：https://nodejs.org/api/dns.html
   其他常见错误：
3. host 或者 hostname 写错格式，比如`host`的值写成了`http://www.baidu.com`,理应只写主机名`hostname:www.baidu.com`

### "module": "es2015" 指定生成哪个模块系统代码，这会影响 ts-node 的调用。

4. 下载 node 链接 mongodb 的驱动器：npm install mongodb
5. 配置本地 mongodb：https://juejin.cn/post/7052585815037673479
