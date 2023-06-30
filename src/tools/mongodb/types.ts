import type { Schema } from 'mongoose';
// 用于获取Schema的参数ts类型
export type SchemaParamType<T> = T extends Schema<any, any, any, any, any, any, any, infer ParamsType>
  ? ParamsType
  : never;
