<template>
  <div>
  </div>
  <el-tabs type="card" v-model="activeName" @tab-click="handleClick">
    <el-tab-pane label="用户管理" name="1"><user></user></el-tab-pane>
    <el-tab-pane label="矿机管理" name="2"><mining_machine></mining_machine></el-tab-pane>
    <el-tab-pane label="理财管理" name="3"><Financial_products></Financial_products></el-tab-pane>
    <el-tab-pane label="系统设置" name="4"><sysconfig></sysconfig></el-tab-pane>
    <el-tab-pane label="公司内容简介设置" name="5"><content></content></el-tab-pane>
    <el-tab-pane label="平台资金流水" name="6"><userPlatformFlow></userPlatformFlow></el-tab-pane>
    <el-tab-pane label="团队管理" name="7"><TeamManagement></TeamManagement></el-tab-pane>
    
  </el-tabs>
</template>

<script>
import user from './components/user.vue';
import Financial_products from './components/Financial_products/index.vue'
import mining_machine from './components/mining_machine.vue';
import sysconfig from './components/sysconfig.vue';
import { getTables } from './api/dynamicTable';
import content from './components/content.vue';
import userPlatformFlow from './components/userPlatformFlow.vue';
import TeamManagement from './components/TeamManagement.vue';
export default {
  components: {
    user,
    Financial_products,
    mining_machine,
    sysconfig,
    content,
    userPlatformFlow,
    TeamManagement
  },
  data() {
    return {
      activeName: '1',
    };
  },
  methods: {
    handleClick(tab, event) {
      console.log(tab, event);
    },
    async loadTables(){
        try {
          const list = await getTables()
          console.log('list', list)
          // tables.value = Array.isArray(list) ? list : []
          // if (!currentTable.value && tables.value.length) currentTable.value = tables.value[0]
        } catch (e) {
          ElMessage.error(e.message || '获取表名失败')
        }
      }
  },
  mounted(){
    this.loadTables()
  }
};
</script>

<style>

</style>