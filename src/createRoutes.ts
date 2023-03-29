import Router from '@koa/router';
import getAnswer from './api/get-answer';
import sse from './api/sse';
import page from './api/page';
import complete from './api/complete';
const router = new Router();
getAnswer(router);

sse(router);

page(router);
complete(router);
export default router;
