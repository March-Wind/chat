import type { Schema, Model, Types, Document } from 'mongoose';
// 用于获取Schema的参数ts类型
export type SchemaParamType<T> = T extends Schema<any, any, any, any, any, any, any, infer ParamsType>
  ? ParamsType
  : never;
// 行Document类型抓取Doc
export type GetDocumentDoc<T> = T extends Document<unknown, {}, infer Doc> ? Doc : never;
// 从类似这种类型中抓取Document类型(Document<unknown, {}, UserPrompt> & UserPrompt & { _id: Types.ObjectId; } & { _id: any; })
export type ExtractDocumentType<T> = T extends Document<infer U, infer V, infer W> ? Document<U, V, W> : never;
// 从类型T中删除包含P的key
export type ExtractNotPKey<T, P> = {
  [K in keyof T]: K extends keyof P ? never : T[K];
};

export type TransformInterface<T> = {
  [K in keyof T]: T[K] extends Types.DocumentArray<infer U> ? U[] : T[K];
};

export type TransformInterface2<T> = {
  [K in keyof T]: T[K] extends Types.DocumentArray<infer U>
    ? TransformInterface2<U>[] // 递归处理嵌套的类型
    : T[K];
};
