<template>
    <div class="dashboard-container">
        <!-- 顶部：筛选栏 -->
        <el-card shadow="never" class="mb-4 filter-card">
            <div class="filter-header">
                <span class="title">接口日志与统计分析</span>
                
                <div class="filter-actions">
                    <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至"
                        start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss"
                        :default-time="defaultTime" @change="fetchAnalysisData" />
                    <el-button type="primary" :icon="Search" @click="fetchAnalysisData" :loading="loading">
                        查询
                    </el-button>
                    <el-button type="danger" :icon="Warning" @click="handleAbnormalAnalysis">
                        异常流量分析
                    </el-button>
                </div>
            </div>
        </el-card>

        <!-- 第一行：核心指标 -->
        <el-row :gutter="20" class="mb-4">
            <el-col :span="6">
                <el-card shadow="hover" class="metric-card">
                    <template #header>总请求数</template>
                    <div class="metric-value text-primary">{{ analysisData.totalRequests || 0 }}</div>
                    <div class="metric-sub">次</div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="metric-card">
                    <template #header>平均耗时</template>
                    <div class="metric-value text-warning">{{ (analysisData.avgCostTime || 0).toFixed(2) }}</div>
                    <div class="metric-sub">ms</div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="metric-card">
                    <template #header>错误请求</template>
                    <div class="metric-value text-danger">{{ analysisData.errorCount || 0 }}</div>
                    <div class="metric-sub">次 ({{ errorRate }}%)</div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="metric-card">
                    <template #header>API 覆盖数</template>
                    <div class="metric-value text-success">{{ analysisData.apiPerformance?.length || 0 }}</div>
                    <div class="metric-sub">个接口</div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 第二行：图表区域 -->
        <el-row :gutter="20" class="mb-4">
            <!-- 左侧：流量趋势图 -->
            <el-col :span="16">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <div class="card-header flex-between">
                            <span>请求流量趋势</span>
                            <!-- 维度切换按钮 -->
                            <el-radio-group v-model="trendDimension" size="small" @change="handleDimensionChange">
                                <el-radio-button label="minute">分钟</el-radio-button>
                                <el-radio-button label="hour">小时</el-radio-button>
                                <el-radio-button label="day">天</el-radio-button>
                            </el-radio-group>
                        </div>
                    </template>
                    <div ref="trendChartRef" style="height: 350px; width: 100%;"></div>
                </el-card>
            </el-col>

            <!-- 右侧：Top 活跃用户 -->
            <el-col :span="8">
                <el-card shadow="hover" class="chart-card">
                    <template #header>用户活跃榜 Top 5</template>
                    <el-table :data="topUsersList" style="width: 100%" height="350">
                        <el-table-column prop="username" label="用户" width="100" show-overflow-tooltip />
                        <el-table-column prop="uri" label="常访接口" show-overflow-tooltip />
                        <el-table-column prop="count" label="次数" width="80" align="right" />
                    </el-table>
                </el-card>
            </el-col>
        </el-row>

        <!-- 第三行：接口性能分析 -->
        <!-- <el-row :gutter="20" class="mb-4">
            <el-col :span="24">
                <el-card shadow="hover">
                    <template #header>接口耗时性能排行 (Top 10)</template>
                    <div ref="perfChartRef" style="height: 300px;"></div>
                </el-card>
            </el-col>
        </el-row> -->

        <!-- 第四行：详细时段下钻 (使用折叠面板处理深层嵌套数据) -->
        <el-card shadow="never">
            <template #header>时段详情追溯</template>
            <el-collapse accordion>
                <el-collapse-item v-for="(slot, index) in analysisData.hourlyDetails" :key="index" :name="index">
                    <template #title>
                        <div class="slot-title">
                            <el-tag size="small" effect="dark">{{ slot.timeSlot }}</el-tag>
                            <span class="ml-2">该时段总请求: <b>{{ slot.totalRequestInSlot }}</b></span>
                        </div>
                    </template>

                    <!-- 该时段内的用户行为 -->
                    <!-- 修改后的 Template 部分 -->
                    <div class="slot-content">
                        <!-- 内层折叠：用户列表 -->
                        <!-- 使用 accordion 属性，保证一次只展开一个用户，避免页面太乱 -->
                        <el-collapse accordion>
                            <el-collapse-item v-for="(user, uIndex) in slot.userActions" :key="uIndex" :name="uIndex">
                                <!-- 【折叠面板标题】：显示用户摘要信息 -->
                                <template #title>
                                    <div class="user-summary-row">
                                        <div class="user-info-col name">
                                            <el-icon class="icon-mr">
                                                <User />
                                            </el-icon>
                                            <span class="label">用户:</span>
                                            <span class="value">{{ user.username || '未知用户' }}</span>
                                        </div>

                                        <div class="user-info-col wallet">
                                            <el-icon class="icon-mr">
                                                <Wallet />
                                            </el-icon>
                                            <span class="label">钱包:</span>
                                            <span class="value mono">{{ user.userWalletAddress || '---' }}</span>
                                        </div>

                                        <div class="user-info-col count">
                                            <el-tag type="warning" size="small" effect="plain">
                                                此段请求: {{ user.totalCount }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </template>

                                <!-- 【折叠面板内容】：显示详细 API 列表 -->
                                <div class="user-api-details">
                                    <div v-for="(api, aIndex) in user.apis" :key="aIndex" class="api-row">
                                        <div class="api-header">
                                            <span class="api-method-tag">API</span>
                                            <span class="api-uri">{{ api.uri }}</span>
                                            <span class="api-stat-info">
                                                (共 <span class="text-bold">{{ api.count }}</span> 次,
                                                均耗 <span class="text-bold">{{ Math.round(api.avgCost) }}</span> ms)
                                            </span>
                                        </div>

                                        <!-- 具体时间点 Tag 列表 -->
                                        <!-- 具体时间点 Tag 列表 (带 IP 提示) -->
                                        <div class="api-chart-container">
    <IpScatterChart 
        :times="api.requestTimes" 
        :ips="api.ips" 
    />
</div>
                                    </div>
                                </div>
                            </el-collapse-item>
                        </el-collapse>

                        <el-empty v-if="!slot.userActions || slot.userActions.length === 0" description="该时段无用户活跃记录"
                            image-size="60" />
                    </div>
                </el-collapse-item>
            </el-collapse>
        </el-card>
    </div>
    <!-- 新增：异常流量分析弹窗 -->
        <el-dialog v-model="abnormalVisible" title="异常流量分析报告" width="80%" destroy-on-close>
            <div v-loading="abnormalLoading" class="abnormal-container">
                
                <!-- 1. 概览数据 -->
                <el-row :gutter="20" class="mb-4">
                    <el-col :span="8">
                        <div class="abnormal-metric-box bg-blue">
                            <div class="label">总检测请求数</div>
                            <div class="val">{{ abnormalData.totalRequestCount || 0 }}</div>
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="abnormal-metric-box bg-red">
                            <div class="label">检测到错误请求</div>
                            <div class="val">{{ abnormalData.errorRequestCount || 0 }}</div>
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="abnormal-metric-box bg-orange">
                            <div class="label">检测到慢请求</div>
                            <div class="val">{{ abnormalData.slowRequestCount || 0 }}</div>
                        </div>
                    </el-col>
                </el-row>

                <!-- 2. 风险用户列表 (重点) -->
                <h3 class="section-title">
                    <el-icon class="mr-1"><WarnTriangleFilled /></el-icon> 风险用户/IP 预警
                </h3>
                <el-table :data="abnormalData.riskUsers" border stripe style="width: 100%" class="mb-4">
                    <el-table-column prop="username" label="用户名" width="120" />
                    <el-table-column prop="userWalletAddress" label="钱包地址/ID" show-overflow-tooltip min-width="150" />
                    <el-table-column prop="ip" label="来源IP" width="140" />
                    <el-table-column label="风险特征 (标签)" min-width="250">
                        <template #default="scope">
                            <div class="risk-tags">
                                <el-tag 
                                    v-for="tag in scope.row.riskTypes" 
                                    :key="tag" 
                                    type="danger" 
                                    effect="dark"
                                    class="mr-1 mb-1"
                                >
                                    {{ riskTypeMap[tag] || tag }}
                                </el-tag>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="totalCount" label="总请求" width="100" align="center" sortable />
                    <el-table-column prop="errorCount" label="错误数" width="100" align="center" sortable />
                    <el-table-column prop="slowCount" label="慢请求" width="100" align="center" sortable />
                </el-table>

                <!-- 3. 详细日志 Tabs -->
                <el-tabs type="border-card">
                    <el-tab-pane label="最近错误日志">
                        <el-table :data="abnormalData.recentErrorLogs" height="300" style="width: 100%">
                            <el-table-column prop="requestTime" label="时间" width="160" />
                            <el-table-column prop="ip" label="IP" width="130" />
                            <el-table-column prop="method" label="Method" width="80" />
                            <el-table-column prop="uri" label="接口地址" show-overflow-tooltip />
                            <el-table-column prop="status" label="状态码" width="80">
                                <template #default="{ row }">
                                    <el-tag type="danger">{{ row.status }}</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                    <el-tab-pane label="最近慢请求日志">
                        <el-table :data="abnormalData.recentSlowLogs" height="300" style="width: 100%">
                            <el-table-column prop="requestTime" label="时间" width="160" />
                            <el-table-column prop="uri" label="接口地址" show-overflow-tooltip />
                            <el-table-column prop="costTime" label="耗时 (ms)" width="120" sortable>
                                <template #default="{ row }">
                                    <span class="text-warning font-bold">{{ row.costTime }}</span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>

            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="abnormalVisible = false">关 闭</el-button>
                </div>
            </template>
        </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import { Search, User, Wallet, Warning, WarnTriangleFilled } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import IpScatterChart from './IpScatterChart.vue'

// 引入你的API文件
import { getSysOpenLogAnalysis, getAbnormalTrafficAnalysis } from '../api/sysOpenLog'; // 请根据实际路径修改

// --- 状态定义 ---
const loading = ref(false);
const dateRange = ref([]);
// 设置默认时间范围：今天 00:00:00 到 23:59:59
const defaultTime = [
    new Date(2000, 1, 1, 0, 0, 0),
    new Date(2000, 1, 1, 23, 59, 59),
];

// --- 新增状态 ---
const trendDimension = ref('hour'); // 默认为 'hour'

// --- 新增/修改方法 ---

/**
 * 切换维度时的回调
 */
const handleDimensionChange = () => {
    // 数据已经都在 analysisData 里了，不需要重新请求后端，直接重绘图表即可
    renderTrendChart();
};

const analysisData = reactive({
    totalRequests: 0,
    avgCostTime: 0,
    errorCount: 0,
    requestsByHour: {},
    apiPerformance: [],
    topActiveUsers: [],
    hourlyDetails: []
});

// --- 异常分析相关状态 ---
const abnormalVisible = ref(false);
const abnormalLoading = ref(false);
const abnormalData = reactive({
    totalRequestCount: 0,
    errorRequestCount: 0,
    slowRequestCount: 0,
    riskUsers: [],
    recentErrorLogs: [],
    recentSlowLogs: []
});


// --- 风险标签字典映射 ---
const riskTypeMap = {
    'PASSWORD_BRUTE_FORCE': '密码爆破攻击',
    'HIGH_QPS_BURST': '高QPS瞬时突发',
    'HIGH_ERROR_RATE': '高错误率异常',
    'SUSPECTED_SPIDER': '疑似爬虫行为',
    'SLOW_REQUEST': '慢请求过多',
    'LOGIN_FAIL': '登录失败过多',
    'DISTRIBUTED_ATTACK_OR_PROXY': '分布式攻击或代理访问'
};

// Chart DOM 引用
const trendChartRef = ref(null);
const perfChartRef = ref(null);
let trendChartInst = null;
let perfChartInst = null;

// --- 计算属性 ---
const errorRate = computed(() => {
    if (!analysisData.totalRequests) return 0;
    return ((analysisData.errorCount / analysisData.totalRequests) * 100).toFixed(1);
});

const topUsersList = computed(() => {
    return analysisData.topActiveUsers || [];
});

// --- 方法 ---



/**
 * 触发异常流量分析
 * 根据当前选择的日期范围计算天数，如果没选则默认 1 天
 */
const handleAbnormalAnalysis = async () => {
    abnormalVisible.value = true;
    abnormalLoading.value = true;
    
    try {
        // 计算天数
        let days = 1;
        if (dateRange.value && dateRange.value.length === 2) {
            const start = new Date(dateRange.value[0]).getTime();
            const end = new Date(dateRange.value[1]).getTime();
            const diff = end - start;
            // 向上取整计算天数
            days = Math.ceil(diff / (1000 * 3600 * 24));
        }
        
        // 限制在 1-7 天内 (根据API文档描述)
        if (days < 1) days = 1;
        if (days > 7) days = 7;

        const config = {
            days: days,
            // 可以在此添加其他阈值参数，如:
            // slowThresholdMs: 1000,
            // qpsThreshold: 10
        };

        const res = await getAbnormalTrafficAnalysis(config);
        
        // 清空旧数据并赋值新数据
        Object.assign(abnormalData, {
            totalRequestCount: 0,
            errorRequestCount: 0,
            slowRequestCount: 0,
            riskUsers: [],
            recentErrorLogs: [],
            recentSlowLogs: []
        }); // reset
        Object.assign(abnormalData, res);

    } catch (error) {
        console.error(error);
        ElMessage.error('获取异常分析报告失败');
    } finally {
        abnormalLoading.value = false;
    }
};



/**
 * 获取数据
 */
const fetchAnalysisData = async () => {
    loading.value = true;
    try {
        const params = {};
        if (dateRange.value && dateRange.value.length === 2) {
            params.startTime = dateRange.value[0];
            params.endTime = dateRange.value[1];
        }

        const res = await getSysOpenLogAnalysis(params);
        console.log('分析数据', res);

        // 更新数据
        Object.assign(analysisData, res);

        // 渲染图表
        nextTick(() => {
            renderTrendChart();
            renderPerfChart();
        });
    } catch (error) {
        console.error(error);
        ElMessage.error('获取日志分析数据失败');
    } finally {
        loading.value = false;
    }
};

/**
 * 渲染趋势图 (核心修改逻辑)
 */
const renderTrendChart = () => {
    if (!trendChartRef.value) return;

    if (!trendChartInst) {
        trendChartInst = echarts.init(trendChartRef.value);
        window.addEventListener('resize', () => trendChartInst.resize());
    }

    // 1. 根据当前选中的维度，获取对应的数据源
    let sourceMap = {};
    let xAxisFormat = (val) => val; // X轴标签格式化函数

    if (trendDimension.value === 'minute') {
        // 对应后端: requestsByMinute
        sourceMap = analysisData.requestsByMinute || {};
        // 分钟显示格式: 15:30
        xAxisFormat = (val) => val.length > 11 ? val.slice(11, 16) : val;
    } else if (trendDimension.value === 'day') {
        // 对应后端: requestsByDay
        sourceMap = analysisData.requestsByDay || {};
        // 天显示格式: 11-24
        xAxisFormat = (val) => val.length >= 10 ? val.slice(5, 10) : val;
    } else {
        // 默认: requestsByHour
        sourceMap = analysisData.requestsByHour || {};
        // 小时显示格式: 15:00
        xAxisFormat = (val) => val.length > 11 ? val.slice(11, 16) : val;
    }

    // 2. 数据处理：Map 转 Arrays 并排序
    // Object.keys 返回的顺序不一定可靠，必须 sort
    const dates = Object.keys(sourceMap).sort();
    const values = dates.map(date => sourceMap[date]);

    // 3. 配置图表
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter: function (params) {
                // 自定义 Tooltip 显示完整时间
                const item = params[0];
                return `${item.name}<br/>请求量: <b>${item.value}</b>`;
            }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates,
            axisLabel: {
                formatter: xAxisFormat // 应用上面的格式化规则
            }
        },
        yAxis: {
            type: 'value',
            name: '请求数'
        },
        series: [
            {
                name: '请求量',
                type: 'line',
                smooth: true, // 平滑曲线
                symbol: 'circle',
                symbolSize: 6,
                showSymbol: values.length < 50, // 数据点太多时不显示圆点，少的时候显示
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(64,158,255,0.5)' },
                        { offset: 1, color: 'rgba(64,158,255,0.01)' }
                    ])
                },
                itemStyle: { color: '#409EFF' },
                data: values
            }
        ]
    };

    trendChartInst.setOption(option);
};

