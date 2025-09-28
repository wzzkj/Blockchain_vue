<template>
    <div class="sys-config-container">

      <el-alert 
            title="系统配置谨慎修改" 
            type="error"
            description="非常重要的配置项，禁止删除 sys_config 配置，更改任何配置前请思考" 
            show-icon 
            :closable="false" 
            style="margin-bottom: 20px;"
        />
        <!-- 操作栏 -->
        <div class="toolbar">
            <el-button type="primary" @click="handleCreate">新增配置</el-button>
        </div>

        <!-- 表格主体 -->
        <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            
            <!-- 
                --- 关键修改点 1 ---
                将 prop="configName" 的直接显示，改为使用 template slot
                这样我们可以对配置名进行翻译
            -->
            <el-table-column label="配置名" min-width="200">
                <template #default="{ row }">
                    {{ translateKey(row.configName) }}
                </template>
            </el-table-column>

            <el-table-column label="配置值详情" min-width="400">
                <template #default="{ row }">
                    <el-descriptions
                        v-if="row.configValue && Object.keys(row.configValue).length > 0"
                        class="config-descriptions"
                        :column="1"
                        size="small"
                        border
                    >
                        <el-descriptions-item
                            v-for="(value, key) in row.configValue"
                            :key="key"
                            :label="translateKey(key)"
                        >
                            <pre class="description-value-pre">{{ formatValueForDisplay(value) }}</pre>
                        </el-descriptions-item>
                    </el-descriptions>
                    <span v-else>--</span>
                </template>
            </el-table-column>
            
            <el-table-column label="操作" fixed="right" width="180">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                    
                    <el-tooltip
                        effect="dark"
                        content="系统核心配置，禁止删除"
                        placement="top"
                        :disabled="row.configName !== 'sys_config'"
                    >
                        <span>
                            <el-button
                                link
                                type="danger"
                                size="small"
                                @click="handleDelete(row)"
                                :disabled="row.configName === 'sys_config'"
                            >
                                删除
                            </el-button>
                        </span>
                    </el-tooltip>
                </template>
            </el-table-column>
        </el-table>


        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="700px" top="5vh">
        <el-form ref="configForm" :model="formModel" :rules="formRules" label-width="100px">
            
            <el-form-item label="配置名" prop="configName">
                <el-tooltip
                    effect="dark"
                    content="配置名创建后不可修改"
                    placement="top"
                    :disabled="!formModel.id"
                >
                    <div style="width: 100%;">
                        <el-input
                            v-model="formModel.configName"
                            placeholder="请输入配置名"
                            :disabled="!!formModel.id"
                        ></el-input>
                    </div>
                </el-tooltip>
            </el-form-item>

            <!-- 动态键值对表单 -->
            <el-form-item label="配置值" prop="dynamicFields">
                <div v-for="(field, index) in formModel.dynamicFields" :key="index" class="dynamic-field-row">
                    <el-row :gutter="10">
                        <el-col :span="10">
                            <!-- 
                                --- 关键修改点 2 ---
                                对“键”输入框进行逻辑判断：
                                - 如果是已存在的字段，则禁用输入框，并显示其中文翻译，同时用 tooltip 显示原始 key
                                - 如果是新增的字段，则保持为可编辑的输入框
                            -->
                            <el-tooltip
                                v-if="field.isExisting"
                                effect="dark"
                                :content="`原始Key: ${field.key}`"
                                placement="top"
                            >
                                <el-input
                                    :value="translateKey(field.key)"
                                    disabled
                                />
                            </el-tooltip>
                            <el-input
                                v-else
                                v-model="field.key"
                                placeholder="键 (Key)"
                            ></el-input>
                        </el-col>
                        <el-col :span="10">
                            <el-input v-model="field.value" placeholder="值 (Value)"></el-input>
                        </el-col>
                        <el-col :span="4">
                            <el-button type="danger" @click="removeField(index)" link>删除</el-button>
                        </el-col>
                    </el-row>
                </div>
                 <el-button type="primary" @click="addField" link>+ 添加配置项</el-button>
            </el-form-item>

        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="cancelForm">取 消</el-button>
                <el-button type="primary" @click="submitForm">确 定</el-button>
            </div>
        </template>
    </el-dialog>

       
    </div>
</template>

