<template>
    <div class="static-financial-product-container">
        <!-- 操作栏：放置新增按钮 -->
        <div class="toolbar">
            <el-button type="primary" @click="handleCreate">新增静态理财产品</el-button>
        </div>

        <!-- 表格主体 -->
        <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
            <el-table-column
                v-for="column in tableColumns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                show-overflow-tooltip
                min-width="150"
            >
            </el-table-column>
            <!-- 固定在右侧的操作列 -->
            <el-table-column label="操作" fixed="right" width="180">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新增/编辑 对话框 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" top="5vh">
            <el-form ref="staticProductForm" :model="formModel" :rules="formRules" label-width="140px">
                <el-form-item 
                    v-for="field in formFields" 
                    :key="field.prop" 
                    :label="field.label" 
                    :prop="field.prop"
                >
                    <!-- 对 description 字段使用 textarea -->
                    <el-input
                        v-if="field.prop === 'description'"
                        type="textarea"
                        :rows="3"
                        v-model="formModel[field.prop]"
                        :placeholder="'请输入' + field.label"
                    />
                    <!-- 其他字段使用普通 input -->
                    <el-input
                        v-else
                        v-model="formModel[field.prop]"
                        :placeholder="'请输入' + field.label"
                        :disabled="field.prop === 'uuid' || field.prop === 'keyField'"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancelForm">取 消</el-button>
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
// ========================= 代码重构点 1: 引入新的专用API接口 =========================
import {
    addStaticProduct,
    deleteStaticProduct,
    updateStaticProduct,
    listAllStaticProductsAdmin
} from '../../api/staticProductAPI'; // 假设你的API文件名为 staticProductAPI.js
import { ElMessage, ElMessageBox } from 'element-plus';
import md5 from 'js-md5';

// 定义表单中不需要用户编辑的字段
const EXCLUDED_FORM_FIELDS = ['id', 'creatTime', 'updateTime'];

export default {
  name: 'static_financial_product',
  data() {
    return {
      loading: false,
      tableData: [],
      // tableName 不再需要

      // ================== 代码重构点 2: 根据 StaticFinancialProduct 实体类更新列定义 =================
      tableColumns: [
          { prop: 'id', label: 'ID' },
          { prop: 'name', label: '产品名称' },
          { prop: 'type', label: '类型' },
          { prop: 'price', label: '单价/起投金额' },
          { prop: 'cycleDays', label: '周期(时)' }, // Pojo 中是天
          { prop: 'yieldRate', label: '收益率' },
          { prop: 'purchaseLimit', label: '限购数量(为0表示无限制)' },
          // 新增字段
        //   { prop: 'limitNumberPurchases', label: '限制购买次数' },
        //   { prop: 'uid', label: '用户UID' },
        //   { prop: 'uuid', label: 'UUID' },
          { prop: 'creatTime', label: '创建时间' },
          { prop: 'updateTime', label: '更新时间' }
      ],

      dialogVisible: false,
      dialogTitle: '',
      formModel: {},
      formRules: {
          name: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
          price: [{ required: true, message: '单价/起投金额不能为空', trigger: 'blur' }],
          cycleDays: [{ required: true, message: '周期(时)不能为空', trigger: 'blur' }],
          yieldRate: [{ required: true, message: '收益率不能为空', trigger: 'blur' }],
      }
    }
  },
  computed: {
    formFields() {
      // 这个计算属性逻辑很棒，无需修改，会自动把新增的字段包含进来
      return this.tableColumns.filter(col => !EXCLUDED_FORM_FIELDS.includes(col.prop));
    }
  },
  methods: {
    // =================== 代码重构点 3: 使用 listAllStaticProductsAdmin 加载数据 ===================
    async loadTables() {
        this.loading = true;
        try {
            // 注意：管理员后台通常调用 admin 接口
            const response = await listAllStaticProductsAdmin();
            if (response && response.data) {
                this.tableData = Array.isArray(response.data) ? response.data : [];
            } else {
                this.tableData = [];
                ElMessage.error(response.msg || '数据加载失败');
            }
        } catch (e) {
            this.tableData = [];
            ElMessage.error(e.message || '数据加载异常');
        } finally {
            this.loading = false;
        }
    },

    // =================== 代码重构点 4: 在 handleCreate 中初始化新增的字段 ===================
    handleCreate() {
        const seed = Date.now().toString() + Math.random().toString();
        this.formModel = {
            uuid: md5('uuid-' + seed),
            keyField: md5('key-'+ seed),
            purchaseLimit: '0', // 默认不限购
            limitNumberPurchases: 0 // 新增字段，默认值为0 (无限制)
        };
        this.dialogTitle = '新增静态理财产品';
        this.dialogVisible = true;
        this.$nextTick(() => {
            this.$refs.staticProductForm?.clearValidate();
        });
    },

    // handleEdit 逻辑不变，因为 { ...row } 会自动带上所有字段
    handleEdit(row) {
        this.formModel = { ...row }; 
        this.dialogTitle = '编辑静态理财产品';
        this.dialogVisible = true;
        this.$nextTick(() => {
            this.$refs.staticProductForm?.clearValidate();
        });
    },

    // ====================== 代码重构点 5: 使用 deleteStaticProduct 删除数据 ======================
    async handleDelete(row) {
        try {
            await ElMessageBox.confirm(
                `确定要删除静态理财产品 "${row.name}" (ID: ${row.id}) 吗？`,
                '警告', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
            );
            const result = await deleteStaticProduct(row.id);
            if (result && result.code!==400) {
                ElMessage.success('删除成功！');
                this.loadTables();
            } else {
                ElMessage.error(result.msg || '删除失败');
            }
        } catch (error) {
            if (error !== 'cancel') {
              ElMessage.info('操作已取消或发生错误');
            }
        }
    },

    cancelForm() {
        this.dialogVisible = false;
    },

    // =================== 代码重构点 6: 使用 add/updateStaticProduct 提交表单 ===================
    submitForm() {
        this.$refs.staticProductForm.validate(async (valid) => {
            if (valid) {
                const payload = { ...this.formModel };
                try {
                    let result;
                    const actionText = payload.id ? '更新' : '新增';

                    if (payload.id) { // 更新
                        result = await updateStaticProduct(payload);
                    } else { // 新增
                        result = await addStaticProduct(payload);
                    }
                    
                    if (result && result.code!==400) {
                        ElMessage.success(`${actionText}成功！`);
                        this.dialogVisible = false;
                        this.loadTables();
                    } else {
                        ElMessage.error(result.msg || `${actionText}失败`);
                    }
                } catch (e) {
                     ElMessage.error(e.message || '操作失败');
                }
            }
        });
    }
  },
  mounted() {
    this.loadTables();
  }
}
</script>

<style scoped>
.static-financial-product-container {
    padding: 24px;
}
.toolbar {
    margin-bottom: 18px;
}
</style>