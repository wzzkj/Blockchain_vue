<template>
    <div>
        <!-- 搜索/过滤栏 (无变化) -->
        <div class="toolbar">
            <el-form ref="searchFormRef" :model="searchForm" :inline="true" class="search-form">
                <!-- 订单类型 -->
                <el-form-item label="订单类型" prop="orderType">
                    <el-select v-model="searchForm.orderType" placeholder="请选择订单类型" clearable style="width: 140px">
                        <el-option
                            v-for="item in orderTypeOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>

                <!-- 订单状态 -->
                <el-form-item label="订单状态" prop="orderStatus">
                    <el-select v-model="searchForm.orderStatus" placeholder="请选择订单状态" clearable style="width: 150px">
                        <el-option
                            v-for="item in orderStatusOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>

                 <el-form-item label="创建时间" prop="timeRange">
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
                    <el-button type="primary" @click="handleSearch" :loading="loading">查询</el-button>
                    <el-button @click="resetSearch">重置</el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 表格主体 (无变化) -->
        <el-table :data="tableData" border style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="订单ID" />
            <el-table-column prop="creatorId" label="创建者ID"  />
            <el-table-column prop="takerId" label="交易者ID" />
            <el-table-column prop="orderType" label="订单类型" :formatter="formatOrderType" />
            <el-table-column prop="orderStatus" label="订单状态" :formatter="formatOrderStatus"  />
            <el-table-column prop="exchangeRate" label="汇率(USDT-STYAI)"  />
            <el-table-column prop="styAmount" label="STY数量"  />
            <el-table-column prop="usdtAmount" label="USDT数量"  />
            <el-table-column prop="createTime" label="创建时间"  />
            <el-table-column prop="endTime" label="结束时间"  />
            <el-table-column prop="txId" label="交易Hex"  show-overflow-tooltip />
            <el-table-column label="操作" fixed="right" width="120">
                <template #default="scope">
                    <el-button link type="primary" @click="handleViewDetails(scope.row)">查看详情</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页组件 (无变化) -->
        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
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

        <!-- ==================== 新增: 订单详情对话框 ==================== -->
        <el-dialog
            v-model="detailDialogVisible"
            :title="'订单详情 - ID: ' + (selectedOrder ? selectedOrder.id : '')"
            width="60%"
            @close="selectedOrder = null"
        >
            <div v-if="selectedOrder">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="订单ID">{{ selectedOrder.id }}</el-descriptions-item>
                    <el-descriptions-item label="交易Hex">{{ selectedOrder.txId || 'N/A' }}</el-descriptions-item>
                    
                    <el-descriptions-item label="订单类型">
                        <el-tag :type="selectedOrder.orderType === 1 ? 'success' : 'danger'">
                            {{ formatOrderType(null, null, selectedOrder.orderType) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="订单状态">
                        {{ formatOrderStatus(null, null, selectedOrder.orderStatus) }}
                    </el-descriptions-item>

                    <el-descriptions-item label="创建者ID">{{ selectedOrder.creatorId }}</el-descriptions-item>
                    <el-descriptions-item label="交易者ID">{{ selectedOrder.takerId || '暂无' }}</el-descriptions-item>
                    
                    <el-descriptions-item label="汇率">{{ selectedOrder.exchangeRate }} USDT/STYAI</el-descriptions-item>
                    <el-descriptions-item label="STY数量">{{ selectedOrder.styAmount }}</el-descriptions-item>
                    <el-descriptions-item label="USDT数量">{{ selectedOrder.usdtAmount }}</el-descriptions-item>

                    <el-descriptions-item label="创建时间">{{ selectedOrder.createTime }}</el-descriptions-item>
                    <el-descriptions-item label="结束时间">{{ selectedOrder.endTime || '进行中' }}</el-descriptions-item>
                </el-descriptions>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="detailDialogVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>
        <!-- ==================== 新增结束 ==================== -->

    </div>
</template>

<script>
// 1. 引入STY交易所相关API
import { listOrdersByPage } from '../api/sty-exchange-api'; // 确保路径正确
// 2. 引入 Element Plus 的消息组件
import { ElMessage } from 'element-plus';

export default {
    name: 'StyExchange',
    data() {
        return {
            loading: false,
            tableData: [],
            // 分页信息
            pagination: {
                currentPage: 1,
                pageSize: 10,
                total: 0,
            },
            // 搜索表单的数据模型
             searchForm: {
                    creatorId: '',
                    takerId: '',
                    orderType: '',
                    orderStatus: '',
                    timeRange: [],
                    startTime: '',
                    endTime: ''
                },
            // 下拉框选项
            orderTypeOptions: [
                { value: 1, label: '买入STY' },
                { value: 2, label: '卖出STY' }
            ],
            orderStatusOptions: [
                { value: 0, label: '待匹配' },
                { value: 1, label: '已匹配/交易成功' },
                { value: 2, label: '已取消' },
                { value: 3, label: '异常' }
            ],

            // ==================== 新增: 对话框状态 ====================
            detailDialogVisible: false, // 控制详情对话框的显示
            selectedOrder: null,      // 存储当前查看的订单详情
            // ==================== 新增结束 ====================
        };
    },
    methods: {
        // 加载/查询 订单数据 (无变化)
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
                
                const { timeRange, ...searchParams } = this.searchForm;

                const query = {
                    current: this.pagination.currentPage,
                    size: this.pagination.pageSize,
                    ...searchParams // 将搜索条件合并到请求中
                };

                console.log('即将发送给后端的查询参数:', JSON.stringify(query, null, 2));

                const response = await listOrdersByPage(query);
            
                // 后端返回的是 Mybatis-Plus 的 Page 对象
                if (response.code === 200 || response.code === 0) { // 兼容常见的成功状态码
                    this.tableData = response.data.records || [];
                    this.pagination.total = response.data.total || 0;
                } else {
                    throw new Error(response.message || '数据加载失败');
                }
            } catch (e) {
                ElMessage.error(e.message || '数据加载失败');
                this.tableData = [];
                this.pagination.total = 0;
            } finally {
                this.loading = false;
            }
        },

        // 执行搜索 (无变化)
        handleSearch() {
            this.pagination.currentPage = 1; 
            this.loadData();
        },

        // 重置搜索条件 (无变化)
        resetSearch() {
            this.$refs.searchFormRef.resetFields();
            this.searchForm.startTime = '';
            this.searchForm.endTime = '';
            this.handleSearch();
        },

        // 分页大小变化 (无变化)
        handleSizeChange(newSize) {
            this.pagination.pageSize = newSize;
            this.loadData();
        },
        
        // 当前页码变化 (无变化)
        handleCurrentChange(newPage) {
            this.pagination.currentPage = newPage;
            this.loadData();
        },
        
        // --- 表格内容格式化 --- (无变化)
        formatOrderType(row, column, cellValue) {
            const type = this.orderTypeOptions.find(item => item.value === cellValue);
            return type ? type.label : '未知';
        },
        formatOrderStatus(row, column, cellValue) {
            const status = this.orderStatusOptions.find(item => item.value === cellValue);
            return status ? status.label : '未知';
        },

        // --- 操作 ---
        // ==================== 修改: handleViewDetails 方法 ====================
        handleViewDetails(row) {
            console.log('查看详情: ', row);
            // 将点击的行数据赋值给 selectedOrder
            this.selectedOrder = row;
            // 打开对话框
            this.detailDialogVisible = true;
        }
        // ==================== 修改结束 ====================
    },
    // 组件挂载后立即加载初始数据 (无变化)
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

.search-form {
    display: flex;
    flex-wrap: wrap; 
    align-items: center; 
    gap: 12px; 
}

.search-form .el-form-item {
    margin-right: 0 !important;
    margin-bottom: 0 !important;
}
</style>