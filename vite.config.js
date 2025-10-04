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
  },
    transpileDependencies: true,
  devServer: {
    host: '0.0.0.0',   // 监听所有网卡，保证外部能访问
    port: 5173,
    // 更安全：只允许特定域名（比如 ngrok 或 frp 的域名）
    // 如果只是临时调试，想一劳永逸：
     allowedHosts: 'all',
    // ⚠️ 注意：'all' 虽然最省事，但不安全，只建议本地内网穿透调试时用
      hot: false,     // 关闭 HMR
  liveReload: false // 关闭自动刷新
  }
})