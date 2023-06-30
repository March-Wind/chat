// 修改interface所有键的类型
export type UpdatedInterface<T, N> = {
  [K in keyof T]: N;
};
