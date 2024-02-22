import Router from '@koa/router';
// import getAnswer from './api/get-answer';
import playChat from './api/user/messages/chat';
import registerUser from './api/user/base/register';
import loginUser from './api/user/base/login';
import getMyselfTopics from './api/user/messages/get-myself-topics';
import createTopicByTopicId from './api/user/messages/createTopicByTopicId';
import deleteTopic from './api/user/messages/deleteTopic';
import clearTopics from './api/user/messages/clearTopics';
import queryTopicMessages from './api/user/messages/queryTopicMessages';
import regenerateContent from './api/user/messages/regenerate-content';
import queryPrompts from './api/setting/queryPrompts';
import addUserPrePrompt from './api/user/prompts/add-pre-prompt';
import queryUserPrePrompt from './api/user/prompts/query-pre-prompts';
import updateUserPrePrompt from './api/user/prompts/update-pre-prompt';
import deleteUserPrePrompt from './api/user/prompts/delete-pre-prompt';
import queryProducts from './api/transaction/queryProducts';
import buy from './api/transaction/buy';
const router = new Router();
// getAnswer(router);
playChat(router);
registerUser(router);
loginUser(router);
getMyselfTopics(router);
createTopicByTopicId(router);
deleteTopic(router);
clearTopics(router);
queryTopicMessages(router);
regenerateContent(router);
queryPrompts(router);
addUserPrePrompt(router);
queryUserPrePrompt(router);
updateUserPrePrompt(router);
deleteUserPrePrompt(router);
queryProducts(router);
buy(router);
export default router;
