# 腾讯云轻量服务器文档

## 宝塔登录账号密码相关操作

1. 查看账号密码
   ```bash
   bt default
   ```
2. 重置密码
   ```bash
   cd /www/server/panel && python tools.pyc panel testpasswd
   ```
3. 清除登录限制(如果提示多次登录失败，暂时禁止登录 请输入以下命令 清除登录限制)
   ```bash
   rm -f /www/server/panel/data/*.login
   ```
4. 所有内置命令
   ```bash
   bt
   ```

## 安装软件

1. ftp 功能：`pureftpd-1.0`。端口 21
   - 上传文件可以使用宝塔来代替
   - 本身的使用方式https://cloud.tencent.com/document/product/1207/53216
2. pm2 管理器（安装之后使用 root 登录，能执行 nvm ls 其他的命令找不到）,可以使用`npm i -g pm2`自己安装
   - 但是 node 18 版本的运行缺少所需的 GLIBC（GNU C Library）版本 ，降级到 16，就行了
   - 启动项目：cd /www/wwwroot/chat/chat_server && pm2 start ecosystem.config.js
3. 安装了 nginx

   - 安装路径：/www/server/nginx
   - 配置文件路径：/www/server/nginx/conf/nginx.conf

4. 安装了 mongodb

   > https://cloud.tencent.com/developer/article/1476654?from=15425

   > 安装包列表：https://www.mongodb.com/download-center/community/releases

   - 安装路径：/www/server/mongodb
   - 配置文件路径：/www/server/mongodb/bin/mongodb.conf
   - 启动文件路经：/www/server/mongodb/bin/mongod
   - 数据文件文件：/www/server/mongodb/data
   - mongodb://liuzhiyang:199401132211@43.153.51.25:27099/
   - 启动命令： cd /www/server/mongodb/bin/ && ./mongod --config mongodb.conf
   - 链接命令：mongodb://liuzhiyang:199401132211@43.153.51.25:27099/
   - 查看后台进程和关闭：
     - ps aux | grep mongod 和 kill pid
     - sudo systemctl stop mongod(使用 systemctl（仅限于使用 systemd 的 Linux 发行版)
     - sudo service mongod stop(使用 service 命令（仅限于使用 init 的 Linux 发行版)

- 启动 chat_server

  `cd /www/wwwroot/chat/chat_server && export OPENAI_API_KEY=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 && pm2 start ecosystem.config.js`
