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
                                        <div class="api-times">
                                            <!-- 1. 改为 (t, index) 获取索引，以便去 ips 数组里取值 -->
                                            <el-tooltip v-for="(t, index) in api.requestTimes" :key="index"
                                                effect="dark" placement="top">
                                                <!-- 2. Tooltip 内容：显示完整时间和对应的 IP -->
                                                <template #content>
                                                    <div style="text-align: center">
                                                        <div><b style="color: #fff">IP:</b> {{ api.ips && api.ips[index]
                                                            ? api.ips[index] : '未记录' }}</div>
                                                        <div style="font-size: 12px; margin-top: 4px; color: #ccc">时间:
                                                            {{ t }}</div>
                                                    </div>
                                                </template>

                                                <!-- 3. Tag 本体：保持简洁，只显示时分秒 -->
                                                <el-tag size="small" type="info" class="time-tag cursor-pointer">
                                                    {{ t.split(' ')[1] }}
                                                    <!-- 如果你一定要在标签里直接显示 IP，取消下面这行的注释即可 -->
                                                    <!-- <span class="ml-1 text-xs text-gray-400">({{ api.ips?.[index] }})</span> -->
                                                </el-tag>
                                            </el-tooltip>
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
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 引入你的API文件
import { getSysOpenLogAnalysis } from '../api/sysOpenLog'; // 请根据实际路径修改

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
</style>