/**
 * 渲染性能排行图 (横向柱状图)
 */
const renderPerfChart = () => {
    if (!perfChartRef.value) return;

    if (!perfChartInst) {
        perfChartInst = echarts.init(perfChartRef.value);
        window.addEventListener('resize', () => perfChartInst.resize());
    }

    // 提取前10个耗时最长的接口，或者是数据里的全部
    const list = [...(analysisData.apiPerformance || [])];
    // 按平均耗时倒序
    list.sort((a, b) => a.avgCostTime - b.avgCostTime); // ECharts Y轴由于是从下到上，所以这里正序可以让最长的在上面

    const uris = list.map(item => item.uri);
    const avgTimes = list.map(item => item.avgCostTime);
    const counts = list.map(item => item.requestCount);

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const idx = params[0].dataIndex;
                const item = list[idx];
                return `
          <b>${item.uri}</b><br/>
          平均耗时: ${item.avgCostTime} ms<br/>
          最大耗时: ${item.maxCostTime} ms<br/>
          请求次数: ${item.requestCount} 次
        `;
            }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'value',
            name: '平均耗时(ms)'
        },
        yAxis: {
            type: 'category',
            data: uris,
            axisLabel: {
                width: 200,
                overflow: 'truncate'
            }
        },
        series: [
            {
                name: '平均耗时',
                type: 'bar',
                data: avgTimes,
                itemStyle: {
                    color: (params) => {
                        // 耗时超过 1000ms 标红，否则默认蓝
                        return params.value > 1000 ? '#F56C6C' : '#409EFF';
                    }
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{c} ms'
                }
            }
        ]
    };

    perfChartInst.setOption(option);
};

