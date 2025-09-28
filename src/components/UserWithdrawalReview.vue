<template>
    <!-- 模板部分 (Template) 无需任何修改 -->
    <div>
        <!-- 搜索/过滤栏 -->
        <div class="toolbar">
            <el-form ref="searchFormRef" :model="searchForm" :inline="true" class="search-form">
                <el-form-item label="审批状态" prop="status">
                    <el-select v-model="searchForm.status" placeholder="请选择审批状态" clearable style="width: 150px">
                        <el-option
                            v-for="item in statusOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
                    <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
                </el-form-item>
                
                <el-divider direction="vertical" />
                <el-form-item label="自动刷新">
                    <el-switch v-model="autoRefreshEnabled" @change="handleAutoRefreshChange" />
                </el-form-item>
                <el-form-item label="间隔(秒)" v-if="autoRefreshEnabled">
                    <el-input-number v-model="refreshInterval" :min="1" :max="120" controls-position="right" style="width: 100px;" @change="handleAutoRefreshChange" />
                </el-form-item>
            </el-form>
        </div>

        <!-- 表格主体 -->
        <el-table :data="tableData" border style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="orderId" label="提现订单ID" min-width="180" show-overflow-tooltip />
            <el-table-column prop="userId" label="用户ID" min-width="120" />
            <el-table-column prop="withdrawalAmount" label="提现金额" min-width="120">
                <template #default="{ row }">
                    <span style="color: #E6A23C; font-weight: bold;">{{ row.withdrawalAmount }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="status" label="审核状态" min-width="120">
                <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)">
                        {{ formatStatus(row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="userWalletAddress" label="用户钱包地址" min-width="200" show-overflow-tooltip />
            <el-table-column prop="requestTime" label="提现时间" min-width="180" />
            <el-table-column prop="reviewTime" label="审核时间" min-width="180" />
            
            <el-table-column label="操作" fixed="right" width="280">
                <template #default="{ row }">
                    <template v-if="row.status === 0">
                        <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
                        <el-button type="warning" size="small" @click="handleReject(row)">驳回</el-button>
                    </template>
                    <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                    <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        
        <!-- 分页组件 -->
        <div class="pagination-container">
             <el-pagination
                v-model:current-page="pagination.currentPage"
                v-model:page-size="pagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="pagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
            />
        </div>

        <!-- 编辑弹窗 -->
        <el-dialog v-model="editDialogVisible" title="编辑提现信息" width="500px">
            <!-- 建议使用 ref 绑定表单，方便进行校验 -->
            <el-form :model="editForm" ref="editFormRef" label-width="100px">
                <!-- 仅展示可编辑字段，并添加校验规则 -->
                <el-form-item label="提现金额" prop="withdrawalAmount" :rules="{ required: true, message: '金额不能为空' }">
                    <el-input-number v-model="editForm.withdrawalAmount" :precision="2" :step="10" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="钱包地址" prop="userWalletAddress" :rules="{ required: true, message: '钱包地址不能为空' }">
                    <el-input v-model="editForm.userWalletAddress" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="editDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitEdit">确认</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script>
// 假设你的API文件路径是正确的
import { getReviewList, updateReviewStatus, deleteReview, editReview } from '../api/userWithdrawalReview';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';

export default {
    name: 'UserWithdrawalReview',
    data() {
        return {
            loading: false,
            tableData: [],
            searchForm: {
                status: null, // 使用 null 作为初始值，更符合'clearable'
            },
            pagination: {
                currentPage: 1,
                pageSize: 10,
                total: 0,
            },
            statusOptions: [
                { value: 0, label: '待审核' }, { value: 1, label: '审核通过' }, { value: 2, label: '审核不通过' },
                { value: 3, label: '打款中' }, { value: 4, label: '提现成功' }, { value: 5, label: '提现失败' },
            ],
            editDialogVisible: false,
            editForm: {
                // 初始化 editForm 结构，避免潜在的响应式问题
                id: null,
                withdrawalAmount: 0,
                userWalletAddress: '',
            },
            Search,
            Refresh,
            autoRefreshEnabled: false,
            refreshInterval: 10,
            timer: null,
        };
    },
    methods: {
        resetTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            if (this.autoRefreshEnabled) {
                this.timer = setInterval(() => {
                    console.log(`[${new Date().toLocaleTimeString()}] 自动刷新数据...`);
                    this.loadData(true);
                }, this.refreshInterval * 1000);
            }
        },

        handleAutoRefreshChange() {
            this.resetTimer();
        },

        async loadData(isAutoRefresh = false) {
            if (!isAutoRefresh) this.loading = true;
            
            try {
                const params = {
                    currentPage: this.pagination.currentPage,
                    pageSize: this.pagination.pageSize,
                    // 当 searchForm.status 为 null 或 undefined 时不传递该字段
                    status: this.searchForm.status, 
                };
                const response = await getReviewList(params);
                // 推荐使用 'success' 字段或 code === 0/200 判断
                if (response && response.data) {
                    const pageData = response.data;
                    this.tableData = pageData.records || [];
                    this.pagination.total = pageData.total || 0;
                } else {
                    this.tableData = [];
                    this.pagination.total = 0;
                    if (response.message !== "当前没有待审批的提现数据!") {
                        ElMessage.error(response.message || '数据加载失败');
                    }
                }
            } catch (e) {
                ElMessage.error(e.message || '请求失败，请检查网络');
                if(this.autoRefreshEnabled){
                    this.autoRefreshEnabled = false;
                    this.resetTimer();
                    ElMessage.warning('因请求异常，已停止自动刷新功能。');
                }
            } finally {
                 if (!isAutoRefresh) this.loading = false;
            }
        },

        handleSearch() {
            this.pagination.currentPage = 1;
            this.loadData();
        },

        resetSearch() {
            // 使用 resetFields 需要 el-form-item 上有 prop
            this.$refs.searchFormRef.resetFields();
            this.handleSearch();
        },

        handleSizeChange(newSize) {
            this.pagination.pageSize = newSize;
            this.loadData();
        },

        handleCurrentChange(newPage) {
            this.pagination.currentPage = newPage;
            this.loadData();
        },
        
        formatStatus(status) {
            const item = this.statusOptions.find(opt => opt.value === status);
            return item ? item.label : '未知状态';
        },
        
        getStatusTagType(status) {
            const typeMap = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'primary', 4: 'success', 5: 'danger' };
            return typeMap[status] || 'info';
        },

        async handleApprove(row) {
            try {
                await ElMessageBox.confirm(`确定要通过用户(ID: ${row.userId})的提现申请吗？`, '审核确认', { type: 'warning' });
                // ############# 核心修改点 #############
                // API 需要一个对象 {id, status}
                const response = await updateReviewStatus({ id: row.id, status: 1 });
                if (response) {
                    ElMessage.success('审核通过成功');
                    this.loadData();
                } else {
                    ElMessage.error(response.message || '操作失败');
                }
            } catch (e) {
                if (e !== 'cancel') ElMessage.error(e.message || '请求异常');
            }
        },

        async handleReject(row) {
             try {
                await ElMessageBox.confirm(`确定要驳回用户(ID: ${row.userId})的提现申请吗？`, '审核确认', { type: 'warning' });
                // ############# 核心修改点 #############
                // API 需要一个对象 {id, status}
                const response = await updateReviewStatus({ id: row.id, status: 2 });
                if (response) {
                    ElMessage.success('审核驳回成功');
                    this.loadData();
                } else {
                    ElMessage.error(response.message || '操作失败');
                }
            } catch (e) {
                if (e !== 'cancel') ElMessage.error(e.message || '请求异常');
            }
        },
        
        async handleDelete(row) {
            try {
                await ElMessageBox.confirm(`确定要删除这条ID为 ${row.id} 的记录吗？`, '删除确认', { type: 'error' });
                const response = await deleteReview(row.id);
                if (response) {
                    ElMessage.success('删除成功');
                    // 如果删除的是当前页的最后一条数据，最好返回上一页
                    if (this.tableData.length === 1 && this.pagination.currentPage > 1) {
                        this.pagination.currentPage--;
                    }
                    this.loadData();
                } else {
                    ElMessage.error(response.message || '删除失败');
                }
            } catch (e) {
                if (e !== 'cancel') ElMessage.error(e.message || '请求异常');
            }
        },

        handleEdit(row) {
            // 使用深拷贝，防止编辑弹窗中的修改直接影响表格行数据
            this.editForm = JSON.parse(JSON.stringify(row));
            this.editDialogVisible = true;
        },

        async submitEdit() {
            // 提交前进行表单校验
            this.$refs.editFormRef.validate(async (valid) => {
                if (!valid) return;
                try {
                    // 只提交需要编辑的字段，更符合 DTO 的设计
                    const payload = {
                        id: this.editForm.id,
                        withdrawalAmount: this.editForm.withdrawalAmount,
                        userWalletAddress: this.editForm.userWalletAddress,
                    };
                    const response = await editReview(payload);
                    if (response) {
                        ElMessage.success('编辑成功');
                        this.editDialogVisible = false;
                        this.loadData();
                    } else {
                        ElMessage.error(response.message || '编辑失败');
                    }
                } catch (e) {
                    ElMessage.error(e.message || '请求异常');
                }
            });
        }
    },
    mounted() {
        this.loadData();
    },
    beforeUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    },
};
</script>

<style scoped>
/* 样式 (Style) 无需修改 */
.toolbar { background-color: #f5f7fa; padding: 15px 10px; border-radius: 4px; margin-bottom: 20px; }
.search-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.search-form .el-divider--vertical { height: 2em; }
.search-form .el-form-item { margin-bottom: 0 !important; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>