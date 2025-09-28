<template>
  <div>
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        <span>新增等级</span>
      </el-button>
    </div>

    <!-- 表格主体 -->
    <el-table :data="tableData" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="levelName" label="等级名称" align="center" />
      <el-table-column prop="levelWeight" label="等级权重" sortable align="center" />
      
      <!-- <el-table-column prop="levelIcon" label="等级图标" align="center">
        <template #default="scope">
          <el-image 
            style="width: 50px; height: 50px"
            :src="scope.row.levelIcon" 
            :preview-src-list="[scope.row.levelIcon]"
            preview-teleported
            fit="cover"
          />
        </template>
      </el-table-column> -->

      <el-table-column prop="upgradeTeamKjPerformance" label="升级所需团队业绩(万)" show-overflow-tooltip align="center" />
      <el-table-column prop="feeGetRate" label="当前等级收益率" align="center" />

      <el-table-column prop="isEnabled" label="是否启用" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.isEnabled ? 'success' : 'danger'">
            {{ scope.row.isEnabled ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
      <el-table-column prop="updateTime" label="更新时间" width="180" align="center" />

      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑 对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" @close="closeDialog">
      <el-form ref="levelFormRef" :model="levelForm" :rules="levelFormRules" label-width="140px">
        <el-form-item label="等级名称" prop="levelName">
          <el-input v-model="levelForm.levelName" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="等级权重" prop="levelWeight">
          <el-input-number v-model="levelForm.levelWeight" :min="0" controls-position="right" placeholder="权重越小，等级越高" style="width: 100%;"/>
        </el-form-item>
        <!-- <el-form-item label="等级图标URL" prop="levelIcon">
          <el-input v-model="levelForm.levelIcon" placeholder="请输入图标的URL地址" />
        </el-form-item> -->
        <el-form-item label="升级所需团队业绩(万)" prop="upgradeTeamKjPerformance">
          <el-input v-model="levelForm.upgradeTeamKjPerformance" placeholder="请输入升级所需团队矿机产出总收益" />
        </el-form-item>
        <el-form-item label="当前等级收益率" prop="feeGetRate">
          <el-input v-model="levelForm.feeGetRate" placeholder="请输入一个小数，例如 0.05 代表 5%" />
        </el-form-item>
        <el-form-item label="是否启用" prop="isEnabled">
          <el-switch v-model="levelForm.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
// 1. 引入会员等级管理相关API
import {
  listAllVipLevelsAdmin,
  addVipLevel,
  updateVipLevel,
  deleteVipLevel
} from '../api/vipLevel'; // 假设你的api文件路径是这个
// 2. 引入 Element Plus 的消息和确认框组件
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue'; // 引入图标

// 初始化表单的默认数据结构
const defaultForm = {
    id: null,
    levelName: '',
    levelWeight: 0,
    // levelIcon: '',
    upgradeTeamKjPerformance: '0',
    feeGetRate: '0',
    isEnabled: true
};

export default {
    name: 'VipLevelManagement',
    components: {
        Plus
    },
    data() {
        return {
            loading: false,
            tableData: [],
            
            // --- 对话框相关 ---
            dialogVisible: false,
            isEdit: false, // 标记当前是新增还是编辑
            
            // --- 表单相关 ---
            levelForm: { ...defaultForm },
            levelFormRules: {
                levelName: [
                    { required: true, message: '等级名称不能为空', trigger: 'blur' }
                ],
                levelWeight: [
                    { required: true, message: '等级权重不能为空', trigger: 'blur' }
                ],
                // levelIcon: [
                //     { required: true, message: '等级图标URL不能为空', trigger: 'blur' }
                // ],
                upgradeTeamKjPerformance: [
                    { required: true, message: '升级业绩不能为空', trigger: 'blur' }
                ],
                feeGetRate: [
                    { required: true, message: '收益率不能为空', trigger: 'blur' }
                ],
            }
        };
    },
    computed: {
        dialogTitle() {
            return this.isEdit ? '编辑会员等级' : '新增会员等级';
        }
    },
    methods: {
        // 加载会员等级列表
        async loadData() {
            this.loading = true;
            try {
                const response = await listAllVipLevelsAdmin();
                if (response.code === 200) {
                    this.tableData = response.data;
                } else {
                    ElMessage.error(response.message || '数据加载失败');
                }
            } catch (e) {
                ElMessage.error(e.message || '数据加载失败');
            } finally {
                this.loading = false;
            }
        },

        // 处理新增按钮点击
        handleAdd() {
            this.isEdit = false;
            this.levelForm = { ...defaultForm }; // 重置表单为初始值
            this.dialogVisible = true;
        },

        // 处理编辑按钮点击
        handleEdit(row) {
            this.isEdit = true;
            // 使用深拷贝，避免直接修改表格中的数据
            this.levelForm = JSON.parse(JSON.stringify(row));
            this.dialogVisible = true;
        },

        // 处理删除按钮点击
        handleDelete(row) {
            ElMessageBox.confirm(
                `确定要删除等级【${row.levelName}】吗？此操作不可逆！`,
                '警告',
                {
                    confirmButtonText: '确定删除',
                    cancelButtonText: '取消',
                    type: 'warning',
                }
            ).then(async () => {
                try {
                    const response = await deleteVipLevel(row.id);
                    if (response.code === 200) {
                        ElMessage.success('删除成功');
                        this.loadData(); // 重新加载数据
                    } else {
                        ElMessage.error(response.message || '删除失败');
                    }
                } catch (e) {
                    ElMessage.error(e.message || '删除失败');
                }
            }).catch(() => {
                // 用户点击了取消
                ElMessage.info('已取消删除');
            });
        },

        // 关闭对话框
        closeDialog() {
            this.dialogVisible = false;
            // 在关闭时重置表单校验状态
            this.$refs.levelFormRef.resetFields();
        },

        // 提交表单 (新增或更新)
        submitForm() {
            this.$refs.levelFormRef.validate(async (valid) => {
                if (valid) {
                    try {
                        let response;
                        if (this.isEdit) {
                            // 编辑模式
                            response = await updateVipLevel(this.levelForm);
                        } else {
                            // 新增模式
                            // 从后端接口定义看，add接口不应该传id
                            const { id, ...addData } = this.levelForm;
                            response = await addVipLevel(addData);
                        }

                        if (response.code === 200) {
                            ElMessage.success(this.isEdit ? '更新成功' : '添加成功');
                            this.closeDialog();
                            this.loadData(); // 刷新表格
                        } else {
                            ElMessage.error(response.message || '操作失败');
                        }
                    } catch (e) {
                        ElMessage.error(e.message || '操作失败');
                    }
                } else {
                    // 表单校验失败
                    return false;
                }
            });
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
    display: flex;
    align-items: center;
}
.el-icon {
    margin-right: 6px;
}
</style>