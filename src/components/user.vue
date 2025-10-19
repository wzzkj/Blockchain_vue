<template>
    <div>
        <!-- 操作栏：放置新增按钮 -->
        <div class="toolbar" style="margin-bottom: 18px;">
            <el-button type="primary" @click="handleCreate">新增用户</el-button>
        </div>
        <el-alert 
            title="谨慎操作用户数据" 
            type="warning"
            description="此页面直接操作数据库。当您在表单中输入一个数据库不存在的新钱包地址时，系统会自动为您创建一个新的钱包记录。" 
            show-icon 
            :closable="false" 
            style="margin-bottom: 20px;"
        />

        <!-- 表格主体 -->
        <el-table :data="tableData" border style="width: 100%" v-loading="loading">
            <!-- 动态渲染数据列 -->
            <el-table-column v-for="column in tableColumns" :key="column.prop" :prop="column.prop" :label="column.label"
                show-overflow-tooltip min-width="150">
                <!-- 自定义钱包地址列的显示 -->
                <template #default="{ row }" v-if="column.prop === 'walletAddressId'">
                    <span>{{ getWalletAddressById(row.walletAddressId) }}</span>
                </template>
            </el-table-column>
            <!-- 固定在右侧的操作列 -->
            <el-table-column label="操作" fixed="right" width="280">
                <template #default="{ row }">
                    <!-- 【新增】系统调账按钮 -->
                    <el-button link type="success" size="small" @click="handleAdjustment('deposit', row)">充值</el-button>
                    <el-button link type="warning" size="small" @click="handleAdjustment('deduct', row)">扣款</el-button>
                    <el-divider direction="vertical" />
                    <!-- 原有按钮 -->
                    <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新增/编辑 对话框 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px" @close="resetForm">
            <el-form ref="userForm" :model="formModel" :rules="formRules" label-width="120px">
                <el-form-item v-for="field in formFields" :key="field.prop" :label="field.label" :prop="field.prop">
                     <!-- 禁用 uid 输入框 -->
                    <el-input 
                        v-model="formModel[field.prop]" 
                        :placeholder="'请输入' + field.label"
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

        <!-- 【新增】系统调账（充值/扣款）对话框 -->
        <el-dialog :title="adjustmentDialog.title" v-model="adjustmentDialog.visible" width="500px">
            <el-form ref="adjustmentForm" :model="adjustmentDialog.formModel" :rules="adjustmentDialog.formRules" label-width="120px">
                <el-form-item label="用户UID">
                    <el-input :value="adjustmentDialog.targetUserUid" disabled />
                </el-form-item>
                <el-form-item label="操作金额" prop="amount">
                    <el-input-number v-model="adjustmentDialog.formModel.amount" :precision="2" :step="10" :min="0.01" controls-position="right" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="操作备注" prop="remark">
                    <el-input v-model="adjustmentDialog.formModel.remark" type="textarea" :rows="3" placeholder="请详细填写操作原因，用于审计" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancelAdjustmentForm">取 消</el-button>
                    <el-button type="primary" @click="submitAdjustmentForm">确 定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
// 引入用户表相关的API
import { getRows, createRow, updateRow, deleteRow } from '../api/dynamicTable';
// 【新增】引入用户资金流水相关的API
import { systemDeposit, systemDeduct ,getUserBalance} from '../api/userPlatformFlow'; // 假设你的API文件名为 userPlatformFlow.js
// 引入 Element Plus 的消息和确认框组件
import { ElMessage, ElMessageBox } from 'element-plus';
// 引入 js-md5 库
import md5 from 'js-md5';

// 字段名到中文标签的映射
const COLUMN_LABEL_MAP = {
    id: 'ID',
    walletAddressId: '钱包地址',
    uid: '用户UID',
    balance: '余额',
    invitationCodeId: '邀请码',
    upInvitationCode: '上级邀请码',
    twoPassword: '二级密码',
    registrationTime: '注册时间',
    updateTime: '更新时间',
    resignCount: '补签次数'
};

