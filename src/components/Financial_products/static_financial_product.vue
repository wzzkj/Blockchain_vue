<template>
    <div class="static-financial-product-container">
        <!-- 操作栏：放置新增按钮 -->
        <div class="toolbar">
            <el-button type="primary" @click="handleCreate">新增静态理财产品</el-button>
        </div>

        <!-- 表格主体 -->
        <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
            <!-- 
                v-for 遍历的是我们在 data 中预定义的 tableColumns 数组。
                这样可以保证即使没有数据，表头也能正确显示。
            -->
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
            <el-form ref="staticProductForm" :model="formModel" :rules="formRules" label-width="120px">
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
// 引入所需的 API 和 Element Plus 组件
import { getRows, createRow, updateRow, deleteRow } from '../../api/dynamicTable';
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
      // 关键修改点 1: 更改表名
      tableName: 'b_static_financial_product',

      // 预先定义好表格的列结构，与后端实体类 StaticFinancialProduct 对应
      tableColumns: [
          { prop: 'id', label: 'ID' },
          { prop: 'name', label: '产品名称' },
          { prop: 'type', label: '类型' },
          { prop: 'price', label: '单价/起投金额' },
          { prop: 'cycleDays', label: '周期(时)' },
          { prop: 'yieldRate', label: '收益率' },
          { prop: 'purchaseLimit', label: '限购数量' },
          { prop: 'uid', label: '用户UID' },
          { prop: 'uuid', label: 'UUID' },
          { prop: 'creatTime', label: '创建时间' },
          { prop: 'updateTime', label: '更新时间' }
      ],

      dialogVisible: false,
      dialogTitle: '',
      formModel: {},
      formRules: { // 定义表单校验规则
          name: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
          price: [{ required: true, message: '单价/起投金额不能为空', trigger: 'blur' }],
          cycleDays: [{ required: true, message: '周期天数不能为空', trigger: 'blur' }],
          yieldRate: [{ required: true, message: '收益率不能为空', trigger: 'blur' }],
      }
    }
  },
  computed: {
    // 根据预定义的 tableColumns 自动计算出表单需要显示的字段
    formFields() {
      return this.tableColumns.filter(col => !EXCLUDED_FORM_FIELDS.includes(col.prop));
    }
  },
  methods: {
    // --- 查 (Read) ---
    async loadTables() {
        this.loading = true;
        try {
            const list = await getRows(this.tableName);
            this.tableData = Array.isArray(list) ? list : [];
        } catch (e) {
            this.tableData = [];
            ElMessage.error(e.message || '数据加载失败');
        } finally {
            this.loading = false;
        }
    },

    // --- 增 (Create) ---
    handleCreate() {
        const seed = Date.now().toString() + Math.random().toString();
        this.formModel = {
            uuid: md5('uuid-' + seed),
            keyField: md5('key-' + seed),
            purchaseLimit: '0' // 默认不限购
        };
        // 关键修改点 2: 更改对话框标题
        this.dialogTitle = '新增静态理财产品';
        this.dialogVisible = true;
        this.$nextTick(() => {
            this.$refs.staticProductForm?.clearValidate();
        });
    },

    // --- 改 (Update) ---
    handleEdit(row) {
        this.formModel = { ...row };
        // 关键修改点 3: 更改对话框标题
        this.dialogTitle = '编辑静态理财产品';
        this.dialogVisible = true;
        this.$nextTick(() => {
            this.$refs.staticProductForm?.clearValidate();
        });
    },

    // --- 删 (Delete) ---
    async handleDelete(row) {
        try {
            // 关键修改点 4: 更改确认信息
            await ElMessageBox.confirm(
                `确定要删除静态理财产品 "${row.name}" (ID: ${row.id}) 吗？`,
                '警告', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
            );
            await deleteRow(this.tableName, row.id);
            ElMessage.success('删除成功！');
            this.loadTables();
        } catch (error) {
            if (error !== 'cancel') {
              ElMessage.error(error.message || '删除失败');
            }
        }
    },

    // --- 表单操作 (无需修改) ---
    cancelForm() {
        this.dialogVisible = false;
    },

    submitForm() {
        this.$refs.staticProductForm.validate(async (valid) => {
            if (valid) {
                const payload = { ...this.formModel };
                try {
                    if (payload.id) {
                        await updateRow(this.tableName, payload.id, payload);
                        ElMessage.success('更新成功！');
                    } else {
                        await createRow(this.tableName, payload);
                        ElMessage.success('新增成功！');
                    }
                    this.dialogVisible = false;
                    this.loadTables();
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