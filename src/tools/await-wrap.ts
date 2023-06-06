type StateType = 'fulfilled' | 'rejected';

type Result<F = any, R = any> = [F | undefined, R | undefined, StateType];

/**
 * 扁平化promise函数，将promise的结果和状态放在数组里面返回
 *
 * @template T
 * @param {T} p
 * @return {*}  {Promise<Result<Awaited<T>>>}
 * @example
 * const [fulfilled, rejected, state] = await awaitWrap(promise);
 */
const awaitWrap = async <T extends Promise<any>>(p: T): Promise<Result<Awaited<T>>> => {
  let fulfilled: Awaited<T> | undefined;
  let rejected: any;
  let state: StateType;
  try {
    fulfilled = await p;
    state = 'fulfilled';
  } catch (error) {
    rejected = error;
    state = 'rejected';
  }
  return [fulfilled, rejected, state];
};

export default awaitWrap;
