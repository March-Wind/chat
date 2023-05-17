// import { MongoClient, } from 'mongodb'
// import type { Collection, Document, Db, AnyBulkWriteOperation, WithId, UpdateOneModel, Filter, UpdateFilter, PushOperator } from 'mongodb'
// import { isArray, isObject } from '../util/variable-type'
// interface Options {
//   url?: string;
// }

// class MG {
//   private client: MongoClient
//   constructor(options: Options) {
//     const { url = 'mongodb://localhost:27017' } = options;
//     const client = new MongoClient(url);
//     this.client = client;
//   }
//   protected async connect() {
//     await this.client.connect().catch((error) => {
//       debugger
//     })
//   }
//   protected connectCollection<T extends Document>(dbName: string, collectionName: string): Collection<T> {
//     const database = this.client.db(dbName);
//     const collection = database.collection<T>(collectionName);
//     return collection
//   }
//   close() {
//     this.client.close();
//   }
//   protected async search<T extends Document>(collection: Collection<T>) {
//     const findCursor = await collection.find()
//     const data = await findCursor.toArray();
//     return data;
//   }

//   /*********** 针对文档的方法 ***********/
//   /**
//    * 批量插入多个文档，如果存在就不操作，不存在就插入
//    * $setOnInsert与 upsert: true 共同实现条件判断
//    * @protected
//    * @template T
//    * @param {Collection<T>} collection
//    * @param {T[]} data
//    * @param {string} identification
//    * @memberof MG
//    */
//   protected async bulkWriteDocument<T extends Document>(collection: Collection<T>, data: T[], identification: string) {
//     const operations: AnyBulkWriteOperation<T>[] = data.map((item) => {
//       const filter: Filter<T> = {
//         [identification]: item[identification]
//       } as Filter<T>; // to do filter的类型写不对。 这个需要写_id，_id是主键
//       const update = {
//         $setOnInsert: item
//       }
//       const updateOne: UpdateOneModel<T> = {
//         filter,
//         update,
//         upsert: true,
//       }
//       return {
//         updateOne
//       };
//     })
//     await collection.bulkWrite(operations)
//   }
//   /**
//    * 插入单个文档，有就略过，没有就插入
//    * $setOnInsert与 upsert: true 共同实现条件判断
//    * @protected
//    * @template T
//    * @param {Collection<T>} collection
//    * @param {(Object|any[])} data
//    * @param {string} identification
//    * @memberof MG
//    */
//   protected async updateOrSetOneDocument<T extends Document>(collection: Collection<T>, data: T, identification: string) {
//     const cl = collection;
//     const options = {
//       upsert: true
//     }
//     if (isObject(data)) {
//       const filter = {
//         [identification]: data[identification]
//       } as Filter<T>; // to do 写不对Filter和UpdateFilter类型
//       const result = await cl.updateOne(filter, { $setOnInsert: data } as UpdateFilter<T>, options);
//       console.log('updateOrSet：成功！')
//     }
//   }

//   /*********** 针对文档字段的方法 ***********/
//   /**
//    * 将数据加到指定document的指定数组中的后面，并且不重复才会加到后面，重复不操作.
//    *
//    * @protected
//    * @template T
//    * @param {Collection<T>} collection
//    * @param {T} data
//    * @param {string} document_identifier
//    * @param {string} item_identifier
//    * @memberof MG
//    */
//   protected async pushIntoArray<T extends Document>(collection: Collection<T>, data: T, document_identifier: string, item_identifier: string) {
//     const filter = {
//       [document_identifier]: data[document_identifier]
//     } as Filter<T>
//     const update = {
//       $push: { "kLine.$[item]": data }
//     } as unknown as UpdateFilter<T> // to do 不知道怎么写
//     const arrayFilters = [
//       { [`item.${item_identifier}`]: { $ne: data[item_identifier] } }
//     ]
//     const option = {
//       arrayFilters,
//     }
//     collection.updateOne(filter, update, option)
//   }

//   /**
//    *覆盖文档字段,不存在这个文档时，也不增加文档。
//    *
//    * @protected
//    * @template T
//    * @param {Collection<T>} collection
//    * @param {T} data
//    * @param {Filter<Document>} filter
//    * @memberof MG
//    */
//   protected async updateOrSetField<T extends Document>(collection: Collection<T>, data: T, filter: Filter<Document>) {
//     if (isObject(data)) {
//       const result = await collection.updateOne(filter, { $set: data } as UpdateFilter<T>);
//       console.log(result);
//     }
//   }
//   /**
//    * 添加字段到文档，如果存在就不添加。
//    *
//    * @protected
//    * @template T
//    * @param {Collection<T>} collection
//    * @param {T} data
//    * @param {Filter<Document>} filter
//    * @memberof MG
//    */
//   protected async addFieldIfNotExists<T extends Document>(collection: Collection<T>, data: T, filter: Filter<Document>) {
//     if (isObject(data)) {
//       const operations: AnyBulkWriteOperation<T>[] = Object.keys(data).map((key: keyof Document) => {
//         const _filter = {
//           ...filter,
//           [key]: { $exists: false }
//         } as Filter<T>; // to do
//         // type AS = Pick<T, typeof key>;
//         const updateOne: UpdateOneModel<any> = {
//           filter: _filter,
//           update: {
//             $set: {
//               [key]: data[key]
//             }
//           }
//         }
//         return { updateOne }
//       })
//       const result = await collection.bulkWrite(operations);
//       console.log(result);
//       /**聚合管道 */
//       // const result = collection.aggregate([
//       //   { $match: filter },
//       //   { $addFields: { listedTime: 1218 } }
//       // ])
//       // for await (const doc of result) {
//       //   console.log(doc);
//       // }
//       /**直接覆盖 */
//       // const _filter: Filter<Document> = {
//       //   ...filter,
//       // }
//       // const result = await collection.updateOne(_filter, { $: data } as UpdateFilter<T>);
//       // console.log(result);
//     }
//   }
//   protected async insert(dbName: string, collectionName: string, data: Object | any[]) {
//     try {
//       // 新建数据库或者连接
//       const database = this.client.db(dbName);
//       // Specifying a Schema is optional, but it enables type hints on
//       // finds and inserts
//       const cl = database.collection(collectionName);
//       if (isArray(data)) {
//         const result = await cl.insertMany(data);
//         // console.log(`A document was inserted with the _id: ${result.insertedId}`);
//       }
//       if (isObject(data)) {
//         const result = await cl.insertOne(data);
//         console.log('insert数据成功！')
//         // const result = await cl.updateMany(data);
//         // console.log(`A document was inserted with the _id: ${result.insertedId}`);
//       }
//     } catch (err) {
//       console.log(err)
//       throw new Error('insert数据报错')
//     }
//   }

//   protected async drop(dbName: string, collectionName?: string) {
//     if (dbName && !collectionName) {
//       const db = this.client.db(dbName);
//       db.dropDatabase();
//     }

//     if (dbName && collectionName) {
//       const db = this.client.db(dbName);
//       const cl = db.collection(collectionName);
//       await cl.drop();
//     }
//   }
// }

// export default MG;
