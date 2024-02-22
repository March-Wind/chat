import { ObjectId } from 'mongodb';
import { Schema } from 'mongoose';
import Elementary, { ElementaryOptions, preCheckConnection } from '../elementary';
import type { Model, Document, FilterQuery } from 'mongoose';
export interface ProductType {
  name: string;
  price: number;
  // 有效时长英文是effectiveTime,单位是秒
  effectiveDuration: number;
  //生效时间
  // effectiveTime: Date;
  //失效时间
  // invalidTime: Date;
  // tokens数量
  tokens: number;
}
// 定义产品接口
export interface IProduct extends Document, ProductType {}

// 创建商品Schema
const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  // effectiveTime: { type: Date, required: true },
  // invalidTime: { type: Date, required: true },
  effectiveDuration: { type: Number, required: true },
  tokens: { type: Number, required: true },
});

interface ProductParams extends Partial<ElementaryOptions> {}

/**
 * 用户数据库之基础信息
 *
 * @class UserDb
 * @extends {MG}
 */
class Product extends Elementary {
  protected schema = ProductSchema;
  protected model: Model<IProduct>;
  constructor(options: ProductParams = {}) {
    const dbName = 'transactions';
    const collectionName = 'products';
    const defaultParentOptions = {
      collectionName,
      dbName,
    };
    const parentOptions = options;
    const newParentOptions = {
      ...defaultParentOptions,
      ...parentOptions,
    };
    super(newParentOptions);
  }
  @preCheckConnection
  async drop() {
    const { model } = this;
    return await model.collection.drop();
  }
  @preCheckConnection
  async insertOne(data: ProductType) {
    const { model } = this;
    const doc = new model(data);
    return await doc.save();
  }
  @preCheckConnection
  async insertMany(data: ProductType[]) {
    const { model } = this;
    return await model.insertMany(data);
  }
  @preCheckConnection
  async findOne(id: string) {
    const { model } = this;
    return await model.findOne({ _id: new ObjectId(id) });
  }
  /**
   * 更新字段，传多少字段就更新多少字段
   *
   * @param {string} key
   * @param {Partial<AutoTokenModel>} data
   * @return {*}
   * @memberof AutoToken
   */
  @preCheckConnection
  async updateOne(key: string, data: Partial<ProductType>) {
    const { model } = this;
    return await model.updateOne({ key }, { $set: data });
  }

  @preCheckConnection
  async findOneAndUpdate(query: FilterQuery<ProductType>, data: Partial<ProductType>) {
    const { model } = this;
    return await model.findOneAndUpdate(query, { $set: data });
  }
  @preCheckConnection
  queryProducts() {
    const { model } = this;
    return model.find();
  }
}

export default Product;
