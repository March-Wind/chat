import { Types } from 'mongoose';

// 修改interface所有键的类型
export type UpdatedInterface<T, N> = {
  [K in keyof T]: N;
};

export type Part2<T, K extends keyof T> = {
  [P in K]?: T[P];
};
// 将interface的某些键修改为可选
export type Part<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Part2<T, K>;
