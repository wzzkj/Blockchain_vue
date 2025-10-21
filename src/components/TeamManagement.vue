<template>
  <div class="user-management-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ tableTitle }}</span>
        </div>
      </template>

      <!-- 1. 查询表单 -->
      <el-form :model="searchForm" inline>
        <el-form-item label="钱包地址" prop="walletAddress">
          <el-input
            v-model="searchForm.walletAddress"
            placeholder="输入钱包地址查询其下级团队"
            clearable
            style="width: 400px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 2. 统一的用户信息表格 -->
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
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
      </el-table>

      <!-- 3. 分页组件 (仅在非搜索结果时显示) -->
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
import { ElMessage } from 'element-plus';
import { getSubordinatesByWallet } from '../api/TeamApi';
import { listUsersByAdmin, getUserStatsByAdmin, getUserByIdForAdmin } from '../api/user';
import { getUserBalance } from '../api/userPlatformFlow';
import { getWalletByIdForAdmin } from '../api/wallet';

// --- 状态管理、格式化函数、列配置 (均无变化) ---
const searchForm = reactive({ walletAddress: '' });
const tableData = ref([]);
const loading = ref(false);
const isSearchResult = ref(false);
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 });

const formatDateTime = (row, column, cellValue) => {
  if (!cellValue) return '';
  return new Date(cellValue).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
}

const baseUserColumns = [
  { prop: 'id', label: '用户ID', width: 80, align: 'center' },
  { prop: 'walletAddress', label: '钱包地址', showOverflowTooltip: true },
  { prop: 'balance', label: '用户余额', width: 120, align: 'center' },
  { prop: 'totalTeamSize', label: '团队总人数', width: 120, align: 'center' },
  { prop: 'directReferrals', label: '直推人数', width: 100, align: 'center' },
  { prop: 'indirectReferrals', label: '间推人数', width: 100, align: 'center' },
  { prop: 'thirdGenReferrals', label: '三代人数', width: 100, align: 'center' },
  { prop: 'activeMachineCount', label: '有效矿机数', width: 120, align: 'center' },
  { prop: 'activeFinanceCount', label: '有效理财数', width: 120, align: 'center' },
  { prop: 'invitationCodeId', label: '个人邀请码', showOverflowTooltip: true },
  { prop: 'upInvitationCode', label: '上级邀请码', showOverflowTooltip: true },
  { prop: 'registrationTime', label: '注册时间', width: 180, align: 'center', formatter: formatDateTime }
];
const relationColumn = { prop: 'relation', label: '关系', width: 100, align: 'center' };
const activeColumns = computed(() => isSearchResult.value ? [relationColumn, ...baseUserColumns] : baseUserColumns);
const tableTitle = computed(() => isSearchResult.value ? `"${searchForm.walletAddress}" 的下级团队列表` : '用户多维信息列表');


// --- API 调用与核心逻辑 ---

/**
 * @description 【已修正】核心数据丰富化函数
 */
const enrichUsersData = async (users) => {
  if (!users || users.length === 0) return [];
  
  return Promise.all(
    users.map(async (user) => {
      // 从 user 对象中提前解构出 relation，以确保它不会丢失
      const { relation, ...restOfUser } = user;

      const walletPromise = restOfUser.walletAddress
        ? Promise.resolve(restOfUser.walletAddress)
        : getWalletByIdForAdmin(restOfUser.walletAddressId)
            .then(res => (res.code === 200 ? res.data.userWalletAddress : '获取失败'))
            .catch(() => '获取失败');
      
      const balancePromise = getUserBalance(restOfUser.id)
        .then(res => (res.code === 200 ? res.data : '获取失败'))
        .catch(() => '获取失败');
        
      const statsPromise = getUserStatsByAdmin(restOfUser.id)
        .then(res => (res.code === 200 ? res.data : {}))
        .catch(() => ({}));

      const [walletAddress, balance, statsData] = await Promise.all([walletPromise, balancePromise, statsPromise]);

      return {
        ...restOfUser,
        relation: relation, // 【修正1: 显式地将 relation 添加回最终对象】
        walletAddress,
        balance,
        directReferrals: statsData['直推人数'] ?? 'N/A',
        indirectReferrals: statsData['间推人数'] ?? 'N/A',
        thirdGenReferrals: statsData['三代人数'] ?? 'N/A',
        // 【修正2: 修正了错误的 statsData 键名】
        totalTeamSize: statsData['个人团队总人数'] ?? 'N/A', 
        activeMachineCount: statsData['个人矿机数量(有效期)'] ?? 'N/A',
        activeFinanceCount: statsData['个人理财产品数量(有效期)'] ?? 'N/A',
      };
    })
  );
};


// fetchUserList 函数保持不变
const fetchUserList = async () => {
  loading.value = true;
  try {
    const res = await listUsersByAdmin(pagination.currentPage, pagination.pageSize);
    if (res.code === 200 && res.data.records) {
      tableData.value = await enrichUsersData(res.data.records);
      pagination.total = res.data.total;
    } else {
      ElMessage.error(res.message || '获取用户列表失败');
      tableData.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取用户分页列表时出错:', error);
    ElMessage.error('网络错误，获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// handleSearch 函数保持不变
const handleSearch = async () => {
  if (!searchForm.walletAddress.trim()) {
    ElMessage.warning('请输入钱包地址');
    return;
  }
  loading.value = true;
  isSearchResult.value = true;
  try {
    const res = await getSubordinatesByWallet(searchForm.walletAddress.trim());
    console.log('getSubordinatesByWallet response:', res);
    if (res.code !== 200) {
      ElMessage.error(res.message || '查询失败');
      tableData.value = [];
      return;
    }

    const subordinatesBasicInfo = res.data;
    if (subordinatesBasicInfo.length === 0) {
        tableData.value = [];
        ElMessage.success('查询成功，该用户暂无下级团队');
        return;
    }

    const fullUserDetailsPromises = subordinatesBasicInfo.map(sub => getUserByIdForAdmin(sub.userId));
    const userDetailResponses = await Promise.allSettled(fullUserDetailsPromises);

    const mergedSubordinates = subordinatesBasicInfo.map((sub, index) => {
      const detailRes = userDetailResponses[index];
      if (detailRes.status === 'fulfilled' && detailRes.value.code === 200) {
        return {
          ...detailRes.value.data,
          relation: sub.relation,
          walletAddress: sub.walletAddress
        };
      } else {
        return {
          id: sub.userId,
          walletAddress: sub.walletAddress,
          relation: sub.relation,
          invitationCodeId: '获取失败',
          upInvitationCode: '获取失败',
          registrationTime: '获取失败',
        };
      }
    });
    
    tableData.value = await enrichUsersData(mergedSubordinates);
    ElMessage.success('查询成功！');

  } catch (error) {
    console.error('查询下级团队时出错:', error);
    ElMessage.error('网络错误，查询下级失败');
  } finally {
    loading.value = false;
  }
};

// --- 分页和重置逻辑 (无变化) ---
const resetSearch = () => {
  searchForm.walletAddress = '';
  isSearchResult.value = false;
  pagination.currentPage = 1;
  fetchUserList();
};

const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  fetchUserList();
};

const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage;
  fetchUserList();
};

onMounted(() => {
  fetchUserList();
});
</script>

<style scoped>
/* 样式部分与上一版相同，保持不变 */
.user-management-container {
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