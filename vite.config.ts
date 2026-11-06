import { defineConfig } from 'vite';

// Vite 工程配置：入口指定为 index4.html（TS 版页面）。
// 根目录的 index/2/3.html 是历史版本页面，不参与 Vite 构建。
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        todo: 'index4.html',
      },
    },
  },
});