// --- 生命周期 ---
onMounted(() => {
    // 设置默认查询当天
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 简单的日期格式化
    const fmt = (d) => d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');

    dateRange.value = [fmt(start), fmt(end)];

    fetchAnalysisData();
});

</script>

<style scoped>
.dashboard-container {
    padding: 20px;
    background-color: #f0f2f5;
    min-height: 100vh;
}

.filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.metric-card {
    text-align: center;
}

.metric-value {
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
}

.metric-sub {
    font-size: 12px;
    color: #909399;
}

.text-primary {
    color: #409EFF;
}

.text-success {
    color: #67C23A;
}

.text-warning {
    color: #E6A23C;
}

.text-danger {
    color: #F56C6C;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.slot-title {
    display: flex;
    align-items: center;
}

.ml-2 {
    margin-left: 8px;
}

.mb-3 {
    margin-bottom: 12px;
}

.mb-4 {
    margin-bottom: 20px;
}

.mr-1 {
    margin-right: 4px;
}

.api-detail-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    border-bottom: 1px dashed #eee;
    padding: 4px 0;
}

.api-uri {
    font-weight: bold;
    color: #606266;
    margin-right: 10px;
}

.api-stats {
    font-size: 12px;
    color: #909399;
    margin-right: 10px;
}

