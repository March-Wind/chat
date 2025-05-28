## 使用SSL

1. 先买域名。
2. 增加域名解析：https://cloud.tencent.com/document/product/302/3446
3. 安装SSL(https://diamondfsd.com/lets-encrytp-hand-https/)：
    - yum install certbot
    - certbot certonly --webroot -w /www/server/my_project/blog -d qunyangbang.cn -d www.qunyangbang.cn
        - 返回
        - ``` 
        ertificate is saved at: /etc/letsencrypt/live/qunyangbang.cn/fullchain.pem
        Key is saved at:         /etc/letsencrypt/live/qunyangbang.cn/privkey.pem 
        ```
        如果遇到403,那么应该nginx中去掉下面的配置，下面的配置会不让访问隐藏文件
        ```
        location ~ /\.
            {
                deny all;
            }
        ```
4. 配置nginx:
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
        lua_package_path "/www/server/nginx/lib/lua/?.lua;;";

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
        gzip_types     text/plain application/javascript application/x-javascript text/javascript text/css application/xml application/json image/jpeg image/gif image/png font/ttf font/otf image/svg+xml application/xml+rss text/x-js;
        gzip_vary on;
        gzip_proxied   expired no-cache no-store private auth;
        gzip_disable   "MSIE [1-6]\.";

        limit_conn_zone $binary_remote_addr zone=perip:10m;
		limit_conn_zone $server_name zone=perserver:10m;

        server_tokens off;
        access_log off;

server
    {
        listen 80;
        server_name qunyangbang.cn www.qunyangbang.cn;
        index index.html index.htm;
        root /www/server/my_project/blog;

        # 重定向所有 HTTP 请求到 HTTPS
        return 307 https://$server_name$request_uri;
    }
server {
    listen 443 ssl;
    server_name qunyangbang.cn www.qunyangbang.cn;

    root /www/server/my_project/blog;
    index index.html index.htm;

    ssl_certificate /etc/letsencrypt/live/qunyangbang.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qunyangbang.cn/privkey.pem;
    ssl_session_timeout 5m;
    #请按照以下协议配置
    ssl_protocols TLSv1.2 TLSv1.3;
     #请按照以下套件配置，配置加密套件，写法遵循 openssl 标准。
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;


    location / {
          root /www/server/my_project/blog;
          index  index.html index.htm;
          autoindex on;
          try_files $uri $uri/ /index.html;
      }
    location /.well-known/acme-challenge/ {
        allow all;
    }

    access_log /www/wwwlogs/blog-access.log;
    error_log /www/wwwlogs/blog-error.log;
}
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
}



```
  

