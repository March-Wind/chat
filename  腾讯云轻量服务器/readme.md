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
2. 安装node
   - https://cloud.tencent.com/document/product/213/38237
   - 安装nvm时，`git clone https://github.com/cnpm/nvm.git ~/.nvm && cd ~/.nvm && git checkout `git describe --abbrev=0 --tags``换成`wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash`
   - npm 安装的nvm和pm2等，由于需要手动创建软连，可以用find / -name pm2 找到位置，再用 ln -s /www/server/nodejs/v16.9.0/bin/pm2 /usr/local/bin/pm2来创造软连
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

  `cd /www/wwwroot/chat/chat_server && export OPENAI_API_KEY=xxx && pm2 start ecosystem.config.js`

### 中转 api

> 使用 CloudFlare Pages 利用其的 Functions 部署中转。 https://github.com/x-dr/chatgptProxyAPI/blob/main/docs/cloudflare_proxy_pages.md

1. 域名：proxy-api-ch5.pages.dev
2.

### 服务端的nginx配置

```

user  www www;
worker_processes auto;
error_log  /www/wwwlogs/nginx_error.log  crit;
pid        /www/server/nginx/logs/nginx.pid;
worker_rlimit_nofile 51200;

stream {
    log_format tcp_format '$time_local|$remote_addr|$protocol|$status|$bytes_sent|$bytes_received|$session_time|$upstream_addr|$upstream_bytes_sent|$upstream_bytes_received|$upstream_connect_time';
  
    access_log /www/wwwlogs/tcp-access.log tcp_format;
    error_log /www/wwwlogs/tcp-error.log;
    include /www/server/panel/vhost/nginx/tcp/*.conf;
}

events
    {
        use epoll;
        worker_connections 51200;
        multi_accept on;
    }

http
    {
        include       mime.types;
		#include luawaf.conf;

		include proxy.conf;

        default_type  application/octet-stream;

        server_names_hash_bucket_size 512;
        client_header_buffer_size 32k;
        large_client_header_buffers 4 32k;
        client_max_body_size 50m;

        sendfile   on;
        tcp_nopush on;

        keepalive_timeout 60;

        tcp_nodelay on;

        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
        fastcgi_buffer_size 64k;
        fastcgi_buffers 4 64k;
        fastcgi_busy_buffers_size 128k;
        fastcgi_temp_file_write_size 256k;
		fastcgi_intercept_errors on;

        gzip on;
        gzip_min_length  1k;
        gzip_buffers     4 16k;
        gzip_http_version 1.1;
        gzip_comp_level 2;
        gzip_types     text/plain application/javascript application/x-javascript text/javascript text/css application/xml;
        gzip_vary on;
        gzip_proxied   expired no-cache no-store private auth;
        gzip_disable   "MSIE [1-6]\.";

        limit_conn_zone $binary_remote_addr zone=perip:10m;
		limit_conn_zone $server_name zone=perserver:10m;

        server_tokens off;
        access_log off;

server
    {
        listen 888;
        server_name phpmyadmin;
        index index.html index.htm index.php;
        root  /www/server/phpmyadmin;

        #error_page   404   /404.html;
        include enable-php.conf;

        location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$
        {
            expires      30d;
        }

        location ~ .*\.(js|css)?$
        {
            expires      12h;
        }

        location ~ /\.
        {
            deny all;
        }

        access_log  /www/wwwlogs/access.log;
    }
 include /www/server/panel/vhost/nginx/*.conf;
 
 server {
   listen 80;
   # 这个证书是单域名的
   server_name qunyangbang.cn www.qunyangbang.cn m.qunyangbang.cn;
   root /www/wwwroot;
   # 重定向所有 HTTP 请求到 HTTPS
    return 307 https://$server_name$request_uri;

 }
server {
     #SSL 默认访问端口号为 443
     listen 443 ssl; 
     #请填写绑定证书的域名,这个证书是单域名的
     server_name qunyangbang.cn www.qunyangbang.cn; 
     #请填写证书文件的相对路径或绝对路径
     ssl_certificate /www/server/panel/vhost/cert/qunyangbang.cn_bundle.crt; 
     #请填写私钥文件的相对路径或绝对路径
     ssl_certificate_key /www/server/panel/vhost/cert/qunyangbang.cn.key; 
     ssl_session_timeout 5m;
     #请按照以下协议配置
     ssl_protocols TLSv1.2 TLSv1.3; 
     #请按照以下套件配置，配置加密套件，写法遵循 openssl 标准。
     ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE; 
     ssl_prefer_server_ciphers on;
     location / {
         return 301 https://www.qunyangbang.cn;
         root /www/wwwroot;
         index  index.html index.htm;
     }
     # chat项目的后端
     location ^~ /chat_server/ {
       proxy_pass http://127.0.0.1:4001/;
     }
     # debug chat项目的后端
     location ^~ /chat_server_debug {
       proxy_pass http://127.0.0.1:4002/;
     }
    # chat项目的前端
     location /chat_web/ {
       alias /www/wwwroot/chat/chat_web/;
       autoindex on;
       try_files $uri $uri/ /chat_web/index.html;
     }
 }

}



```