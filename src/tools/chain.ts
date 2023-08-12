import { isFunction } from './variable-type';
type PromiseFn = () => Promise<unknown>;
interface ChainItem {
  fetch: PromiseFn;
  nextCondition: (response: unknown) => boolean;
}
type PromiseItem = PromiseFn | ChainItem;
/**
 * 链式调用
 * @param {PromiseItem[]} promiseFns
 * @param {ContinueCondition} [condition='success']
 * @return {*}  {Promise<unknown>}
 */
const chain = (promiseFns: PromiseItem[]): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const result: any[] = [];
    const loopBody = (index: number) => {
      if (promiseFns.length <= index) {
        return;
      }
      const item = promiseFns[index]!;
      const promiseFn = isFunction(item) ? item : item.fetch;
      const nextCondition = isFunction(item) ? () => true : item.nextCondition;
      promiseFn()
        .then((response: any) => {
          result[index] = response;
          if (promiseFns.length === index + 1) {
            return resolve(result);
          }
          if (nextCondition(response)) {
            loopBody(index + 1);
          } else {
            reject(result);
          }
        })
        .catch((error: any) => {
          result[index] = error;
          reject(result);
        });
    };
    loopBody(0);
  });
};
export { chain };