.time-points {
    display: flex;
    flex-wrap: wrap;
}

/* 用户摘要行的布局 */
.user-summary-row {
    display: flex;
    align-items: center;
    width: 100%;
    padding-right: 10px;
    /* 避免遮挡右侧折叠箭头 */
}

.user-info-col {
    display: flex;
    align-items: center;
    margin-right: 20px;
}

/* 让钱包地址占据剩余空间，或者设置最大宽度显示省略号 */
.user-info-col.wallet {
    flex: 1;
    color: #606266;
    font-size: 13px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.user-info-col.name {
    min-width: 150px;
    font-weight: bold;
    color: #303133;
}

.user-info-col.count {
    margin-right: 0;
}

.icon-mr {
    margin-right: 5px;
    color: #909399;
}

.label {
    color: #909399;
    margin-right: 6px;
    font-size: 12px;
}

/* 等宽字体显示钱包地址，看起来更专业 */
.mono {
    font-family: Consolas, Monaco, monospace;
}

/* --- API 详情区域样式 --- */
.user-api-details {
    background-color: #fafafa;
    /* 浅灰色背景区分层级 */
    padding: 10px 20px;
    border-radius: 4px;
}

.api-row {
    border-bottom: 1px dashed #e4e7ed;
    padding: 12px 0;
}

.api-row:last-child {
    border-bottom: none;
}

.api-header {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.api-method-tag {
    background: #ecf5ff;
    color: #409eff;
    border: 1px solid #d9ecff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    margin-right: 8px;
}

.api-uri {
    font-weight: 600;
    color: #303133;
    margin-right: 10px;
    word-break: break-all;
    /* 防止长URL撑破布局 */
}

.api-stat-info {
    font-size: 12px;
    color: #909399;
}

.text-bold {
    color: #303133;
    font-weight: bold;
}

.api-times {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    /* Vue3/现代浏览器支持 gap */
}

.time-tag {
    border: none;
    background-color: #fff;
    border: 1px solid #ebeef5;
    color: #606266;
}
.cursor-pointer {
  cursor: pointer;
  transition: all 0.2s;
}

.cursor-pointer:hover {
  /* 悬停时稍微变深一点，增加交互感 */
  background-color: #e9e9eb;
  border-color: #d3d4d6;
}

/* 之前的 gap 样式可能需要确认一下兼容性，如果 api-times 没生效，可以用 margin */
.time-tag {
  margin-right: 6px; 
  margin-bottom: 6px;
}
/* --- 新增：异常分析弹窗样式 --- */
.abnormal-container { padding: 0 10px; }
.abnormal-metric-box {
    border-radius: 8px;
    padding: 20px;
    /* color: #fff; */
    /* text-align: center; */
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
/* .abnormal-metric-box .label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
.abnormal-metric-box .val { font-size: 28px; font-weight: bold; } */

/* .bg-blue { background: linear-gradient(135deg, #409EFF, #79bbff); }
.bg-red { background: linear-gradient(135deg, #F56C6C, #f89898); }
.bg-orange { background: linear-gradient(135deg, #E6A23C, #eebe77); } */

.section-title {
    margin: 20px 0 15px;
    font-size: 16px;
    display: flex;
    align-items: center;
    color: #303133;
    border-left: 4px solid #F56C6C;
    padding-left: 10px;
}
.risk-tags { display: flex; flex-wrap: wrap; }
.font-bold { font-weight: bold; }
.api-chart-container {
    margin-top: 10px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #fff;
    padding: 10px;
}
</style>