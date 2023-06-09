# chat

> 接入 openai api 的项目

## start
  1. 在终端使用`export OPENAI_API_KEY=sk-XXXXXXX`
  2. 启动项目`npm run dev:node`

## 备注
  1. `@dqbd/tiktoken`内部使用wasm文件，但是对node环境支持cjs，引用wasm是采用读取方式(`fs.readFileSync`)，导致webpack打包的时候，处理不了cjs形式下的引用的wasm文件，所以对`@dqbd/tiktoken`进行了patch，将其改为一直为esm形式导出，`node ./patch-package/index.mjs`,
      ```
        for (const candidate of candidates) {
          try {
            bytes = fs.readFileSync(candidate);
            break;
          } catch {}
        }

        if (bytes == null) throw new Error("Missing tiktoken_bg.wasm");
        const wasmModule = new WebAssembly.Module(bytes);
        const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
      ```