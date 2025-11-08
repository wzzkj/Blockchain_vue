<template>
    <div>
        <!-- 操作栏：放置新增按钮 -->
        <!-- <div class="toolbar" style="margin-bottom: 18px;"> -->
            <!-- <el-button type="primary" @click="handleCreate">新增用户</el-button> -->
        <!-- </div> -->
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
                show-overflow-tooltip >
            </el-table-column>
            <!-- 固定在右侧的操作列 -->
            <el-table-column label="操作" fixed="right" width="220">
                <template #default="{ row }">
                    <!-- 系统调账按钮 -->
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
                        :placeholder="field.prop === 'twoPassword' ? '留空表示不修改' : '请输入' + field.label"
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

        <!-- 系统调账（充值/扣款）对话框 -->
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
import {
    getUserStatsByAdmin,
    listUsersByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
    addUserByAdmin,
    updateUserPasswordByAdmin // [新增] 导入更新密码的接口
} from '../api/user';
import { 
    listWallets, 
    addWallet, 
    updateWallet
} from '../api/wallet';
import { systemDeposit, systemDeduct, getUserBalance } from '../api/userPlatformFlow';

import { ElMessage, ElMessageBox } from 'element-plus';
import md5 from 'js-md5';

const COLUMN_LABEL_MAP = {
    id: 'ID',
    uid: '用户UID',
    balance: '余额',
    userWalletAddress: '钱包地址',
    invitationCodeId: '邀请码',
    upInvitationCode: '上级邀请码',
    resignCount: '补签次数',
    registrationTime: '注册时间',
    updateTime: '更新时间'
};

