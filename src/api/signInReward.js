/**
 * @file 连续签到奖励配置相关接口
 * @description 根据后端 ContinuousSignInRewardController.java 编写
 */

import http from './http' // 假设 http 模块封装了axios或fetch，并在同级目录下

// 沿用之前的请求头配置，如果需要登录token，http模块的请求拦截器通常会自动处理
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

// --- 1. 基本的增删改查 ---

/**
 * 添加一个新的签到奖励档位
 * @param {object} rewardData - 奖励规则对象, 对应 ContinuousSignInReward 实体
 * @returns {Promise<Result<null>>} 返回操作结果
 * @see POST /api/signInReward/admin/add
 */
export async function addReward(rewardData) {
  const response = await http.post('/api/signInReward/admin/add', rewardData, HDRS);
  return response.data;
}

/**
 * 编辑指定的签到奖励档位
 * @param {object} rewardData - 需要更新的奖励规则对象, 必须包含 id
 * @returns {Promise<Result<null>>} 返回操作结果
 * @see POST /api/signInReward/admin/edit
 */
export async function editReward(rewardData) {
  if (!rewardData.id) {
    return Promise.reject(new Error("更新奖励规则必须提供 id"));
  }
  const response = await http.post('/api/signInReward/admin/edit', rewardData, HDRS);
  return response.data;
}

/**
 * 根据 ID 删除指定的签到奖励档位
 * @param {number | string} rewardId - 要删除的奖励规则的 ID
 * @returns {Promise<Result<null>>} 返回操作结果
 * @see POST /api/signInReward/admin/delete/{id}
 */
export async function deleteReward(rewardId) {
  const response = await http.post(`/api/signInReward/admin/delete/${rewardId}`, null, HDRS);
  return response.data;
}

/**
 * 查询全部奖励规则 (不分页)
 * @returns {Promise<Result<ContinuousSignInReward[]>>} 返回所有奖励规则列表
 * @see POST /api/signInReward/admin/all
 */
export async function getAllRewards() {
    const response = await http.post('/api/signInReward/admin/all', null, HDRS);
    return response.data;
}

/**
 * 分页查询所有奖励规则
 * @param {object} pageQuery - 分页查询参数
 * @param {number} pageQuery.page - 当前页码
 * @param {number} pageQuery.size - 每页数量
 * @param {string} [pageQuery.keyword] - (可选) 按活动名称搜索的关键词
 * @returns {Promise<Result<Page<ContinuousSignInReward>>>} 返回分页后的奖励规则列表
 * @see POST /api/signInReward/admin/page
 */
export async function listRewardsByPage(pageQuery) {
    const response = await http.post('/api/signInReward/admin/page', pageQuery, HDRS);
    return response.data;
}


// --- 2. 查询所有开启的活动 ---

/**
 * 查询所有状态为“启用”的签到奖励规则
 * @returns {Promise<Result<ContinuousSignInReward[]>>} 返回所有启用的奖励规则列表
 * @see POST /api/signInReward/admin/all/enabled
 */
export async function getAllEnabledRewards() {
    const response = await http.post('/api/signInReward/admin/all/enabled', null, HDRS);
    return response.data;
}


// --- 3. 根据档位获取数据 ---

/**
 * 根据连续签到天数获取奖励规则
 * @param {number} days - 连续签到天数
 * @returns {Promise<Result<ContinuousSignInReward[]>>} 返回匹配该天数的所有奖励规则 (可能多个活动有相同天数档位)
 * @see POST /api/signInReward/admin/getByDays/{days}
 */
export async function getRewardByDays(days) {
    const response = await http.post(`/api/signInReward/admin/getByDays/${days}`, null, HDRS);
    return response.data;
}


// --- 4. 根据活动名称获取数据 ---

/**
 * 根据活动名称获取奖励规则 (模糊查询)
 * @param {string} activityName - 活动名称关键词
 * @returns {Promise<Result<ContinuousSignInReward[]>>} 返回所有名称匹配的奖励规则列表
 * @see POST /api/signInReward/admin/getByActivityName
 */
export async function getRewardsByActivityName(activityName) {
    // 后端 @RequestBody 接收 String, 前端直接将字符串作为 data 发送
    const response = await http.post('/api/signInReward/admin/getByActivityName', activityName, HDRS);
    return response.data;
}


// --- 类型定义 (TypeScript, 用于参考) ---
/*
// 后端返回的通用结果类型
interface Result<T> {
  code: number; // 通常是 200 或 1 表示成功
  message: string;
  data: T;
}

// Mybatis-Plus 分页对象 (简化版)
interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 连续签到奖励配置实体 (对应 ContinuousSignInReward.java)
interface ContinuousSignInReward {
  id?: number;
  activityName?: string;
  continuousDays?: number;
  rewardAmount?: number | string; // BigDecimal 在JSON中可能为string或number
  status?: 0 | 1; // 0-停用, 1-启用
  remark?: string;
  createTime?: string; // 'yyyy-MM-dd HH:mm:ss'
  updateTime?: string; // 'yyyy-MM-dd HH:mm:ss'
}

// 分页查询DTO
interface PageQuery {
    page: number;
    size: number;
    keyword?: string;
}
*/