<template>
  <div class="team-management-container">
    <!-- 1. 按钱包地址查询 -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>通过钱包地址查询下级</span>
        </div>
      </template>
      <el-form :model="searchForm" inline>
        <el-form-item label="钱包地址" prop="walletAddress">
          <el-input 
            v-model="searchForm.walletAddress" 
            placeholder="请输入完整的钱包地址" 
            clearable 
            style="width: 400px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 团队列表展示 -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ tableTitle }}</span>
        </div>
      </template>
      
      <!-- 动态列渲染表格 -->
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <!-- 使用 v-for 动态渲染列 -->
        <el-table-column
          v-for="column in activeColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :align="column.align"
          :formatter="column.formatter"
          :show-overflow-tooltip="column.showOverflowTooltip"
        />
        
        <!-- 操作列：仅在显示完整团队列表时出现 -->
        <el-table-column v-if="!isSearchResult" label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              type="danger" 
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 3. 分页 -->
      <div v-if="!isSearchResult && pagination.total > 0" class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listTeamsByPage, getSubordinatesByWallet, deleteTeam } from '../api/TeamApi';

// --- 响应式状态定义 ---
const searchForm = reactive({ walletAddress: '' });
const tableData = ref([]);
const loading = ref(false);
const isSearchResult = ref(false);
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 });

// --- 动态列表配置 ---

// 格式化日期时间的辅助函数
const formatDateTime = (row, column, cellValue) => {
  if (!cellValue) return '';
  return cellValue.replace('T', ' ');
}

// “所有团队”视图的列配置
const allTeamsColumns = [
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  { prop: 'userId', label: '用户ID', width: 100, align: 'center' },
  { prop: 'upUserId', label: '上级用户ID', width: 120, align: 'center' },
  { prop: 'invitationCode', label: '个人邀请码', showOverflowTooltip: true },
  { prop: 'upInvitationCode', label: '上级邀请码', showOverflowTooltip: true },
  { prop: 'creatTime', label: '创建时间', width: 180, align: 'center', formatter: formatDateTime }
];

// “钱包查询结果”视图的列配置
const searchResultColumns = [
  { prop: 'relation', label: '关系', width: 100, align: 'center' },
  { prop: 'userId', label: '下级用户ID', width: 120, align: 'center' },
  { prop: 'walletAddress', label: '下级钱包地址', showOverflowTooltip: true }
];

// 计算属性，根据当前状态返回对应的列配置
const activeColumns = computed(() => {
  return isSearchResult.value ? searchResultColumns : allTeamsColumns;
});

const tableTitle = computed(() => {
  return isSearchResult.value ? `"${searchForm.walletAddress}" 的下级团队列表` : '所有团队信息列表';
});

// --- API 调用与逻辑处理 (与之前版本相同) ---

const fetchTeamList = async () => {
  loading.value = true;
  try {
    const res = await listTeamsByPage(pagination.currentPage, pagination.pageSize);
    if (res.code === 200) {
      tableData.value = res.data.records;
      pagination.total = res.data.total;
    } else {
      ElMessage.error(res.message || '获取团队列表失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，获取团队列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  if (!searchForm.walletAddress.trim()) {
    ElMessage.warning('请输入钱包地址');
    return;
  }
  loading.value = true;
  isSearchResult.value = true;
  try {
    const res = await getSubordinatesByWallet(searchForm.walletAddress.trim());
    if (res.code === 200) {
      tableData.value = res.data;
      ElMessage.success('查询成功！');
    } else {
      ElMessage.error(res.message || '查询失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，查询下级失败');
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  searchForm.walletAddress = '';
  isSearchResult.value = false;
  pagination.currentPage = 1;
  fetchTeamList();
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除 ID 为 ${row.id} 的团队记录吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      const res = await deleteTeam(row.id);
      if (res.code === 200) {
        ElMessage.success('删除成功！');
        fetchTeamList();
      } else {
        ElMessage.error(res.message || '删除失败');
      }
    } catch (error) {
      ElMessage.error('网络错误，删除失败');
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  fetchTeamList();
};

const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage;
  fetchTeamList();
};

onMounted(() => {
  fetchTeamList();
});
</script>

<style scoped>
/* 样式与之前版本相同 */
.team-management-container {
  padding: 20px;
}
.box-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>