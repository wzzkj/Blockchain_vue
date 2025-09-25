<template>
    <div>
        <!-- 搜索/过滤栏 -->
        <div class="toolbar" style="margin-bottom: 18px;">
            <!-- 给 el-form 添加一个自定义类名，如 'search-form' -->
            <el-form ref="searchFormRef" :model="searchForm" :inline="true" class="search-form">
                <el-form-item label="用户ID" prop="userId">
                    <el-input v-model="searchForm.userId" placeholder="请输入用户ID" clearable />
                </el-form-item>
                <el-form-item label="钱包地址" prop="userWalletAddress">
                    <el-input v-model="searchForm.userWalletAddress" placeholder="请输入钱包地址" clearable />
                </el-form-item>
                <!-- <el-form-item label="交易单号" prop="transactionOrderId">
                    <el-input v-model="searchForm.transactionOrderId" placeholder="请输入系统交易单号" clearable />
                </el-form-item> -->
                <!-- 交易类型 -->
                <el-form-item label="交易类型" prop="transactionType">
                    <el-select v-model="searchForm.transactionType" placeholder="请选择交易类型" clearable style="width: 100px">
                        <!-- 
                            修改点：使用 v-for 循环 transactionTypeOptions 数组
                        -->
                        <el-option
                            v-for="item in transactionTypeOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>

                <!-- 资金类型 -->
                <el-form-item label="资金类型" prop="fundType">
                    <el-select v-model="searchForm.fundType" placeholder="请选择资金类型" clearable style="width: 100px">
                        <!-- 
                            修改点：使用 v-for 循环 fundTypeOptions 数组
                        -->
                        <el-option
                            v-for="item in fundTypeOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>
                 <el-form-item label="交易时间" prop="timeRange">
                    <el-date-picker
                        v-model="searchForm.timeRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        value-format="YYYY-MM-DD HH:mm:ss"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                    <el-button @click="resetSearch">重置</el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 表格主体 -->
        <el-table :data="tableData" border style="width: 100%" v-loading="loading">
            <!-- 动态渲染数据列 -->
            <el-table-column 
                v-for="column in tableColumns" 
                :key="column.prop" 
                :prop="column.prop" 
                :label="column.label"
                show-overflow-tooltip 
                min-width="180">
            </el-table-column>
        </el-table>

    </div>
</template>

<script>
// 1. 引入平台资金流水相关API
import { searchUserPlatformFlow } from '../api/userPlatformFlow'; // 假设你的api文件叫这个
// 2. 引入 Element Plus 的消息组件
import { ElMessage } from 'element-plus';

// 定义列名与中文标签的映射
const COLUMN_LABEL_MAP = {
    id: '流水ID',
    userId: '用户ID',
    userWalletAddress: '用户钱包地址',
    transactionOrderId: '系统交易单号',
    txId: '区块链交易ID(TxHash)',
    transactionType: '交易类型',
    amount: '交易金额',
    remark: '交易备注',
    fundType: '资金类型',
    balanceBefore: '交易前余额',
    balanceAfter: '交易后余额',
    transactionTime: '交易时间'
};

export default {
    name: 'UserPlatformFlow',
    data() {
        return {
            loading: false,
            tableData: [],
            tableColumns: [],
            // 搜索表单的数据模型
            searchForm: {
                userId: '',
                userWalletAddress: '',
                transactionOrderId: '',
                transactionType: '',
                fundType: '',
                timeRange: [], // 用于 el-date-picker
                startTime: '',
                endTime: ''
            },
            // --- 新增：为下拉框定义选项数据 ---
            transactionTypeOptions: [
                { value: 'DEPOSIT', label: '充值' },
                { value: 'WITHDRAWAL', label: '提现' },
                { value: 'PURCHASE', label: '购买' },
                { value: 'EXCHANGE', label: '闪兑' }
            ],
            fundTypeOptions: [
                { value: 'INCOME', label: '入账' },
                { value: 'EXPENSE', label: '出账' }
            ]
        };
    },
    methods: {
        // 加载/查询 流水数据
        async loadData() {
            this.loading = true;
            try {
                // 处理时间范围
                if (this.searchForm.timeRange && this.searchForm.timeRange.length === 2) {
                    this.searchForm.startTime = this.searchForm.timeRange[0];
                    this.searchForm.endTime = this.searchForm.timeRange[1];
                } else {
                    this.searchForm.startTime = '';
                    this.searchForm.endTime = '';
                }
                
                // 剔除不需要传给后端的 timeRange 字段
                const { timeRange, ...queryDTO } = this.searchForm;

                const response = await searchUserPlatformFlow(queryDTO);

                // 假设后端返回的数据在 response.data 中
                const list = response.data;

                if (Array.isArray(list) && list.length > 0) {
                    this.tableData = list;
                    // 如果是首次加载，则动态生成列定义
                    if (this.tableColumns.length === 0) {
                        const keys = Object.keys(list[0]);
                        this.tableColumns = keys.map(key => ({
                            prop: key,
                            label: COLUMN_LABEL_MAP[key] || key // 使用映射，找不到则用原名
                        }));
                    }
                } else {
                    this.tableData = [];
                    // 如果没有数据，但列还未生成，可以提示用户
                    if(this.tableColumns.length === 0) {
                        ElMessage.warning('暂无数据，无法生成表头');
                    }
                }
            } catch (e) {
                ElMessage.error(e.message || '数据加载失败');
            } finally {
                this.loading = false;
            }
        },

        // 执行搜索
        handleSearch() {
            this.loadData();
        },

        // 重置搜索条件
        resetSearch() {
            // 使用 el-form 的 resetFields 方法可以清空表单并移除校验状态
            this.$refs.searchFormRef.resetFields();
            // 重置时间范围后，需要手动清理 startTime 和 endTime
            this.searchForm.startTime = '';
            this.searchForm.endTime = '';
            // 重新加载数据
            this.loadData();
        }
    },
    // 组件挂载后立即加载初始数据
    mounted() {
        this.loadData();
    },
};
</script>

<style scoped>
.toolbar {
    background-color: #f5f7fa;
    padding: 15px 10px;
    border-radius: 4px;
    margin-bottom: 20px;
}

/* 核心修改：使用 Flex 布局控制表单 */
.search-form {
    display: flex;
    flex-wrap: wrap; /* 允许换行 */
    align-items: center; /* 垂直居中对齐，更好看 */
    gap: 12px; /* 统一设置元素之间的水平和垂直间距 */
}

/* 覆盖 Element Plus inline form 默认的 margin，因为我们用了 gap 来控制间距 */
.search-form .el-form-item {
    margin-right: 0 !important;
    margin-bottom: 0 !important;
}
</style>