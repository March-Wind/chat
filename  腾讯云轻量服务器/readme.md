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

1. ftp功能：`pureftpd-1.0`。端口21
   - 上传文件可以使用宝塔来代替
2. pm2管理器（安装之后使用root登录，能执行nvm ls 其他的命令找不到）
   - 但是node 18版本的运行缺少所需的GLIBC（GNU C Library）版本 ，降级到16，就行了