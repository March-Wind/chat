import { Mixin } from 'ts-mixer';
import UserDb from './users/user';
import ChatDb from './chat';
class DB extends Mixin(UserDb, ChatDb) {}
export default DB;
