import MG from './base';
import type { MGOptions } from './base';
interface OrderOptions extends MGOptions {}
class Order extends MG {
  constructor(props?: OrderOptions) {
    super(props);
  }
  getOrder() {
    return 1;
  }
}

export default Order;
