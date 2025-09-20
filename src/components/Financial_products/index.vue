<template>
  <div>
  </div>
  <el-tabs type="card" v-model="activeName" @tab-click="handleClick">
    <el-tab-pane label="动态理财产品管理" name="1"><dynamic_financial_product></dynamic_financial_product></el-tab-pane>
    <el-tab-pane label="静态理财产品管理" name="2"><static_financial_product></static_financial_product></el-tab-pane>
  </el-tabs>
</template>

<script>
import dynamic_financial_product from './dynamic_financial_product.vue';
import static_financial_product from './static_financial_product.vue';
export default {
  components: {
    dynamic_financial_product,
    static_financial_product
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
  }
};
</script>

<style>

</style>