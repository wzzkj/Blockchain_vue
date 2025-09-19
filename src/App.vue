<template>
  <div>
    <h1>区块链</h1>
  </div>
  <el-tabs type="card" v-model="activeName" @tab-click="handleClick">
    <el-tab-pane
      v-for="item in tab"
      :key="item.name"
      :label="item.label"
      :name="item.name"
    ></el-tab-pane>
  </el-tabs>
</template>

<script>
export default {
  data() {
    return {
      activeName: 'first',
      tab:[{
        label: '用户管理',
        name: 'first'
      },{
        label: '矿机管理',
        name: 'second'
      },{
        label: '理财',
        name: 'third'
      },{
        label: '设置',
        name: 'fourth'
      },
      {
        label: '帮助',
        name: 'fifth'
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

<style>

</style>