<script>
import { listConfigs, createConfig, updateConfig, deleteConfig } from '../api/sysConfig';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'sys_config',
  data() {
    // 自定义动态字段校验器
    const validateDynamicFields = (rule, value, callback) => {
        if (!value || value.length === 0) {
            return callback(new Error('配置值至少需要一项'));
        }
        const keySet = new Set();
        for (let i = 0; i < value.length; i++) {
            const field = value[i];
            if (!field.key || field.key.trim() === '') {
                return callback(new Error(`第 ${i + 1} 项的“键”不能为空`));
            }
            if (keySet.has(field.key)) {
                return callback(new Error(`第 ${i + 1} 项的“键” (${field.key}) 重复`));
            }
            keySet.add(field.key);
        }
        callback(); // 所有项都通过
    };

    return {
      // --- 新增点 1: 扩展中英文映射字典 ---
      // 在这里集中管理所有的映射关系，方便维护和扩展
      keyMap: {
        // 配置组名 (configName) 的映射
        'sys_config': '系统核心配置',
        'user_config': '用户相关配置', // 举例
        'Backend_Address_Warning_Settings' : '后台地址报警设置',
        'VIP' : '会员',

        // 配置项键 (key) 的映射
        'USDT-STY': 'USDT转STY汇率',
        'VIP_PRICE':'VIP价格',
        'LEASE_ADDRESS':"能量租赁地址",
        'PLATFORM_RECEIVE_ADDRESS':"平台链上地址",
        'Withdrawal_fee_exchange_rate':"提现手续费汇率",
        'USDT_MIN':"后台最低USDT",
        'PROFIT_RATE':"手续费盈利",
        'TRX_TO_STY_RATE':"消耗TRX倍率",
        'PLATFORM_TRX_MIN':"平台TRX最低保有量",
        'Number_of_user_make_up_sign_ins':'用户补签次数'
      },
      loading: false,
      tableData: [],
      dialogVisible: false,
      dialogTitle: '',
      formModel: {
          id: null,
          configName: '',
          dynamicFields: []
      },
      formRules: {
          configName: [{ required: true, message: '配置名不能为空', trigger: 'blur' }],
          dynamicFields: [{ required: true, validator: validateDynamicFields, trigger: 'blur' }],
      }
    }
  },
  methods: {
    // --- 新增点 2: 创建翻译方法 (代码不变, 作用更广) ---
    /**
     * 根据 keyMap 翻译配置键或配置名
     * @param {string} key - 原始的英文标识符
     * @returns {string} - 翻译后的中文名，如果未找到则返回原标识符
     */
    translateKey(key) {
        return this.keyMap[key] || key;
    },

    formatValueForDisplay(value) {
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    },

    async loadConfigs() {
        this.loading = true;
        try {
            this.tableData = await listConfigs();
        } catch (e) {
            this.tableData = [];
            ElMessage.error(e.message || '数据加载失败');
        } finally {
            this.loading = false;
        }
    },
    
    addField() {
        // --- 关键修改点 3 ---
        // 新增的字段标记为 isExisting: false
        this.formModel.dynamicFields.push({ key: '', value: '', isExisting: false });
    },
    removeField(index) {
        this.formModel.dynamicFields.splice(index, 1);
    },

    handleCreate() {
        this.formModel = {
            id: null,
            configName: '',
            // --- 关键修改点 4 ---
            // 新增配置时，第一个字段也标记为 isExisting: false
            dynamicFields: [{ key: '', value: '', isExisting: false }]
        };
        this.dialogTitle = '新增系统配置';
        this.dialogVisible = true;
        this.$nextTick(() => {
            this.$refs.configForm?.clearValidate();
        });
    },

    handleEdit(row) {
        const fields = [];
        if (row.configValue && typeof row.configValue === 'object') {
            for (const key in row.configValue) {
                // --- 关键修改点 5 ---
                // 从现有配置加载字段时，标记 isExisting: true
                fields.push({ 
                    key: key, 
                    value: String(row.configValue[key]),
                    isExisting: true // 标记为已存在的字段
                });
            }
        }
        
        this.formModel = {
            id: row.id,
            configName: row.configName,
            dynamicFields: fields.length > 0 ? fields : [{ key: '', value: '', isExisting: false }]
        };

        this.dialogTitle = `编辑配置 - ${this.translateKey(row.configName)}`;
        this.dialogVisible = true;
        this.$nextTick(() => {
            this.$refs.configForm?.clearValidate();
        });
    },

    async handleDelete(row) {
        try {
            await ElMessageBox.confirm(
                `确定要删除配置 "${this.translateKey(row.configName)}" (ID: ${row.id}) 吗？`,
                '警告', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
            );
            const res = await deleteConfig(row.id);
            if (res.code === 200) {
                 ElMessage.success('删除成功！');
                 this.loadConfigs();
            } else {
                 ElMessage.error(res.message || '删除失败');
            }
        } catch (error) {
            if (error !== 'cancel') {
              ElMessage.error('操作取消或请求失败');
            }
        }
    },

    cancelForm() {
        this.dialogVisible = false;
    },

    submitForm() {
        // 提交逻辑无需任何修改，因为它依赖的是 field.key，我们始终保持了原始 key 的正确性
        this.$refs.configForm.validate(async (valid) => {
            if (valid) {
                const constructedJson = {};
                this.formModel.dynamicFields.forEach(field => {
                    let value = field.value;
                    if (!isNaN(value) && value.trim() !== '' && !isNaN(parseFloat(value))) {
                        value = Number(value);
                    } else if (value.toLowerCase() === 'true') {
                        value = true;
                    } else if (value.toLowerCase() === 'false') {
                        value = false;
                    } else if (value.toLowerCase() === 'null') {
                        value = null;
                    }
                    constructedJson[field.key] = value;
                });

                const payload = {
                    id: this.formModel.id,
                    configName: this.formModel.configName,
                    configValue: constructedJson
                };

                try {
                    let res;
                    if (payload.id) {
                        res = await updateConfig(payload);
                    } else {
                        res = await createConfig(payload);
                    }
                    
                    if (res.code === 200) {
                        ElMessage.success(res.message || '操作成功！');
                        this.dialogVisible = false;
                        this.loadConfigs();
                    } else {
                         ElMessage.error(res.message || '操作失败');
                    }
                } catch (e) {
                     ElMessage.error(e.message || '请求失败');
                }
            }
        });
    }
  },
  mounted() {
    this.loadConfigs();
  }
}
</script>

<style scoped>
.sys-config-container {
    padding: 24px;
}
.toolbar {
    margin-bottom: 18px;
}
.config-descriptions {
    /* 解决 el-descriptions 标签宽度不固定的问题 */
    --el-descriptions-item-label-width: 150px;
}
.description-value-pre {
    margin: 0;
    font-family: Consolas, 'Courier New', monospace;
    white-space: pre-wrap;
    word-break: break-all;
}
.dynamic-field-row {
    margin-bottom: 10px;
}
.dynamic-field-row:last-child {
    margin-bottom: 0;
}
.dynamic-field-row .el-col:last-child {
    text-align: right;
}
</style>