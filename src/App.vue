<template>
  <div>
    <div>
      <h1>区块链</h1>
    </div>
    <el-tabs type="card" v-model="activeName" @tab-click="handleClick">
      <el-tab-pane v-for="item in tab" :key="item.name" :label="item.label" :name="item.name">{{ item.input }}</el-tab-pane>
    </el-tabs>
  </div>

</template>

<script>
import user from './components/user.vue'
export default {
  components: { user },
  data() {
    return {
      activeName: '1',
      tab: [{
        label: '用户管理',
        name: '1',
        input:'<user/>'
      }, {
        label: '矿机管理',
        name: '2'

      }, {
        label: '理财管理',
        name: '3'
      }, {
        label: '设置',
        name: '4'
      }
      ]
    };
  },
  methods: {
    handleClick(tab, event) {
      console.log(tab, event);
    },
  },
};
</script>

<style></style>