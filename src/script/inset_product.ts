import Product from '../tools/mongodb/transactions/products';
import type { ProductType } from '../tools/mongodb/transactions/products';
const keys: ProductType[] = [
  {
    name: '试用包',
    price: 1000,
    effectiveDuration: 3 * 24 * 60 * 60,
    tokens: 1000 * 5 * 3, // 相当于3块钱
  },
  {
    name: '月度包',
    price: 1000 * 32,
    effectiveDuration: 30 * 24 * 60 * 60, // 30天有效
    tokens: 1000 * 5 * 32, // 相当于32块钱
  },
];

const exec = async (data: ProductType[]) => {
  const product = new Product();
  await product.insertMany(data).catch((err) => {
    console.log(err);
  });
  console.log('完成！');
};

exec(keys);
