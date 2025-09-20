<template>
    <div>
        <!-- 操作栏：放置新增按钮 -->
        <!-- <div class="toolbar" style="margin-bottom: 18px;">
            <el-button type="primary" @click="handleCreate">新增用户</el-button>
        </div> -->

        <!-- 表格主体 -->
        <el-table :data="tableData" border style="width: 100%" v-loading="loading">
            <!-- 动态渲染数据列 -->
            <el-table-column v-for="column in tableColumns" :key="column.prop" :prop="column.prop" :label="column.label"
                show-overflow-tooltip min-width="150">
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
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
            <el-form ref="userForm" :model="formModel" :rules="formRules" label-width="120px">
                <el-form-item v-for="field in formFields" :key="field.prop" :label="field.label" :prop="field.prop">
                    <!-- 
            在这里进行修改：
            当字段的 prop 是 'uid' 时，禁用这个输入框。
        -->
                    <el-input v-model="formModel[field.prop]" :placeholder="'请输入' + field.label"
                        :disabled="field.prop === 'uid'">
                    </el-input>
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
// 1. 引入所有需要的API
import { getRows, createRow, updateRow, deleteRow } from '../api/dynamicTable';
// 2. 引入 Element Plus 的消息和确认框组件
import { ElMessage, ElMessageBox } from 'element-plus';
// 3. 引入新安装的 js-md5 库
import md5 from 'js-md5';

// ... (COLUMN_LABEL_MAP 和 EXCLUDED_FORM_FIELDS 常量保持不变)
const COLUMN_LABEL_MAP = {
    id: 'ID',
    walletAddressId: '钱包地址ID',
    uid: '用户UID',
    balance: '余额',
    invitationCodeId: '邀请码',
    upInvitationCode: '上级邀请码',
    twoPassword: '二级密码',
    registrationTime: '注册时间',
    updateTime: '更新时间',
    resignCount: '补签次数'
};
const EXCLUDED_FORM_FIELDS = ['id', 'registrationTime', 'updateTime'];


export default {
    name: 'user',
    data() {
        return {
            loading: false,
            tableData: [],
            tableColumns: [],
            tableName: 'b_user',
            dialogVisible: false,
            dialogTitle: '',
            formModel: {},
            formRules: {
                uid: [{ required: true, message: '用户UID不能为空', trigger: 'blur' }],
                // 对于“编辑”操作，二级密码可以不填（代表不修改）
                // 所以，这里的 required 校验可以只在“新增”时生效，或者直接去掉，在逻辑中控制
                // 为简化，我们暂时保留，但在提交逻辑里会更智能地处理
                twoPassword: [{ required: true, message: '二级密码不能为空', trigger: 'blur' }],
            }
        };
    },
    computed: {
        formFields() {
            return this.tableColumns.filter(col => !EXCLUDED_FORM_FIELDS.includes(col.prop));
        }
    },
    methods: {
        async loadTables() {
            // ... (此方法保持不变)
            this.loading = true;
            try {
                const list = await getRows(this.tableName);
                if (Array.isArray(list) && list.length > 0) {
                    this.tableData = list;
                    if (this.tableColumns.length === 0) {
                        const keys = Object.keys(list[0]);
                        this.tableColumns = keys.map(key => ({
                            prop: key,
                            label: COLUMN_LABEL_MAP[key] || key
                        }));
                    }
                } else {
                    this.tableData = [];
                }
            } catch (e) {
                ElMessage.error(e.message || '数据加载失败');
            } finally {
                this.loading = false;
            }
        },

        handleCreate() {
            // ... (此方法保持不变)
            this.formModel = {};
            this.dialogTitle = '新增用户';
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.$refs.userForm.clearValidate();
            });
        },

        // --- 改 (Update) ---
        handleEdit(row) {
            this.formModel = { ...row };
            // --- 关键修改点 1 ---
            // 清空二级密码字段，避免显示旧的哈希值。
            // 用户只有在输入新值时，才代表要修改密码。
            this.formModel.twoPassword = '';

            this.dialogTitle = '编辑用户';
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.$refs.userForm.clearValidate();
            });
        },

        async handleDelete(row) {
            // ... (此方法保持不变)
            try {
                await ElMessageBox.confirm(
                    `确定要删除用户 (ID: ${row.id}) 吗？`,
                    '警告',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
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
        handleCreate() {
            // 1. 创建一个足够独特的原始字符串
            const uniqueSeed = Date.now().toString() + Math.random().toString();
            // 2. 使用 md5 生成 uid
            const generatedUid = md5(uniqueSeed);

            // 3. 初始化表单对象，并直接将生成的 uid 赋值
            this.formModel = {
                uid: generatedUid
                // 你也可以在这里为其他字段设置默认值，例如：
                // balance: '0',
                // resignCount: 0
            };

            this.dialogTitle = '新增用户';
            this.dialogVisible = true;

            this.$nextTick(() => {
                // 清除可能存在的历史校验信息
                this.$refs.userForm.clearValidate();
            });
        },

        cancelForm() {
            this.dialogVisible = false;
        },

        submitForm() {
            // 对于编辑模式，密码不是必填项，所以我们调整一下校验逻辑
            const isEditMode = !!this.formModel.id;
            // 动态调整校验规则
            if (isEditMode) {
                // 如果是编辑模式，且密码为空，我们移除对密码的校验
                if (!this.formModel.twoPassword) {
                    this.formRules.twoPassword = [];
                } else {
                    this.formRules.twoPassword = [{ required: true, message: '二级密码不能为空', trigger: 'blur' }];
                }
            } else {
                this.formRules.twoPassword = [{ required: true, message: '二级密码不能为空', trigger: 'blur' }];
            }

            // 手动触发一次校验，确保规则更新生效
            this.$nextTick(() => {
                this.$refs.userForm.validate(async (valid) => {
                    if (valid) {
                        // --- 关键修改点 2 ---
                        // 创建一个请求负载的副本，避免直接修改 formModel
                        const payload = { ...this.formModel };

                        // 检查二级密码字段是否存在且有值
                        // 如果用户没有输入密码（特别是编辑时），则不处理也不发送该字段
                        if (payload.twoPassword) {
                            payload.twoPassword = md5(payload.twoPassword);
                        } else {
                            // 如果密码为空，从 payload 中删除该字段，避免后端将其更新为空值
                            delete payload.twoPassword;
                        }

                        try {
                            if (payload.id) { // 更新操作
                                await updateRow(this.tableName, payload.id, payload);
                                ElMessage.success('更新成功！');
                            } else { // 新增操作
                                await createRow(this.tableName, payload);
                                ElMessage.success('新增成功！');
                            }
                            this.dialogVisible = false;
                            this.loadTables();
                        } catch (e) {
                            ElMessage.error(e.message || '操作失败');
                        }
                    } else {
                        console.log('表单校验失败！');
                        return false;
                    }
                });
            })
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