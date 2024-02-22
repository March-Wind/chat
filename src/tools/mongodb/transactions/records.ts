import { Schema } from 'mongoose';
import Elementary, { ElementaryOptions, preCheckConnection } from '../elementary';
import { mongodb_uri } from '../../../env';
import type { Model, Document, Types, FilterQuery } from 'mongoose';
import type { IProduct } from './products';

// 定义订单内商品子文档的接口
interface IOrderProduct {
  product: IProduct['_id'];
  quantity: number;
}

// 定义订单接口
interface IOrder extends Document {
  orderNumber: string;
  orderDate: Date;
  paymentMethod: string;
  userUUid: Types.ObjectId; // 引用User集合中的文档ID
  products: IOrderProduct[];
}

// 创建订单Schema
const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true },
  orderDate: { type: Date, default: new Date() },
  paymentMethod: { type: String },

  userUUid: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  products: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
});
// 上升到程序里是唯一的，保证不重复创建模型
// export const _model = model(collectionName, _schema);

interface BaseInfoParams extends Partial<ElementaryOptions> {}

/**
 * 用户数据库之基础信息
 *
 * @class UserDb
 * @extends {MG}
 */
class Records extends Elementary {
  protected schema = OrderSchema;
  protected model: Model<IOrder>;
  constructor(options: BaseInfoParams = {}) {
    const dbName = 'transactions';
    const collectionName = 'records';
    const defaultParentOptions = {
      uri: mongodb_uri,
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
  async insertOne(data: IOrder) {
    const { model } = this;
    const doc = new model(data);
    return await doc.save();
  }
  @preCheckConnection
  async insertMany(data: IOrder[]) {
    const { model } = this;
    return await model.insertMany(data);
  }
  @preCheckConnection
  async findOne(key: string) {
    const { model } = this;
    return await model.findOne({ key });
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
  async updateOne(key: string, data: Partial<IOrderProduct>) {
    const { model } = this;
    return await model.updateOne({ key }, { $set: data });
  }

  @preCheckConnection
  async findOneAndUpdate(query: FilterQuery<IOrderProduct>, data: Partial<IOrderProduct>) {
    const { model } = this;
    return await model.findOneAndUpdate(query, { $set: data });
  }
}

export default Records;
