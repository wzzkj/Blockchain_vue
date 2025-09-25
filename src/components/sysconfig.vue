<template>
    <div class="sys-config-container">

      <el-alert 
            title="系统配置谨慎修改" 
            type="primary"
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
            <el-table-column prop="configName" label="配置名" min-width="200" />
            <el-table-column label="配置值详情" min-width="400">
                <template #default="{ row }">
                    <el-descriptions
                        v-if="row.configValue && Object.keys(row.configValue).length > 0"
                        class="config-descriptions"
                        :column="1"
                        size="small"
                        border
                    >
                        <!-- 
                            --- 关键修改点 ---
                            将 :label="key" 修改为 :label="translateKey(key)"
                            这样每个配置键都会经过我们的翻译方法处理
                        -->
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
                                <el-input v-model="field.key" placeholder="键 (Key)"></el-input>
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
      // --- 新增点 1: 创建中英文映射字典 ---
      // 在这里集中管理所有的映射关系，方便维护和扩展
      keyMap: {
        'USDT-STY': 'USDT转STY汇率',
        'VIP_PRICE':'VIP价格',
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
    // --- 新增点 2: 创建翻译方法 ---
    /**
     * 根据 keyMap 翻译配置键
     * @param {string} key - 原始的英文配置键
     * @returns {string} - 翻译后的中文名，如果未找到则返回原键
     */
    translateKey(key) {
        return this.keyMap[key] || key;
    },

    formatJson(jsonObj) {
        if (typeof jsonObj !== 'object' || jsonObj === null) return String(jsonObj);
        return JSON.stringify(jsonObj, null, 2);
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
    
    // ... 其他方法保持不变 ...

    transformConfigValueForDisplay(jsonObj) {
        if (typeof jsonObj !== 'object' || jsonObj === null) {
            return [];
        }
        return Object.entries(jsonObj).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                return { key, value: JSON.stringify(value, null, 2) };
            }
            return { key, value: String(value) };
        });
    },

    formatValueForDisplay(value) {
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    },
    addField() {
        this.formModel.dynamicFields.push({ key: '', value: '' });
    },
    removeField(index) {
        this.formModel.dynamicFields.splice(index, 1);
    },

    handleCreate() {
        this.formModel = {
            id: null,
            configName: '',
            dynamicFields: [{ key: '', value: '' }]
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
                fields.push({ key: key, value: String(row.configValue[key]) });
            }
        }
        
        this.formModel = {
            id: row.id,
            configName: row.configName,
            dynamicFields: fields.length > 0 ? fields : [{ key: '', value: '' }]
        };

        this.dialogTitle = '编辑系统配置';
        this.dialogVisible = true;
        this.$nextTick(() => {
            this.$refs.configForm?.clearValidate();
        });
    },

    async handleDelete(row) {
        try {
            await ElMessageBox.confirm(
                `确定要删除配置 "${row.configName}" (ID: ${row.id}) 吗？`,
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
/* 样式部分无需改动，故省略 */
.sys-config-container {
    padding: 24px;
}
.toolbar {
    margin-bottom: 18px;
}
pre {
    margin: 0;
    font-family: Consolas, 'Courier New', monospace;
    white-space: pre-wrap;
    word-break: break-all;
}
.dynamic-field-row {
    margin-bottom: 10px;
}
.dynamic-field-row .el-col:last-child {
    text-align: right;
}
.popover-pre {
    margin: 0;
    font-family: Consolas, 'Courier New', monospace;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 13px;
}
</style>