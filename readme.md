# chat

> 接入 openai api 的项目

## start

<!-- export OPENAI_API_KEY=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 -->

1. 在终端使用`export OPENAI_API_KEY=sk-XXX`
2. 启动项目`npm run dev:node`

## 备注

1. `@dqbd/tiktoken`内部使用 wasm 文件，但是对 node 环境支持 cjs，引用 wasm 是采用读取方式(`fs.readFileSync`)，导致 webpack 打包的时候，处理不了 cjs 形式下的引用的 wasm 文件，所以对`@dqbd/tiktoken`进行了 patch，将其改为一直为 esm 形式导出，`node ./patch-package/index.mjs`,

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

   node /www/wwwroot/chat/build_node/main.cjs

   production
   development
