<template>
    <div>
        <!-- 操作栏 -->
        <div class="toolbar" style="margin-bottom: 18px;">
            <el-button type="primary" @click="handleCreate">新增矿机</el-button>
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
            <el-table-column label="操作" fixed="right" width="180">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新增/编辑 对话框 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" top="5vh">
            <el-form ref="machineForm" :model="formModel" :rules="formRules" label-width="120px">
                <template v-for="field in formFields" :key="field.prop">
                    <!-- 
                        --- 关键修改点 1: 重构 v-for 内部的渲染逻辑 ---
                        我们将 v-for 移到 template 标签上，以便在内部使用 v-if/v-else-if
                    -->

                    <!-- 1. 为 cycleDays 字段提供特殊的、带动态 Label 的渲染 -->
                    <el-form-item
                        v-if="field.prop === 'cycleDays'"
                        :label="cycleLabel"
                        :prop="field.prop"
                    >
                        <el-input
                            v-model="formModel.cycleDays"
                            placeholder="根据类型自动填充"
                            
                        />
                        <!-- disabled -->
                    </el-form-item>

                    <!-- 2. 为其他字段提供常规渲染 -->
                    <el-form-item
                        v-else
                        :label="field.label" 
                        :prop="field.prop"
                    >
                        <el-select
                            v-if="field.prop === 'type'"
                            v-model="formModel[field.prop]"
                            placeholder="请选择类型"
                            style="width: 100%;"
                            @change="onTypeChange"
                        >
                            <el-option
                                v-for="option in typeOptions"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                            />
                        </el-select>
                        <el-input
                            v-else-if="field.prop === 'description'"
                            type="textarea"
                            :rows="3"
                            v-model="formModel[field.prop]"
                            :placeholder="'请输入' + field.label"
                        />
                        <el-input
                            v-else
                            v-model="formModel[field.prop]"
                            :placeholder="'请输入' + field.label"
                            :disabled="field.prop === 'uuid' || field.prop === 'keyField'"
                        />
                    </el-form-item>
                </template>
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
import { getRows, createRow, updateRow, deleteRow } from '../api/dynamicTable';
import { ElMessage, ElMessageBox } from 'element-plus';
import md5 from 'js-md5';

const EXCLUDED_FORM_FIELDS = ['id', 'creatTime', 'updateTime'];

export default {
    name: 'mining_machine',
    data() {
        return {
            loading: false,
            tableData: [],
            tableName: 'b_mining_machine',
            tableColumns: [
                { prop: 'id', label: 'ID' },
                { prop: 'name', label: '矿机名称' },
                { prop: 'type', label: '类型' },
                { prop: 'price', label: '单价' },
                { prop: 'cycleDays', label: '周期(天)' },
                { prop: 'yieldRate', label: '收益率' },
                { prop: 'purchaseLimit', label: '限购数量' },
                { prop: 'description', label: '矿机描述' },
                // { prop: 'creatTime', label: '创建时间' },
                // { prop: 'updateTime', label: '更新时间' }
            ],

            // --- 关键修改点 2: 添加类型选项 ---
           typeOptions: [
                { value: '每天', label: '每天', cycleValue: '1', cycleLabel: '周期(天)' },
                { value: '每时', label: '每时', cycleValue: '1', cycleLabel: '周期(时)' }
            ],
            cycleLabel: '周期(天)', // 用于表单的动态标签

            dialogVisible: false,
            dialogTitle: '',
            formModel: {},
            formRules: {
                name: [{ required: true, message: '矿机名称不能为空', trigger: 'blur' }],
                price: [{ required: true, message: '单价不能为空', trigger: 'blur' }],
                cycleDays: [{ required: true, message: '周期天数不能为空', trigger: 'blur' }],
                yieldRate: [{ required: true, message: '收益率不能为空', trigger: 'blur' }],
                type: [{ required: true, message: '请选择类型', trigger: 'change' }], // 为类型添加校验
            }
        };
    },
    computed: {
        formFields() {
            return this.tableColumns.filter(col => !EXCLUDED_FORM_FIELDS.includes(col.prop));
        }
    },
    methods: {
        onTypeChange(newType) {
            const selectedOption = this.typeOptions.find(option => option.value === newType);
            if (selectedOption) {
                this.formModel.cycleDays = selectedOption.cycleValue;
                this.cycleLabel = selectedOption.cycleLabel; // 同步更新 Label
            } else {
                this.formModel.cycleDays = '';
                this.cycleLabel = '周期(天)'; // 找不到则重置
            }
        },

        // --- 关键修改点 4: 更新 handleCreate ---
        handleCreate() {
            const seed = Date.now().toString() + Math.random().toString();
            // 找到默认选项
            const defaultOption = this.typeOptions[0]; 
            this.formModel = {
                uuid: md5('uuid-' + seed),
                keyField: md5('key-' + seed),
                purchaseLimit: '0',
                type: defaultOption.value,
                cycleDays: defaultOption.cycleValue
            };
            this.cycleLabel = defaultOption.cycleLabel; // 初始化 Label
            
            this.dialogTitle = '新增矿机';
            this.dialogVisible = true;
            this.$nextTick(() => { this.$refs.machineForm?.clearValidate(); });
        },
        
        // --- 关键修改点 5: 更新 handleEdit ---
        handleEdit(row) {
            this.formModel = { ...row };
            // 根据当前行的数据，初始化正确的 Label
            const selectedOption = this.typeOptions.find(option => option.value === row.type);
            if (selectedOption) {
                this.cycleLabel = selectedOption.cycleLabel;
            } else {
                this.cycleLabel = '周期(天)'; // 如果找不到匹配的类型，提供一个默认值
            }
            
            this.dialogTitle = '编辑矿机';
            this.dialogVisible = true;
            this.$nextTick(() => { this.$refs.machineForm?.clearValidate(); });
        },
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

        handleCreate() {
            const seed = Date.now().toString() + Math.random().toString();
            this.formModel = {
                uuid: md5('uuid-' + seed),
                keyField: md5('key-' + seed),
                purchaseLimit: '0',
                // --- 关键修改点 3: (可选) 设置默认类型 ---
                type: '每天' 
            };
            this.dialogTitle = '新增矿机';
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.$refs.machineForm?.clearValidate();
            });
        },
        
        // handleEdit, handleDelete, cancelForm, submitForm 方法保持不变
        // handleEdit(row) {
        //     this.formModel = { ...row };
        //     this.dialogTitle = '编辑矿机';
        //     this.dialogVisible = true;
        //     this.$nextTick(() => {
        //         this.$refs.machineForm?.clearValidate();
        //     });
        // },

        async handleDelete(row) {
            try {
                await ElMessageBox.confirm(
                    `确定要删除矿机 "${row.name}" (ID: ${row.id}) 吗？`,
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

        cancelForm() {
            this.dialogVisible = false;
        },

        submitForm() {
            this.$refs.machineForm.validate(async (valid) => {
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
    },
};
</script>

<style>
.toolbar {
    display: flex;
    justify-content: flex-start;
}
</style>