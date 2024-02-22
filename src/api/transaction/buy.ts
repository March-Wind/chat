import Router from '@koa/router';
import verifyAuth from '../../tools/koa/middleware/verify-auth';
import UserBaseInfo from '../../tools/mongodb/users/baseInfo';
import Product from '../../tools/mongodb/transactions/products';
import { failStatus, successStatus } from '../../constant';
import awaitWrap from '../../tools/await-wrap';

interface Body {
  productId: string;
}

const checkAuth = verifyAuth();

const clearTopics = (router: Router) => {
  // 获取所有话题
  router.post('/transaction/buy', checkAuth, async (ctx, next) => {
    const body = ctx.request.body as Body;
    const uuid = ctx.uuid;
    const { productId } = body;
    if (!productId) {
      ctx.body = {
        status: failStatus,
        msg: '请选择一个商品，再进行购买',
      };
      ctx.status = 500;
    }
    const userBaseInfo = new UserBaseInfo();
    const product = new Product();
    const [productInfo, productInfoErr] = await awaitWrap(product.findOne(productId));
    if (productInfoErr) {
      ctx.body = {
        status: failStatus,
        msg: '数据库查询失败，请稍后再试~',
      };
      ctx.status = 500;
      return;
    }
    if (!productInfo) {
      ctx.body = {
        status: failStatus,
        msg: '未找到该商品！',
      };
      ctx.status = 200;
      return;
    }
    const [addInfo, addErr] = await awaitWrap(userBaseInfo.buyTokens(uuid, productInfo.tokens));

    if (addErr) {
      ctx.body = {
        status: failStatus,
        msg: addErr,
      };
      ctx.status = 500;
      return;
    }
    if (!addInfo?.acknowledged || addInfo?.modifiedCount !== 1) {
      ctx.body = {
        status: failStatus,
        msg: '购买操作出现错误！请联系管理员',
      };
      ctx.status = 500;
      return;
    }

    ctx.body = {
      status: successStatus,
      mag: '购买成功，快去使用吧~',
      data: true,
    };
    ctx.status = 200;
    return await next();
  });
};

export default clearTopics;
