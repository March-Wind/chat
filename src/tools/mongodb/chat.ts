import MG from './base';
import type { MGOptions } from './base';
interface ChatDbOptions extends MGOptions {}
class ChatDb extends MG {
  constructor(props: ChatDbOptions) {
    super(props);
  }
}

export default ChatDb;
