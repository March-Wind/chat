/**
 * 判断是否是数组
 * @param v
 * @return {boolean}
 * @constructor
 */
export const isArray = function <T = any>(v: unknown): v is Array<T> {
  return Object.prototype.toString.call(v) === '[object Array]';
};
/**
 * 判断是否是布尔值
 * @param v
 * @return {boolean}
 * @constructor
 */
export const isBoolean = function (v: unknown): v is boolean {
  return typeof v === 'boolean';
};
/**
 * 判断是否是日期
 * @param v
 * @return {boolean}
 * @constructor
 */
export const isDate = function (v: unknown): v is Date {
  return Object.prototype.toString.call(v) === '[object Date]';
};
/**
 * 判断是否是方法
 * @param v
 * @return {boolean}
 * @constructor
 */
export const isFunction = function (v: unknown): v is Function {
  return Object.prototype.toString.call(v) === '[object Function]';
};
/**
 * 判断是否是数字,自行判断NaN
 * @param v
 * @return {boolean|*}
 * @constructor
 */
export const isNumber = function (v: unknown): v is number {
  return typeof v === 'number';
};
/**
 * 判断是否是对象
 * @param v
 * @return {boolean}
 * @constructor
 */
export const isObject = function (v: unknown): v is Record<string, any> {
  return Object.prototype.toString.call(v) === '[object Object]';
};
/**
 * 判断是否是字符串
 * @param v
 * @return {boolean}
 * @constructor
 */
export const isString = function (v: unknown): v is string {
  return typeof v === 'string';
};
export const isPromise = function (v: unknown): v is Promise<unknown> {
  return Object.prototype.toString.call(v) === '[object Promise]';
};
// 判断是不是正则
export const isRegExp = function (v: unknown): v is RegExp {
  return Object.prototype.toString.call(v) === '[object RegExp]';
};
export const isEqual = () => {
  return false;
}; // to do

// Object.prototype.toString()会返回[object, [[class]]]的字符串:https://262.ecma-international.org/5.1/#sec-15.2.4.2
// Object对象本身就有一个toString()方法，返回的是当前对象的字符串形式，原型上的toString()返回的才是我们真正需要的包含对象数据类型的字符串。
// 由于Object.prototype.toString()本身允许被修改，像Array、Boolean、Number的toString就被重写过，所以需要调用Object.prototype.toString.call(arg)来判断arg的类型，call将arg的上下文指向Object，所以arg执行了Object的toString方法。
