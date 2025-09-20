<template>
    <div class="sys-config-container">
        <el-alert title="系统配置谨慎修改" type="primary"
      description="非常重要的配置项，禁止删除 sys_config 配置，更改任何配置前请思考" closable
      show-icon />
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
                    <!-- 只有当 configValue 是一个有内容的 object 时才渲染描述列表 -->
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
                            :label="key"
                        >
                            <!-- 使用 pre 标签来优雅地处理长文本和多行文本 -->
                            <pre class="description-value-pre">{{ formatValueForDisplay(value) }}</pre>
                        </el-descriptions-item>
                    </el-descriptions>
                    <!-- 如果没有配置值，则显示横杠 -->
                    <span v-else>--</span>
                </template>
            </el-table-column>
            
            <el-table-column label="操作" fixed="right" width="180">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                    
                    <!-- 
                        --- 关键修改点 ---
                        使用 el-tooltip 包裹删除按钮，以提供提示信息。
                        el-tooltip 的 :disabled 属性控制提示是否显示。
                        el-button 的 :disabled 属性控制按钮是否可点击。
                     -->
                    <el-tooltip
                        effect="dark"
                        content="系统核心配置，禁止删除"
                        placement="top"
                        :disabled="row.configName !== 'sys_config'"
                    >
                        <!-- 
                            Tooltip 在包裹一个被禁用的组件时，需要一个外层元素（如此处的 span）来触发事件。
                            这是一个 Element Plus 的推荐做法。
                        -->
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
            
            <!-- --- 关键修改点在这里 --- -->
            <el-form-item label="配置名" prop="configName">
                <!-- 使用 Tooltip 提升用户体验 -->
                <el-tooltip
                    effect="dark"
                    content="配置名创建后不可修改"
                    placement="top"
                    :disabled="!formModel.id"
                >
                    <!-- 使用一个外层 div 包裹，确保 tooltip 在 input 禁用时也能触发 -->
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
                                <!-- 修改点 1: 使用文字按钮代替图标按钮 -->
                                <el-button type="danger" @click="removeField(index)" link>删除</el-button>
                            </el-col>
                        </el-row>
                    </div>
                     <!-- 修改点 2: 使用文本 '+' 代替图标 -->
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
// 修改点 3: 移除图标的导入和注册
// import { Plus, Minus } from '@element-plus/icons-vue';

export default {
  name: 'sys_config',
  // components: { // 移除 components 注册
  //     Plus,
  //     Minus
  // },
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

     /**
         * --- 新增辅助方法 ---
         * 将 JSON 对象转换为适用于表格展示的 Key-Value 数组
         * 例如，输入: { "host": "127.0.0.1", "port": 3306 }
         *      输出: [
         *              { key: "host", value: "127.0.0.1" },
         *              { key: "port", value: 3306 }
         *            ]
         */
        transformConfigValueForDisplay(jsonObj) {
            if (typeof jsonObj !== 'object' || jsonObj === null) {
                return [];
            }
            return Object.entries(jsonObj).map(([key, value]) => {
                // 对于对象或数组类型的值，转为JSON字符串显示，避免表格显示为 [object Object]
                if (typeof value === 'object' && value !== null) {
                    return { key, value: JSON.stringify(value, null, 2) };
                }
                // 其他类型直接返回值（转为字符串保证显示正常）
                return { key, value: String(value) };
            });
        },

        formatJson(jsonObj) {
            if (typeof jsonObj !== 'object' || jsonObj === null) return String(jsonObj);
            return JSON.stringify(jsonObj, null, 2);
        },

        formatValueForDisplay(value) {
        // 如果值本身是对象或数组，将其格式化为JSON字符串，以便阅读
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value, null, 2);
        }
        // 对于布尔值、数字等，直接转为字符串
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
                // 将后端返回的 boolean/number 类型也转为 string 以便在输入框中显示
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
                    // 尝试智能转换类型 (string -> number/boolean/null)
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
pre {
    margin: 0;
    font-family: Consolas, 'Courier New', monospace;
    white-space: pre-wrap;
    word-break: break-all;
}
.dynamic-field-row {
    margin-bottom: 10px;
}
/* 微调删除按钮的对齐 */
.dynamic-field-row .el-col:last-child {
    text-align: right;
}


/* --- 新增样式 --- */
/* 
   确保 Popover 内部表格的值可以正常换行，
   并且保持等宽字体的格式
*/
.popover-pre {
    margin: 0;
    font-family: Consolas, 'Courier New', monospace;
    white-space: pre-wrap;       /* 自动换行 */
    word-break: break-all;     /* 单词内换行 */
    font-size: 13px;             /* 字体稍小一点，更紧凑 */
}
</style>