// 在表单中不应出现的字段
const EXCLUDED_FORM_FIELDS = ['id', 'registrationTime', 'updateTime', 'walletAddressId'];

export default {
    name: 'user',
    data() {
        return {
            loading: false,
            tableData: [],
            tableColumns: [],
            tableName: 'b_user',
            walletTableName: 'Wallet',
            dialogVisible: false,
            dialogTitle: '',
            formModel: {},
            formRules: {
                uid: [{ required: true, message: '用户UID不能为空', trigger: 'blur' }],
                twoPassword: [{ required: false }],
                walletAddress: [{ required: true, message: '钱包地址不能为空', trigger: 'blur' }],
            },
            walletMapById: new Map(),
            walletMapByAddress: new Map(),

            // --- 【新增】系统调账对话框相关状态 ---
            adjustmentDialog: {
                visible: false,
                title: '',
                type: 'deposit', // 'deposit' or 'deduct'
                targetUserUid: '', // 用于在对话框中显示目标用户
                formModel: {
                    userId: null,
                    amount: undefined,
                    remark: ''
                },
                formRules: {
                    amount: [
                        { required: true, message: '金额不能为空', trigger: 'blur' },
                        { type: 'number', min: 0.01, message: '金额必须是大于0的数字', trigger: 'blur' }
                    ],
                    remark: [
                        { required: true, message: '操作备注不能为空', trigger: 'blur' }
                    ]
                }
            }
        };
    },
    computed: {
        formFields() {
            const fields = this.tableColumns
                .filter(col => !EXCLUDED_FORM_FIELDS.includes(col.prop))
                .map(col => ({ prop: col.prop, label: col.label }));

            const uidIndex = fields.findIndex(f => f.prop === 'uid');
            if (uidIndex !== -1) {
                fields.splice(uidIndex + 1, 0, {
                    prop: 'walletAddress',
                    label: '钱包地址'
                });
            } else {
                fields.push({ prop: 'walletAddress', label: '钱包地址' });
            }
            
            return fields;
        }
    },
    methods: {
        // --- 数据加载与处理 ---
        async fetchAllData() {
            this.loading = true;
            try {
                const [wallets, users] = await Promise.all([
                    getRows(this.walletTableName),
                    getRows(this.tableName)
                ]);

                this.walletMapById.clear();
                this.walletMapByAddress.clear();
                if (Array.isArray(wallets)) {
                    wallets.forEach(wallet => {
                        this.walletMapById.set(wallet.id, wallet.userWalletAddress);
                        this.walletMapByAddress.set(wallet.userWalletAddress, wallet);
                    });
                }
                
                if (Array.isArray(users) && users.length > 0) {
                    const balancePromises = users.map(user => getUserBalance(user.id));
                    // 步骤 3: 并行执行所有余额请求
                    const balanceResults = await Promise.all(balancePromises);
                    const usersWithBalances = users.map((user, index) => {
                        return {
                            ...user,
                            balance: balanceResults[index].data 
                        };
                    });
                    this.tableData = usersWithBalances;
                    if (this.tableColumns.length === 0) {
                        const keys = Object.keys(users[0]);
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

        getWalletAddressById(id) {
            return this.walletMapById.get(id) || `(ID: ${id})`;
        },

        // --- CRUD 操作 ---
        handleCreate() {
            const uniqueSeed = Date.now().toString() + Math.random().toString();
            const generatedUid = md5(uniqueSeed);

            this.formModel = {
                uid: generatedUid,
                walletAddress: ''
            };

            this.dialogTitle = '新增用户';
            this.dialogVisible = true;
        },

        handleEdit(row) {
            this.formModel = { 
                ...row,
                walletAddress: this.getWalletAddressById(row.walletAddressId)
            };
            this.formModel.twoPassword = '';
            
            this.dialogTitle = '编辑用户';
            this.dialogVisible = true;
        },

        async handleDelete(row) {
            try {
                await ElMessageBox.confirm(`确定要删除用户 (UID: ${row.uid}) 吗？`, '警告', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                });
                await deleteRow(this.tableName, row.id);
                ElMessage.success('删除成功！');
                this.fetchAllData();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '删除失败');
                }
            }
        },

        // --- 【新增】系统调账方法 ---
        handleAdjustment(type, row) {
            // 重置表单
            this.adjustmentDialog.formModel = {
                userId: row.id, // API需要的是userId
                amount: undefined,
                remark: ''
            };
            // 设置对话框类型和标题
            this.adjustmentDialog.type = type;
            this.adjustmentDialog.title = type === 'deposit' ? '系统充值' : '系统扣款';
            this.adjustmentDialog.targetUserUid = row.uid;
            // 显示对话框
            this.adjustmentDialog.visible = true;

            this.$nextTick(() => {
                this.$refs.adjustmentForm.clearValidate();
            });
        },
        
        cancelAdjustmentForm() {
            this.adjustmentDialog.visible = false;
        },

        async submitAdjustmentForm() {
            try {
                const valid = await this.$refs.adjustmentForm.validate();
                if (!valid) {
                    return;
                }

                const actionText = this.adjustmentDialog.type === 'deposit' ? '充值' : '扣款';
                const apiToCall = this.adjustmentDialog.type === 'deposit' ? systemDeposit : systemDeduct;

                await apiToCall(this.adjustmentDialog.formModel);
                
                ElMessage.success(`${actionText}操作成功！`);
                this.cancelAdjustmentForm();
                await this.fetchAllData(); // 操作成功后刷新列表数据

            } catch (e) {
                ElMessage.error(e.message || '操作失败');
            }
        },

        // --- 表单相关 ---
        cancelForm() {
            this.dialogVisible = false;
        },
        
        resetForm() {
             this.$nextTick(() => {
                if (this.$refs.userForm) {
                    this.$refs.userForm.clearValidate();
                }
            });
        },

        async submitForm() {
            const isEditMode = !!this.formModel.id;
            this.formRules.twoPassword = (isEditMode && !this.formModel.twoPassword)
                ? [] 
                : [{ required: true, message: '二级密码不能为空', trigger: 'blur' }];

            const valid = await this.$refs.userForm.validate();
            if (!valid) {
                return;
            }

            try {
                const payload = { ...this.formModel };
                const address = payload.walletAddress;
                let walletId = null;

                if (this.walletMapByAddress.has(address)) {
                    walletId = this.walletMapByAddress.get(address).id;
                } else {
                    ElMessage.info('检测到新的钱包地址，正在为您创建...');
                    const newWalletData = {
                        uuid: md5(Date.now().toString()),
                        keyField: Math.random().toString(36).substring(2, 12),
                        userWalletAddress: address,
                        uid: payload.uid
                    };
                    const createdWallet = await createRow(this.walletTableName, newWalletData);
                    walletId = createdWallet.id;
                    ElMessage.success('新钱包创建成功！');
                }
                payload.walletAddressId = walletId;
                delete payload.walletAddress;
                
                if (payload.twoPassword) {
                    payload.twoPassword = md5(payload.twoPassword);
                } else {
                    delete payload.twoPassword;
                }

                if (payload.id) {
                    await updateRow(this.tableName, payload.id, payload);
                    ElMessage.success('更新成功！');
                } else {
                    await createRow(this.tableName, payload);
                    ElMessage.success('新增成功！');
                }
                this.dialogVisible = false;
                await this.fetchAllData();
            } catch (e) {
                ElMessage.error(e.message || '操作失败');
            }
        }
    },
    mounted() {
        this.fetchAllData();
    },
};
</script>

<style>
.toolbar {
    display: flex;
    justify-content: flex-start;
}
</style>