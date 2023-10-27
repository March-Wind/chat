
1. 查看配置文件配置：nginx -t
    - 宝塔安装的nginx的conf文件默认是在：/www/server/nginx/conf/nginx.conf
    - 证书安装路径：/www/server/panel/vhost/cert

2. 增加SSL证书
  - 步骤参考：https://cloud.tencent.com/document/product/400/35244
  - 配置
        ```
        server {
            listen 80;
            server_name qunyangbang.cn www.qunyangbang.cn;
            root /www/wwwroot;
            # 重定向所有 HTTP 请求到 HTTPS
                return 301 https://$server_name$request_uri;

        }
            server {
                #SSL 默认访问端口号为 443
                listen 443 ssl; 
                #请填写绑定证书的域名
                server_name cloud.tencent.com; 
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
                    root /www/wwwroot;
                    index  index.html index.htm;
                }
                    # chat项目的后端
            location ^~ /chat-node/ { 
                proxy_pass http://127.0.0.1:4001/;
            }
            }
    ```




## 以下是log的格式
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
        
        # 日志格式
        log_format main 'addr: $remote_addr - user: $remote_user time: [$time_local] \n'
'"$request" $status $body_bytes_sent '
'referer:"$http_referer" -- agent:"$http_user_agent" \n'
'upstream_addr="$upstream_addr" \n'
'upstream_response_time="$upstream_response_time" \n'
'request_time="$request_time" \n';
        
        
        # 自定义配置开始
        #最大共享内存
        # push_stream_shared_memory_size                100m;
        #频道最大长度
        # push_stream_max_channel_id_length             200;
        #每个频道缓存的最大消息数量
        # push_stream_max_messages_stored_per_channel   20;
        #消息生命周期(分钟)
        # push_stream_message_ttl                       5m;
        # push_stream_channels_path /www/wwwlogs/push_stream;
        # 自定义配置结束
        
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
    server {
      listen 1000;
      server_name proxyOpenAI;
      access_log /www/wwwlogs/nginx_access_openai_proxy.log main;
      location /nginx_status {
        stub_status on;
        access_log off;

      }
      location ^~ /proxyOpenAI/ {
        proxy_pass https://api.openai.com/;
        # proxy_pass http://43.159.46.80:4000/;
        proxy_set_header X-Real-IP "";
        proxy_set_header X-Forwarded-For "";
      }
    }
    
    
server {
        listen 1001;
           
        location /test {
            proxy_pass http://localhost:3000/page;
            # push_stream_publisher;
            # push_stream_store_messages on;
            proxy_buffering off;
            proxy_cache off;
        }
    }

include /www/server/panel/vhost/nginx/*.conf;
}




http://43.159.46.80:1000/proxyOpenAI/v1/chat/completions