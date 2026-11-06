import { defineConfig } from 'vite';

// Vite 工程配置：入口指定为 index4.html（TS 版页面）。
// 根目录的 index/2/3.html 是历史版本页面，不参与 Vite 构建。
export default defineConfig({
  // 相对路径：构建产物 dist/index4.html 也能被任意静态服务器托管
  base: './',
  server: {
    open: '/index4.html', // npm run dev 自动打开正确页面，不用手敲路径
  },
  preview: {
    open: '/index4.html',
  },
  build: {
    rollupOptions: {
      input: {
        todo: 'index4.html',
      },
    },
  },
});
