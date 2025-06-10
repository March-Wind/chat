## 安装

> mac: https://juejin.cn/post/7052585815037673479

> centos: https://juejin.cn/post/7163071747414032391

> 远程连接+身份认证：https://blog.csdn.net/jianleking/article/details/79715097

> 内置角色：https://www.mongodb.com/docs/manual/reference/built-in-roles/

## 问题

1. openCloudOS 9, 安装时选择redHat,选择后会自动显示`redHat/centos x64`
2. 解压后，bin文件夹下之前有`mongo.conf`，`mongodb 8.09`版本没有，可以自己在bin文件夹下创建`mongo.conf`,启动时`./mongod --config mongodb.conf`
3. `/www/server/mongodb/bin/mongod: error while loading shared libraries: libcrypto.so.1.1: cannot open shared object file: No such file or directory`
   1. sudo dnf install -y compat-openssl11
   2. find / -name "libcrypto.so.1.1" 2>/dev/null
      1. 若输出类似 /usr/lib64/libcrypto.so.1.1，则成功
   
## 启动 mongodb
 
1. 安装好 mongodb
2. 创建 db 目录和 log 目录，log 目录里面有 mongo.log，是 logpath
3. 启动 mongodb:
   > mongod --dbpath=/Users/xmly/Documents/shadow/chat-gpt/chat/mongodb/data --logpath=/Users/xmly/Documents/shadow/
   chat-gpt/chat/mongodb/log/mongo.log
   > mongod --dbpath=/Users/xmly/Documents/gitlab/db/data --logpath=/Users/xmly/Documents/gitlab/db/log/mongo.log
   > /www/server/mongodb/bin/mongod --dbpath=/www/server/mongodb/data --logpath=/www/server/mongodb/log/mongo.log
   > `cd /www/server/mongodb/bin && ./mongod --config mongodb.conf`
4. 查看后台进程和关闭：
   - ps aux | grep mongod 和 kill pid
   - sudo systemctl stop mongod(使用 systemctl（仅限于使用 systemd 的 Linux 发行版)
   - sudo service mongod stop(使用 service 命令（仅限于使用 init 的 Linux 发行版)
sudo service /www/server/mongodb/bin/mongod stop

## 使用`mongo.conf`文件进行配置参数
```
# 设置数据文件的存放目录
storage:
  dbPath: ../data

# 设置日志文件的存放目录及其日志文件名
systemLog:
  destination: file
  path: ../logs/mongodb.log
  logRotate: reopen
  logAppend: true
  verbosity: 0

# 设置端口号（默认的端口号是 27017）
net:
  port: 27099
  bindIp: 0.0.0.0

# 设置为以守护进程的方式运行，即在后台运行
# fork: true

# 防止通过HTTP进行访问，3版本以后就没有这个参数了
# nohttpinterface: true



# 开启校验用户
# noauth: false

# 启用身份验证
security:
  authorization: enabled

setParameter:
  enableLocalhostAuthBypass: 0
  
#设置为以守护进程的方式运行
processManagement:
   fork: true

```
启动参数直接`/www/server/mongodb/bin/mongod`启动

## 创建身份账户
```
use('admin');

db.createUser({
  user: "xxx",
  pwd: "xxx",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})
```

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

## mongoDB 安全

MongoDB 在您的服务器上可能存在安全风险的原因可能有以下几点：

默认配置：MongoDB 在默认情况下可能以不安全的方式进行配置。例如，默认情况下，MongoDB 允许匿名访问数据库，没有启用身份验证，或者使用弱密码进行访问。这可能使得攻击者可以轻易地访问和篡改您的数据库。

不安全的网络连接：如果您的 MongoDB 实例通过不安全的网络连接（如未加密的网络传输）进行通信，那么在传输过程中数据可能会被窃听或篡改。建议使用 TLS/SSL 等安全协议对 MongoDB 的网络连接进行加密，以保护数据的机密性和完整性。

缺乏访问控制：MongoDB 中的访问控制是非常重要的，它可以限制哪些用户或 IP 地址可以访问数据库，并定义不同用户的权限级别。如果没有正确配置访问控制，可能会导致未经授权的用户能够访问和修改数据库。

更新和补丁管理：未及时安装 MongoDB 的更新和补丁可能导致已知的安全漏洞存在于系统中，使得攻击者可以利用这些漏洞进行入侵。

弱密码：使用弱密码是一种常见的安全风险。如果您的 MongoDB 实例使用弱密码（如短密码、常见密码或容易猜测的密码），那么攻击者可以通过密码猜测或暴力破解的方式入侵数据库。

为了提高 MongoDB 的安全性，建议采取以下措施：

使用强密码：确保为 MongoDB 设置强密码，包括足够的长度、复杂性和随机性，以抵御密码猜测和暴力破解攻击。
启用身份验证：在 MongoDB 中启用身份验证，要求用户提供有效的凭据才能访问数据库。
配置访问控制：限制数据库的访问权限，只允许授权的用户和 IP 地址访问，并根据需要定义适当的权限级别。
加密网络连接：使用 TLS/SSL 等安全协议对 MongoDB 的网络连接进行加密，以防止数据被窃听或篡改。
及时更新和补丁：定期检查 MongoDB 的更新和补丁，并及时安装以修复已知的安全漏洞。
监控和日志记录：设置适当的监控和日志记录机制，及时检测潜在的安全事件或异常活动。
通过采取这些安全措施，您可以增强 MongoDB 在您的服务器上的安全性，并降低潜在的安全风险。同时，定期审查和评估安全性，并遵循最佳实践，是保持 MongoDB 环境安全的重要一环。
