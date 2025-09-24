<template>
    <div>
        <!-- 操作栏 -->
        <div class="toolbar" style="margin-bottom: 18px;">
            <el-button type="primary" @click="handleCreate">新增矿机</el-button>
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
            <el-form ref="machineFormRef" :model="formModel" :rules="formRules" label-width="140px">
                <!-- 遍历 formFields 来动态生成表单项 -->
                <template v-for="field in formFields" :key="field.prop">
                    <!-- 特殊处理：周期类型 (下拉选择) -->
                    <el-form-item v-if="field.prop === 'cycleType'" :label="field.label" :prop="field.prop">
                        <el-select
                            v-model="formModel.cycleType"
                            placeholder="请选择周期类型"
                            style="width: 100%;"
                            @change="onCycleTypeChange"
                        >
                            <el-option
                                v-for="option in cycleTypeOptions"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                            />
                        </el-select>
                    </el-form-item>

                    <!-- 特殊处理：周期时长 (标签动态变化) -->
                    <el-form-item v-else-if="field.prop === 'cycleDuration'" :label="cycleDurationLabel" :prop="field.prop">
                        <el-input-number
                            v-model="formModel.cycleDuration"
                            :min="1"
                            controls-position="right"
                            placeholder="请输入周期时长"
                            style="width: 100%;"
                        />
                    </el-form-item>

                    <!-- 特殊处理：矿机描述 (文本域) -->
                    <el-form-item v-else-if="field.prop === 'description'" :label="field.label" :prop="field.prop">
                        <el-input
                            type="textarea"
                            :rows="3"
                            v-model="formModel.description"
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
// ========================= 代码重构点 1: 引入新的专用API接口 =========================
import {
    addMiningMachine,
    deleteMiningMachine,
    listAllMiningMachines,
    updateMiningMachine
} from '../api/MiningMachine'; // 假设你的API文件名为 MiningMachine.js
import { ElMessage, ElMessageBox } from 'element-plus';
// md5 仍然在 handleCreate 中使用，予以保留
import md5 from 'js-md5';

// 定义表单中不需要展示的字段
const EXCLUDED_FORM_FIELDS = ['id', 'uuid', 'keyField', 'creatTime', 'updateTime'];

export default {
    name: 'mining_machine',
    data() {
        return {
            loading: false,
            // tableName 不再需要，因为API已经是专用的了
            tableData: [],
            tableColumns: [
                { prop: 'id', label: 'ID' },
                { prop: 'name', label: '矿机名称' },
                { prop: 'cycleType', label: '周期类型', formatter: this.cycleTypeFormatter },
                { prop: 'price', label: '单价(USDT)' },
                { prop: 'cycleDuration', label: '周期时长' },
                { prop: 'yieldRate', label: '周期收益率' },
                { prop: 'purchaseLimit', label: '限购数量(0为不限)' },
                { prop: 'description', label: '矿机描述' },
            ],
            cycleTypeOptions: [
                { label: '按天(DAY)', value: 'DAY' },
                { label: '按小时(HOUR)', value: 'HOUR' }
            ],
            cycleDurationLabel: '周期时长(天)',
            dialogVisible: false,
            dialogTitle: '',
            formModel: {},
            formRules: {
                name: [{ required: true, message: '矿机名称不能为空', trigger: 'blur' }],
                price: [{ required: true, message: '单价不能为空', trigger: 'blur' }],
                cycleType: [{ required: true, message: '请选择周期类型', trigger: 'change' }],
                cycleDuration: [{ required: true, message: '周期时长不能为空', trigger: 'blur' }],
                yieldRate: [{ required: true, message: '收益率不能为空', trigger: 'blur' }],
                purchaseLimit: [{ required: true, message: '限购数量不能为空', trigger: 'blur' }],
            }
        };
    },
    computed: {
        formFields() {
            return this.tableColumns.filter(col => !EXCLUDED_FORM_FIELDS.includes(col.prop));
        }
    },
    methods: {
        onCycleTypeChange(newType) {
            this.cycleDurationLabel = newType === 'DAY' ? '周期时长(天)' : '周期时长(小时)';
        },

        cycleTypeFormatter(row, column, cellValue) {
            const option = this.cycleTypeOptions.find(opt => opt.value === cellValue);
            return option ? option.label : cellValue;
        },

        // ======================= 代码重构点 2: 使用 listAllMiningMachines 加载数据 =======================
        async loadTables() {
            this.loading = true;
            try {
                // 调用新的API获取所有矿机列表
                const response = await listAllMiningMachines();
                // 后端返回的是 Result 对象，真实数据在 data 字段中
                if (response && response.data) {
                    this.tableData = Array.isArray(response.data) ? response.data : [];
                } else {
                    this.tableData = [];
                    ElMessage.error(response.msg || '数据格式不正确');
                }
            } catch (e) {
                this.tableData = [];
                ElMessage.error(e.message || '数据加载失败');
            } finally {
                this.loading = false;
            }
        },
        
        // handleCreate 方法逻辑不变，用于准备表单数据
        handleCreate() {
            const seed = Date.now().toString() + Math.random().toString();
            this.formModel = {
                uuid: md5('uuid-' + seed),
                keyField: md5('key-' + seed),
                name: '',
                price: null,
                cycleType: 'DAY',
                cycleDuration: 30,
                yieldRate: 0.01,
                purchaseLimit: 0,
                description: '',
            };
            this.onCycleTypeChange('DAY');
            this.dialogTitle = '新增矿机';
            this.dialogVisible = true;
        },

        // handleEdit 方法逻辑不变，用于填充表单数据
        handleEdit(row) {
            this.formModel = { ...row };
            this.onCycleTypeChange(row.cycleType);
            this.dialogTitle = '编辑矿机';
            this.dialogVisible = true;
        },

        // ======================= 代码重构点 3: 使用 deleteMiningMachine 删除数据 =======================
        async handleDelete(row) {
            try {
                await ElMessageBox.confirm(`确定删除矿机 "${row.name}" 吗？`, '警告', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                // 调用新的API删除指定ID的矿机
                const result = await deleteMiningMachine(row.id);
                // 后端返回 Result2 类型的字符串，但http库通常会解析成对象
                // 我们需要判断操作是否成功
                if (result && (result.code === 200 || result.success)) {
                    ElMessage.success('删除成功！');
                    this.loadTables(); // 重新加载数据
                } else {
                    ElMessage.error(result.msg || '删除失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    // 如果 error 是对象，尝试显示 message
                    const errorMessage = typeof error === 'object' && error.message ? error.message : '删除操作已取消或发生错误';
                    ElMessage.info(errorMessage);
                }
            }
        },

        cancelForm() {
            this.dialogVisible = false;
        },

        resetForm() {
            this.$refs.machineFormRef?.resetFields();
        },

        // ======================= 代码重构点 4: 使用 add/updateMiningMachine 提交表单 =======================
        submitForm() {
            this.$refs.machineFormRef.validate(async (valid) => {
                if (valid) {
                    const payload = { ...this.formModel };
                    try {
                        let result;
                        let actionText = '';
                        
                        if (payload.id) { // 有ID则为更新
                            actionText = '更新';
                            result = await updateMiningMachine(payload);
                        } else { // 无ID则为新增
                            actionText = '新增';
                            result = await addMiningMachine(payload);
                        }

                        if (result && (result.code === 200 || result.success)) {
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
    },
};
</script>

<style>
.toolbar {
    display: flex;
    justify-content: flex-start;
}
</style>