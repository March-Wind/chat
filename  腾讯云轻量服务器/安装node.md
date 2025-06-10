## 安装node

1. 安装nvm(https://github.com/nvm-sh/nvm): `wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`
2. 增加环境变量
   1. 找到`/root/.bashrc`加入一下内容
      ```
      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
      ````
   2. 应用环境变量：`source ~/.bashrc`
3. 安装node：`nvm install v18.19.1`
   1. 尝试`node -v` 返回`v18.19.1`
4. 安装pm2： `npm install pm2@latest -g`
   1. 尝试`pm2 -v`
   2. 启动项目：`cd /www/wwwroot/chat/chat_server && pm2 start ecosystem.config.js`