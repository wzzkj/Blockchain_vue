<template>
    <div>
        <!-- 操作栏 -->
        <div class="toolbar" style="margin-bottom: 18px;">
            <el-button type="primary" @click="handleCreate">新增奖励规则</el-button>
        </div>

        <!-- 表格主体 -->
        <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
            <!-- 遍历 tableColumns 来动态生成列 -->
            <el-table-column
                v-for="column in tableColumns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                :formatter="column.formatter"
                show-overflow-tooltip
                min-width="120"
            />
            <el-table-column label="操作" fixed="right" width="180">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新增/编辑 对话框 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" top="5vh" @close="resetForm">
            <el-form ref="rewardFormRef" :model="formModel" :rules="formRules" label-width="120px">
                <!-- 遍历 formFields 来动态生成表单项 -->
                <template v-for="field in formFields" :key="field.prop">
                    <!-- 特殊处理：状态 (下拉选择) -->
                    <el-form-item v-if="field.prop === 'status'" :label="field.label" :prop="field.prop">
                        <el-select
                            v-model="formModel.status"
                            placeholder="请选择状态"
                            style="width: 100%;"
                        >
                            <el-option
                                v-for="option in statusOptions"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                            />
                        </el-select>
                    </el-form-item>

                    <!-- 特殊处理：天数和奖励数量 (数字输入) -->
                    <el-form-item v-else-if="field.prop === 'continuousDays' || field.prop === 'rewardAmount'" :label="field.label" :prop="field.prop">
                        <el-input-number
                            v-model="formModel[field.prop]"
                            :min="0"
                            controls-position="right"
                            :placeholder="'请输入' + field.label"
                            style="width: 100%;"
                        />
                    </el-form-item>
                    
                    <!-- 特殊处理：备注 (文本域) -->
                    <el-form-item v-else-if="field.prop === 'remark'" :label="field.label" :prop="field.prop">
                        <el-input
                            type="textarea"
                            :rows="3"
                            v-model="formModel.remark"
                            :placeholder="'请输入' + field.label"
                        />
                    </el-form-item>

                    <!-- 其他所有字段的通用渲染 -->
                    <el-form-item v-else :label="field.label" :prop="field.prop">
                        <el-input
                            v-model="formModel[field.prop]"
                            :placeholder="'请输入' + field.label"
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
// ========================= 1. 引入签到奖励的专用API接口 =========================
import {
    addReward,
    deleteReward,
    getAllRewards,
    editReward,
} from '../api/signInReward'; // 假设你的API文件名为 signInReward.js
import { ElMessage, ElMessageBox } from 'element-plus';

// 定义表单中不需要展示的字段
const EXCLUDED_FORM_FIELDS = ['id', 'createTime', 'updateTime'];

export default {
    name: 'signIn_reward',
    data() {
        return {
            loading: false,
            tableData: [],
            // 定义签到奖励的表格列
            tableColumns: [
                { prop: 'id', label: 'ID' },
                { prop: 'activityName', label: '活动/规则名称' },
                { prop: 'continuousDays', label: '连续签到天数' },
                { prop: 'rewardAmount', label: '奖励数量(styai)' },
                { prop: 'status', label: '状态', formatter: this.statusFormatter },
                { prop: 'remark', label: '备注' },
            ],
            // 定义状态下拉选项
            statusOptions: [
                { label: '启用', value: 1 },
                { label: '停用', value: 0 }
            ],
            dialogVisible: false,
            dialogTitle: '',
            formModel: {}, // 表单数据模型
            // 定义表单验证规则
            formRules: {
                activityName: [{ required: true, message: '活动/规则名称不能为空', trigger: 'blur' }],
                continuousDays: [{ required: true, message: '连续签到天数不能为空', trigger: 'blur' }],
                rewardAmount: [{ required: true, message: '奖励数量不能为空', trigger: 'blur' }],
                status: [{ required: true, message: '请选择状态', trigger: 'change' }],
            }
        };
    },
    computed: {
        // 动态计算表单需要渲染的字段 (复用示例中的逻辑)
        formFields() {
            return this.tableColumns.filter(col => !EXCLUDED_FORM_FIELDS.includes(col.prop));
        }
    },
    methods: {
        // 状态格式化，用于在表格中显示中文
        statusFormatter(row, column, cellValue) {
            const option = this.statusOptions.find(opt => opt.value === cellValue);
            return option ? option.label : '未知';
        },

        // ======================= 2. 使用 getAllRewards 加载数据 =======================
        async loadTables() {
            this.loading = true;
            try {
                const response = await getAllRewards();
                if (response && response.data) {
                    this.tableData = Array.isArray(response.data) ? response.data : [];
                } else {
                    this.tableData = [];
                    ElMessage.error(response.message || '数据格式不正确');
                }
            } catch (e) {
                this.tableData = [];
                ElMessage.error(e.message || '数据加载失败');
            } finally {
                this.loading = false;
            }
        },
        
        // 准备新增表单数据
        handleCreate() {
            this.formModel = {
                activityName: '',
                continuousDays: 10, // 给一个默认值
                rewardAmount: 0,
                status: 1, // 默认启用
                remark: '',
            };
            this.dialogTitle = '新增签到奖励规则';
            this.dialogVisible = true;
        },

        // 填充编辑表单数据
        handleEdit(row) {
            // 使用深拷贝 {...row} 避免直接修改表格中的数据
            this.formModel = { ...row };
            this.dialogTitle = '编辑签到奖励规则';
            this.dialogVisible = true;
        },

        // ======================= 3. 使用 deleteReward 删除数据 =======================
        async handleDelete(row) {
            try {
                await ElMessageBox.confirm(`确定删除规则 "${row.activityName}" 吗？`, '警告', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                
                const result = await deleteReward(row.id);
                if (result && (result.code === 1 || result.code === 200)) { // 兼容不同的成功码
                    ElMessage.success('删除成功！');
                    this.loadTables(); // 重新加载数据
                } else {
                    ElMessage.error(result.message || '删除失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    const errorMessage = typeof error === 'object' && error.message ? error.message : '删除操作已取消或发生错误';
                    ElMessage.info(errorMessage);
                }
            }
        },

        cancelForm() {
            this.dialogVisible = false;
        },

        resetForm() {
            // 使用 optional chaining (?.) 避免在dialog关闭时 ref 还未挂载导致的错误
            this.$refs.rewardFormRef?.resetFields();
        },

        // ======================= 4. 使用 addReward/editReward 提交表单 =======================
        submitForm() {
            this.$refs.rewardFormRef.validate(async (valid) => {
                if (valid) {
                    const payload = { ...this.formModel };
                    try {
                        let result;
                        let actionText = '';
                        
                        if (payload.id) { // 有ID则为更新 (编辑)
                            actionText = '更新';
                            result = await editReward(payload);
                        } else { // 无ID则为新增
                            actionText = '新增';
                            result = await addReward(payload);
                        }

                        if (result && (result.code === 1 || result.code === 200)) {
                            ElMessage.success(`${actionText}成功！`);
                            this.dialogVisible = false;
                            this.loadTables();
                        } else {
                            ElMessage.error(result.message || `${actionText}失败`);
                        }
                    } catch (e) {
                         ElMessage.error(e.message || '操作失败');
                    }
                }
            });
        }
    },
    mounted() {
        this.loadTables(); // 组件挂载后立即加载数据
    },
};
</script>

<style scoped>
/* 使用 scoped 确保样式只作用于当前组件 */
.toolbar {
    display: flex;
    justify-content: flex-start;
}
.dialog-footer {
    text-align: right;
}
</style>