export default {
    name: 'user',
    data() {
        return {
            loading: false,
            tableData: [],
            tableColumns: [], 
            initialColumnsSet: false,
            
            dialogVisible: false,
            dialogTitle: '',
            formModel: {},
            originalWalletAddress: '', 
            formRules: {
                uid: [{ required: true, message: '用户UID不能为空', trigger: 'blur' }],
                userWalletAddress: [{ required: true, message: '钱包地址不能为空', trigger: 'blur' }],
                // [修改] 新增时密码必填，编辑时非必填
                twoPassword: [{ required: false, message: '二级密码不能为空', trigger: 'blur' }],
            },
            walletMapById: new Map(),
            walletMapByAddress: new Map(),

            adjustmentDialog: {
                visible: false,
                title: '',
                type: 'deposit',
                targetUserUid: '',
                formModel: { userId: null, amount: undefined, remark: '' },
                formRules: {
                    amount: [{ required: true, message: '金额不能为空', trigger: 'blur' }, { type: 'number', min: 0.01, message: '金额必须是大于0的数字', trigger: 'blur' }],
                    remark: [{ required: true, message: '操作备注不能为空', trigger: 'blur' }]
                }
            }
        };
    },
    computed: {
        formFields() {
            return [
                // { prop: 'uid', label: '用户UID' },
                { prop: 'userWalletAddress', label: '钱包地址' },
                // { prop: 'balance', label: '余额' },
                { prop: 'invitationCodeId', label: '邀请码' },
                { prop: 'upInvitationCode', label: '上级邀请码' },
                { prop: 'resignCount', label: '补签次数' },
                { prop: 'twoPassword', label: '二级密码' },
            ];
        }
    },
    methods: {
        async fetchAllData() {
            this.loading = true;
            try {
                const [userRes, walletRes] = await Promise.all([
                    listUsersByAdmin(1, 99999),
                    listWallets({ current: 1, size: -1 })
                ]);

                const users = userRes.data?.records || [];
                const wallets = walletRes.data?.records || [];

                this.walletMapById.clear();
                this.walletMapByAddress.clear();
                wallets.forEach(wallet => {
                    this.walletMapById.set(wallet.id, wallet);
                    this.walletMapByAddress.set(wallet.userWalletAddress, wallet);
                });

                if (users.length === 0) {
                    this.tableData = [];
                    this.loading = false;
                    return;
                }
                
                const additionalDataPromises = users.map(user =>
                    Promise.all([
                        getUserBalance(user.id),
                        getUserStatsByAdmin(user.id)
                    ])
                );
                const additionalDataResults = await Promise.all(additionalDataPromises);
                
                const allStatKeys = new Set();

                const usersWithFullData = users.map((user, index) => {
                    const [balanceResult, statsResult] = additionalDataResults[index];
                    const walletInfo = this.walletMapById.get(user.walletAddressId);
                    const statsData = statsResult.data || {};

                    Object.keys(statsData).forEach(key => allStatKeys.add(key));

                    return {
                        ...user,
                        userWalletAddress: walletInfo ? walletInfo.userWalletAddress : `(ID: ${user.walletAddressId} - 未找到)`,
                        balance: balanceResult.data,
                        ...statsData
                    };
                });
                
                this.tableData = usersWithFullData;

                if (!this.initialColumnsSet && usersWithFullData.length > 0) {
                    const baseColumns = [
                        'id', 'balance', 'userWalletAddress', 'invitationCodeId', 
                        'upInvitationCode', 'resignCount', 'registrationTime'
                    ].map(key => ({
                        prop: key,
                        label: COLUMN_LABEL_MAP[key] || key
                    }));

                    const statColumns = Array.from(allStatKeys).map(key => ({
                        prop: key,
                        label: key 
                    }));

                    this.tableColumns = [...baseColumns, ...statColumns];
                    this.initialColumnsSet = true;
                }

            } catch (e) {
                ElMessage.error(e.message || '数据加载失败');
            } finally {
                this.loading = false;
            }
        },

        handleCreate() {
            const uniqueSeed = Date.now().toString() + Math.random().toString();
            const generatedUid = md5(uniqueSeed);
            this.formModel = { 
                uid: generatedUid,
                userWalletAddress: '',
                balance: 0,
                invitationCodeId: '',
                upInvitationCode: '',
                resignCount: 0,
                twoPassword: ''
            };
            this.originalWalletAddress = ''; 
            this.dialogTitle = '新增用户';
            this.dialogVisible = true;
        },

        handleEdit(row) {
            this.formModel = { ...row };
            this.formModel.twoPassword = ''; // 编辑时清空密码框，留空代表不修改
            this.originalWalletAddress = row.userWalletAddress || '';
            this.dialogTitle = '编辑用户';
            this.dialogVisible = true;
        },
        
        // [修改] 重构 submitForm 方法以支持独立的密码更新
        async submitForm() {
            const isEditMode = !!this.formModel.id;

            // [修改] 动态设置密码验证规则
            // 新增用户时，二级密码为必填项
            // 编辑用户时，二级密码为选填项（留空表示不修改）
            this.formRules.twoPassword[0].required = !isEditMode;
            
            const valid = await this.$refs.userForm.validate();
            if (!valid) return;

            try {
                const userPayload = { ...this.formModel };
                const newAddress = userPayload.userWalletAddress?.trim();
                let newHashedPassword = null;

                // [新增] 单独处理二级密码
                if (userPayload.twoPassword) {
                    newHashedPassword = userPayload.twoPassword;
                }
                // [修改] 从主提交对象中删除密码字段，因为它由专门的接口处理
                delete userPayload.twoPassword;


                // --- 钱包地址处理逻辑 (保持不变) ---
                if (isEditMode) {
                    const addressChanged = newAddress !== this.originalWalletAddress;
                    if (addressChanged) {
                        const existingWallet = this.walletMapByAddress.get(newAddress);
                        if (existingWallet) {
                           ElMessage.error('该钱包地址已被其他用户占用！');
                           return;
                        }
                        ElMessage.info('正在更新钱包地址...');
                        const currentWallet = this.walletMapById.get(userPayload.walletAddressId);
                        if (currentWallet) {
                            await updateWallet({ id: currentWallet.id, userWalletAddress: newAddress });
                            ElMessage.success('钱包地址更新成功！');
                        } else {
                            ElMessage.error('未找到关联钱包，无法更新地址。');
                            return;
                        }
                    }
                } else {
                    const existingWallet = this.walletMapByAddress.get(newAddress);
                    if (existingWallet) {
                        ElMessage.error('该钱包地址已存在！');
                        return;
                    }
                    ElMessage.info('正在创建新钱包...');
                    const newWalletData = {
                        uuid: md5(Date.now().toString() + Math.random()),
                        keyField: Math.random().toString(36).substring(2, 12),
                        userWalletAddress: newAddress,
                        uid: userPayload.uid
                    };
                    const walletRes = await addWallet(newWalletData);
                    userPayload.walletAddressId = walletRes.data.id;
                    ElMessage.success('新钱包创建成功！');
                }

                // --- 清理 userPayload (保持不变) ---
                delete userPayload.userWalletAddress;
                this.tableColumns.forEach(col => {
                    if (!COLUMN_LABEL_MAP[col.prop]) {
                       delete userPayload[col.prop];
                    }
                });

                // --- 主信息提交 ---
                if (isEditMode) {
                    await updateUserByAdmin(userPayload);
                    ElMessage.success('用户信息更新成功！');

                    // [新增] 如果用户信息更新成功，并且有新密码，则调用密码更新接口
                    if (newHashedPassword) {
                        await updateUserPasswordByAdmin({
                            userId: userPayload.id,
                            twoPassword: newHashedPassword
                        });
                        ElMessage.success('二级密码更新成功！');
                    }
                } else {
                    // 新增用户时，密码已在 payload 中处理
                    userPayload.twoPassword = newHashedPassword; // 把加密后的密码加回去
                    await addUserByAdmin(userPayload);
                    ElMessage.success('新增用户成功！');
                }
                
                this.dialogVisible = false;
                await this.fetchAllData();
            } catch (e) {
                ElMessage.error(e.message || '操作失败');
            }
        },
        
        async handleDelete(row) {
            try {
                await ElMessageBox.confirm(`确定要删除用户 (UID: ${row.uid}) 吗？`, '警告', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                });
                await deleteUserByAdmin(row.id);
                ElMessage.success('删除成功！');
                this.fetchAllData();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '删除失败');
                }
            }
        },

        handleAdjustment(type, row) {
            this.adjustmentDialog.formModel = { userId: row.id, amount: undefined, remark: '' };
            this.adjustmentDialog.type = type;
            this.adjustmentDialog.title = type === 'deposit' ? '系统充值' : '系统扣款';
            this.adjustmentDialog.targetUserUid = row.uid;
            this.adjustmentDialog.visible = true;
            this.$nextTick(() => { this.$refs.adjustmentForm?.clearValidate(); });
        },
        
        cancelAdjustmentForm() {
            this.adjustmentDialog.visible = false;
        },

        async submitAdjustmentForm() {
            try {
                const valid = await this.$refs.adjustmentForm.validate();
                if (!valid) return;
                const actionText = this.adjustmentDialog.type === 'deposit' ? '充值' : '扣款';
                const apiToCall = this.adjustmentDialog.type === 'deposit' ? systemDeposit : systemDeduct;
                await apiToCall(this.adjustmentDialog.formModel);
                ElMessage.success(`${actionText}操作成功！`);
                this.cancelAdjustmentForm();
                await this.fetchAllData();
            } catch (e) {
                ElMessage.error(e.message || '操作失败');
            }
        },

        cancelForm() {
            this.dialogVisible = false;
        },
        
        resetForm() {
             this.$nextTick(() => { this.$refs.userForm?.clearValidate(); });
        },
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