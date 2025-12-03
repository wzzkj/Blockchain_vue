<!-- components/IpScatterChart.vue -->
<template>
  <div ref="chartRef" class="ip-scatter-chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  times: {
    type: Array,
    default: () => []
  },
  ips: {
    type: Array,
    default: () => []
  }
});

const chartRef = ref(null);
let chartInstance = null;
let resizeObserver = null;

// 初始化或更新图表
const initChart = () => {
  if (!chartRef.value) return;
  
  // 销毁旧实例（防止内存泄漏或数据残留）
  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = echarts.init(chartRef.value);

  // 1. 数据处理
  // 提取所有去重的 IP 作为 Y 轴类目
  const uniqueIps = [...new Set(props.ips)].sort();
  
  // 构造散点数据: [[时间字符串, IP字符串], ...]
  // ECharts category轴可以直接匹配字符串，但需要数据对应的Y值也是该字符串
  const data = props.times.map((time, index) => {
    return [time, props.ips[index]];
  });

  // 2. 动态计算高度
  // 如果IP非常多，图表高度需要撑开，否则挤在一起
  const minHeight = 150;
  const heightPerIp = 30;
  const calculatedHeight = Math.max(minHeight, uniqueIps.length * heightPerIp);
  chartRef.value.style.height = `${calculatedHeight}px`;
  chartInstance.resize(); // 应用新高度

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        // params.data[0] 是时间, params.data[1] 是IP
        return `
          <div style="margin-bottom: 4px;"><b>IP:</b> ${params.data[1]}</div>
          <div><b>时间:</b> ${params.data[0]}</div>
        `;
      }
    },
    grid: {
      top: 30,
      right: 30,
      bottom: 20,
      left: 120, // 给 IP 地址留出足够的左侧空间
      containLabel: true
    },
    xAxis: {
      type: 'time', // 时间轴
      axisLabel: {
        formatter: '{HH}:{mm}:{ss}' // 只显示时分秒
      },
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed' }
      }
    },
    yAxis: {
      type: 'category',
      data: uniqueIps,
      axisLabel: {
        interval: 0, // 强制显示所有 IP
        formatter: (value) => {
          // 如果IP太长可以截断，这里暂时完整显示
          return value;
        }
      },
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed', color: '#eee' }
      }
    },
    series: [
      {
        name: '请求记录',
        type: 'scatter',
        symbolSize: 8, // 点的大小
        itemStyle: {
          color: 'rgba(64, 158, 255, 0.7)', // 半透明蓝色
          borderColor: '#409EFF',
          borderWidth: 1
        },
        data: data
      }
    ]
  };

  chartInstance.setOption(option);
};

onMounted(() => {
  // 使用 ResizeObserver 监听容器大小变化
  // 因为在 el-collapse 中，初始可能是隐藏的(height=0)，展开时需要自动 resize
  resizeObserver = new ResizeObserver(() => {
    if (chartInstance) {
      chartInstance.resize();
    } else {
      // 如果初次挂载时是隐藏的，可能没初始化成功，尝试重新初始化
      if (chartRef.value && chartRef.value.clientHeight > 0) {
        initChart();
      }
    }
  });
  
  if (chartRef.value) {
    resizeObserver.observe(chartRef.value);
  }
  
  // 尝试首次初始化
  nextTick(() => {
    initChart();
  });
});

onUnmounted(() => {
  if (chartInstance) chartInstance.dispose();
  if (resizeObserver) resizeObserver.disconnect();
});

// 监听数据变化重新渲染
watch(() => props.times, () => {
  initChart();
}, { deep: true });
</script>

<style scoped>
.ip-scatter-chart {
  width: 100%;
  /* 默认高度，会被JS动态覆盖 */
  height: 200px; 
}
</style>