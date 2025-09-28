/**
 * @file vipLevel.js 会员等级管理相关接口
 * @description 根据后端 VipLevelController.java 编写
 */

import http from './http' // 假设 http 模块封装了 axios 或 fetch

// 沿用项目统一的请求头配置
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

// --- 会员等级管理 (后台) ---

/**
 * (用户端) 查询所有已启用的会员等级列表
 * @returns {Promise<Result<VipLevel[]>>} 返回所有会员等级的列表
 * @see POST /api/vip/level/all
 */
export async function listAllVipLevels() {
  const response = await http.post('/api/vip/level/all', null, HDRS);
  return response.data;
}

/**
 * (管理端) 查询所有会员等级列表
 * @returns {Promise<Result2<VipLevel[]>>} 返回所有会员等级的列表
 * @see POST /api/vip/level/admin/all
 */
export async function listAllVipLevelsAdmin() {
  const response = await http.post('/api/vip/level/admin/all', null, HDRS);
  return response.data;
}

/**
 * 添加一个新的会员等级
 * @param {Omit<VipLevel, 'id' | 'createTime' | 'updateTime'>} levelData - 会员等级对象，不需要包含 id、创建时间和更新时间
 * @returns {Promise<Result2<null>>} 返回操作结果
 * @see POST /api/vip/level/add
 */
export async function addVipLevel(levelData) {
  const response = await http.post('/api/vip/level/add', levelData, HDRS);
  return response.data;
}

/**
 * 编辑更新一个已存在的会员等级
 * @param {Partial<VipLevel> & {id: number}} levelData - 需要更新的会员等级对象，必须包含 id
 * @returns {Promise<Result2<null>>} 返回操作结果
 * @see POST /api/vip/level/edit
 */
export async function updateVipLevel(levelData) {
  if (!levelData.id) {
    return Promise.reject(new Error("更新会员等级信息必须提供 id"));
  }
  const response = await http.post('/api/vip/level/edit', levelData, HDRS);
  return response.data;
}

/**
 * 根据 ID 删除一个会员等级
 * @param {number | string} levelId - 要删除的会员等级的 ID
 * @returns {Promise<Result2<null>>} 返回操作结果
 * @see POST /api/vip/level/delete/{id}
 */
export async function deleteVipLevel(levelId) {
  // @PathVariable 注解表示参数在 URL 路径中
  const response = await http.post(`/api/vip/level/delete/${levelId}`, null, HDRS);
  return response.data;
}

/*
// 后端返回的通用结果类型
interface Result<T> {
  code: number;
  message: string;
  data: T;
}
interface Result2<T> {
  code: number; 
  message: string;
  data: T;
}

// 会员等级实体 (对应 VipLevel.java)
interface VipLevel {
  id?: number;                  // 主键ID (可选，因为添加时不需要)
  levelWeight: number;          // 等级权重
  levelName: string;            // 等级名称
  levelIcon: string;            // 等级图标URL
  upgradeTeamKjPerformance: string; // 升级所需团队矿机产出总收益 (后端是String，前端也用string)
  feeGetRate: string;           // 当前等级获得的收益率 (后端是String)
  isEnabled: boolean;           // 是否启用
  createTime?: string;          // 创建时间 'yyyy-MM-dd HH:mm:ss' (可选)
  updateTime?: string;          // 更新时间 'yyyy-MM-dd HH:mm:ss' (可选)
}
*/