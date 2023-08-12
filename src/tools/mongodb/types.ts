import type { Schema, Model, Types } from 'mongoose';
// 用于获取Schema的参数ts类型
export type SchemaParamType<T> = T extends Schema<any, any, any, any, any, any, any, infer ParamsType>
  ? ParamsType
  : never;

export type TransformInterface<T> = {
  [K in keyof T]: T[K] extends Types.DocumentArray<infer U> ? U[] : T[K];
};

export type TransformInterface2<T> = {
  [K in keyof T]: T[K] extends Types.DocumentArray<infer U>
    ? TransformInterface2<U>[] // 递归处理嵌套的类型
    : T[K];
};
