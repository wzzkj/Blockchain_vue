<template>
  <div>
    <!-- 登录表单：只在未登录时显示 -->
    <div v-if="!isLoggedIn" class="login-container">
      <el-form :model="loginForm" @submit.native.prevent="handleLogin" label-width="80px" class="login-form">
        <h2>后台管理登录</h2>
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="loginForm.password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin">登录</el-button>
        </el-form-item>
        <!-- 加一个提示语，登录成功后如果页面提示token错误，请刷新页面 -->
        <div class="login-tip">登录成功后如果页面提示token错误，请刷新页面</div>
      </el-form>
    </div>

    <!-- 主内容：只在登录成功后显示 -->
    <div v-if="isLoggedIn">
      <el-tabs type="card" v-model="activeName" @tab-click="handleClick">
        <el-tab-pane label="用户管理" name="1"><user></user></el-tab-pane>
        <el-tab-pane label="矿机管理" name="2"><mining_machine></mining_machine></el-tab-pane>
        <el-tab-pane label="理财管理" name="3"><Financial_products></Financial_products></el-tab-pane>
        <el-tab-pane label="系统设置" name="4"><sysconfig></sysconfig></el-tab-pane>
        <el-tab-pane label="公司内容简介设置" name="5"><content></content></el-tab-pane>
        <el-tab-pane label="平台资金流水" name="6"><userPlatformFlow></userPlatformFlow></el-tab-pane>
        <el-tab-pane label="团队管理" name="7"><TeamManagement></TeamManagement></el-tab-pane>
        <el-tab-pane label="STY交易池管理" name="8"><StyExchange></StyExchange></el-tab-pane>
        <el-tab-pane label="用户提现审批" name="9"><UserWithdrawalReview></UserWithdrawalReview></el-tab-pane>
        <el-tab-pane label="会员等级" name="10"><VipLevelManagement></VipLevelManagement></el-tab-pane>
        <el-tab-pane label="签到奖励配置" name="11"><SignInReward></SignInReward></el-tab-pane>
        <el-tab-pane label="系统接口调用日志" name="12"><sysOpenLog></sysOpenLog></el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
// 引入你的 API 调用函数
import { adminLogin, checkAdminToken } from './api/admin.js';
// 引入其他组件
import user from './components/user.vue';
import Financial_products from './components/Financial_products/index.vue';
import mining_machine from './components/mining_machine.vue';
import sysconfig from './components/sysconfig.vue';
import { getTables } from './api/dynamicTable';
import content from './components/content.vue';
import userPlatformFlow from './components/userPlatformFlow.vue';
import TeamManagement from './components/TeamManagement.vue';
import StyExchange from './components/StyExchange.vue';
import UserWithdrawalReview from './components/UserWithdrawalReview.vue';
import VipLevelManagement from './components/VipLevelManagement.vue';
import SignInReward from './components/SignInReward.vue';
import sysOpenLog from './components/sysOpenLog.vue';

export default {
  components: {
    user,
    Financial_products,
    mining_machine,
    sysconfig,
    content,
    userPlatformFlow,
    TeamManagement,
    StyExchange,
    UserWithdrawalReview,
    VipLevelManagement,
    SignInReward,
    sysOpenLog
  },
  data() {
    return {
      activeName: '1',
      isLoggedIn: false, // 控制登录状态，默认为 false
      loginForm: {
        username: '',
        password: ''
      }
    };
  },
  methods: {
    handleClick(tab, event) {
      console.log(tab, event);
    },
    // async loadTables() {
    //   try {
    //     const list = await getTables();
    //     console.log('list', list);
    //   } catch (e) {
    //     this.$message.error(e.message || '获取表名失败');
    //   }
    // },
    /**
     * 处理登录逻辑
     */
     async handleLogin() {
      if (!this.loginForm.username || !this.loginForm.password) {
        this.$message.error('用户名和密码不能为空');
        return;
      }
      this.loading = true; // 开始登录，设置按钮为加载中

      try {
        const response = await adminLogin(this.loginForm);

        if (response.code === 200) {
          this.$message.success(response.message || '登录成功，即将跳转...');
          localStorage.setItem('admin_token', response.data);

          // **** 核心修改 ****
          // 等待 1.5 秒（1500毫秒）后再执行后续操作
          setTimeout(() => {
            this.loading = false; 
          }, 1500); 
            this.isLoggedIn = true;
        } else {
          this.$message.error(response.message || '用户名或密码错误');
          this.loading = false; // 登录失败，立即结束加载状态
        }
      } catch (error) {
        console.error('登录请求失败', error);
        this.$message.error('登录失败，请检查网络或联系管理员');
        this.loading = false; // 请求异常，立即结束加载状态
      }
    },
    /**
     * 检查本地存储的 token 是否有效
     */
    async verifyToken() {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        this.isLoggedIn = false;
        return;
      }

      try {
        // checkAdminToken 返回的也应该是解析好的 JS 对象
        const response = await checkAdminToken(token);

        if (response.code === 200) {
          // Token 有效
          this.isLoggedIn = true;
          // Token有效，加载主内容所需的数据
          // this.loadTables();
        } else {
          // Token 无效
          this.isLoggedIn = false;
          localStorage.removeItem('admin_token'); // 清除无效的 token
        }
      } catch (error) {
        console.error('Token 验证失败', error);
        this.isLoggedIn = false;
        localStorage.removeItem('admin_token');
      }
    }
  },
  /**
   * 组件挂载时，立即检查 token
   */
  mounted() {
    this.verifyToken();
  }
};
</script>

<style>
/* 样式保持不变 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-form {
  width: 400px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 20px;
}

/* 新增的提示语样式 */
.login-tip {
  font-size: 12px;
  color: #909399; /* 使用 Element UI 的次要文字颜色 */
  text-align: center;
  margin-top: 15px;
}
</style>