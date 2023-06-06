import Router from '@koa/router';
import UserDb from '../tools/mongodb/user';
import awaitWrap from '@/tools/await-wrap';

type UserSchema = UserDb['Schema'];
const process = async (user: UserSchema) => {
  const userDb = new UserDb();

  // 检查用户名是否已经存在
  const { email } = user;
  const data = await userDb.searchUserByEmail(email);
  if (data) {
    return Promise.reject('用户已存在');
  }
  // 将用户注册信息放进数据库
  const result = await userDb.insertUser(user);
  return Promise.resolve('注册成功');
};

const registerUser = async (router: Router) => {
  // 注册接口
  router.post('/register', async (ctx, next) => {
    const user: UserSchema = ctx.request.body as UserSchema;
    const [data, err] = await awaitWrap(process(user));
    ctx.body = data || err;
    next();
  });
};
export default registerUser;
