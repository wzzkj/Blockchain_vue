<template>
    <div class="content-config-container">
        <!-- 页面头部和操作区 -->
        <div class="header-toolbar">
            <el-button 
                type="primary" 
                @click="submitForm" 
                :loading="loading"
            >
                保存配置
            </el-button>
        </div>

        <el-alert 
            title="提示" 
            type="info"
            description="请谨慎修改。首次加载时后台会自动创建默认配置。" 
            show-icon 
            :closable="false" 
            style="margin-bottom: 20px;"
        />

        <!-- 配置项编辑区 -->
        <div class="config-editor-area" v-loading="loading">
            <el-tabs v-model="activeTab" type="border-card">
                <el-tab-pane label="公司简介" name="companyProfile">
                    <wangeditor v-model="formModel.companyProfile" />
                </el-tab-pane>

                <el-tab-pane label="STY介绍" name="styIntroduction">
                    <wangeditor v-model="formModel.styIntroduction" />
                </el-tab-pane>

                <el-tab-pane label="未来生态" name="futureEcosystem">
                    <wangeditor v-model="formModel.futureEcosystem" />
                </el-tab-pane>

                <el-tab-pane label="币种共识" name="tokenConsensus">
                    <wangeditor v-model="formModel.tokenConsensus" />
                </el-tab-pane>

                <el-tab-pane label="矿机玩法" name="minerGameplayGuide">
                    <wangeditor v-model="formModel.minerGameplayGuide" />
                </el-tab-pane>

                <el-tab-pane label="收益详情" name="earningsDetails">
                    <wangeditor v-model="formModel.earningsDetails" />
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>

<script>
// 1. 引入你的 API 调用函数 和 编辑器组件
import { getContentConfig, updateContentConfig } from '../api/contentConfig'; // 请确保路径正确
import wangeditor from './wangeditor.vue'; // 请确保路径正确
import { ElMessage } from 'element-plus';

export default {
    name: 'ContentConfig',
    components: {
        wangeditor
    },
    data() {
        return {
            loading: false, // 控制加载状态
            activeTab: 'companyProfile', // 默认选中的标签页
            // 表单数据模型，字段与后端 ContentConfig 实体类对应
            formModel: {
                id: null,
                companyProfile: '',
                styIntroduction: '',
                futureEcosystem: '',
                tokenConsensus: '',
                minerGameplayGuide: '',
                earningsDetails: '',
                // createTime 和 updateTime 由后端管理，前端无需提交
            }
        };
    },
    methods: {
        /**
         * 加载内容配置
         */
        async loadConfig() {
            this.loading = true;
            try {
                const res = await getContentConfig();
                console.log('loadConfig response:', res);
                // 后端返回 Result 类型，code为200且data有值则成功
                if (res.code === 200 && res.data) {
                    this.formModel = res.data;
                    ElMessage.success('配置加载成功！');
                } else {
                    // 即使code为200，data也可能为null（比如后端逻辑问题），需要处理
                    ElMessage.error(res.msg || '加载配置失败，数据为空');
                }
            } catch (e) {
                ElMessage.error(e.message || '网络请求失败，请检查网络');
            } finally {
                this.loading = false;
            }
        },

        /**
         * 提交表单，更新配置
         */
        async submitForm() {
            this.loading = true;
            try {
                // 调用更新接口，传入整个 formModel 对象
                // formModel 中包含了 loadConfig 时获取到的 id
                const res = await updateContentConfig(this.formModel);
                
                // 后端返回 Result2 类型，code为200且data为true则成功
                if (res.code === 200 && res.data === true) {
                    ElMessage.success('配置保存成功！');
                    // 保存成功后可以重新加载一次数据，以获取最新的更新时间等信息
                    await this.loadConfig();
                } else {
                    ElMessage.error(res.msg || '保存失败');
                }
            } catch (e) {
                ElMessage.error(e.message || '网络请求失败，请检查网络');
            } finally {
                this.loading = false;
            }
        }
    },
    /**
     * 在组件挂载完成后，立即执行加载配置的操作
     */
    mounted() {
        this.loadConfig();
    }
}
</script>

<style scoped>
.content-config-container {
    padding: 24px;
}

.header-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-title {
    margin: 0;
    font-size: 22px;
}

/* 确保富文本编辑器在 Tabs 内正确显示 */
.el-tab-pane {
    min-height: 400px; /* 给编辑器一个最小高度，防止塌陷 */
}
</style>