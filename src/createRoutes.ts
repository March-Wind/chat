import Router from '@koa/router';
import getAnswer from './api/get-answer';
import playChat from './api/chat';
const router = new Router();
getAnswer(router);
playChat(router);

export default router;
