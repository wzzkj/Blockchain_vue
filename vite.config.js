import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 1. 引入 Node.js 的 path 模块，用于路径解析
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // 2. 在这里添加 resolve.alias 配置
  resolve: {
    alias: {
      // 关键配置：当有代码尝试从 'vue' 导入默认导出时，
      // Vite 会将路径指向 'vue/dist/vue.esm-bundler.js'。
      // 这个文件包含了兼容旧写法的默认导出，从而解决报错。
      'vue': 'vue/dist/vue.esm-bundler.js',
    }
  }
})