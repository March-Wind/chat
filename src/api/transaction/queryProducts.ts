import Router from '@koa/router';
import verifyAuth from '../../tools/koa/middleware/verify-auth';
import UserBaseInfo from '../../tools/mongodb/users/baseInfo';
import Product from '../../tools/mongodb/transactions/products';
import { failStatus, successStatus } from '../../constant';
import awaitWrap from '../../tools/await-wrap';

interface Body {}

const checkAuth = verifyAuth();

const queryProducts = (router: Router) => {
  // 获取所有话题
  router.post('/transaction/queryProducts', checkAuth, async (ctx, next) => {
    const product = new Product();
    const [products, productsErr] = await awaitWrap(product.queryProducts());
    if (productsErr) {
      ctx.body = {
        status: failStatus,
        msg: '数据库查询失败，请稍后再试~',
      };
      ctx.status = 500;
      return;
    }
    if (!products) {
      ctx.body = {
        status: failStatus,
        msg: '未找到可以售卖的商品！',
      };
      ctx.status = 200;
      return;
    }
    const data = Product.transform(products);
    ctx.body = {
      status: successStatus,
      data,
    };
    ctx.status = 200;
    return await next();
  });
};

export default queryProducts;
