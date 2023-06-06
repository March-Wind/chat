import Router from '@koa/router';

const login = (router: Router) => {
  // 登录接口
  router.post('/login', async (ctx) => {
    const { username, password } = ctx.request.body;

    // 查找用户
    const user = users.find((user) => user.username === username);

    // 检查用户名和密码是否匹配
    if (!user || user.password !== password) {
      ctx.status = 401;
      ctx.body = { message: '用户名或密码错误' };
      return;
    }

    ctx.body = { message: '登录成功' };
  });
};
