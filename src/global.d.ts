declare global {
  // 全局变量
  var example1: string;
  namespace NodeJS {
    interface ProcessEnv {
      // [key: string]: string | undefined;
      SECRET_KEY: string;
      OPENAI_API_KEY: string;
      MONGODB_URI: string;
      OPENAI_API_KEY_40?: string;
      OPENAI_API_KEY_35?: string;
    }
  }
}

// declare module '*.json' {
//   const value: Record<string, any>;
//   export default value;
// }

export {};
