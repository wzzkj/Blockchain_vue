/**
 * @file 用户管理相关接口 (管理员)
 * @description 根据后端 UserController.java 中返回 Result2 的管理员接口编写
 */

import http from './http' // 假设 http 模块在同级目录下

// 沿用之前的请求头配置
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

// --- 管理员对用户的 CRUD 操作 ---

/**
 * (管理员) 根据用户 ID 删除用户
 * @param {number | string} userId - 要删除的用户的 ID
 * @returns {Promise<Result2<null>>} 返回操作结果
 * @see POST /api/user/admin/delete
 */
export async function deleteUserByAdmin(userId) {
  // 后端需要的是一个包含 id 的 User 对象，我们在前端封装，方便调用
  const response = await http.post('/api/user/admin/delete', { id: userId }, HDRS);
  return response.data;
}

/**
 * (管理员) 更新用户信息
 * @param {object} userData - 需要更新的用户对象，必须包含 id
 * @returns {Promise<Result2<User>>} 返回操作结果及更新后的用户信息
 * @see POST /api/user/admin/update (注意: 该接口在后端代码中与普通用户更新接口路径重复，此处假定为 /api/user/admin/update)
 */
export async function updateUserByAdmin(userData) {
  if (!userData.id) {
    return Promise.reject(new Error("更新用户信息必须提供 id"));
  }
  // 假设管理员更新接口的正确路径是 /admin/update
  const response = await http.post('/api/user/admin/update', userData, HDRS);
  return response.data;
}

/**
 * (管理员) 分页查询用户列表
 * @param {number} current - 当前页码
 * @param {number} size - 每页显示的条数
 * @returns {Promise<Result2<Page<User>>>} 返回分页后的用户列表数据
 * @see POST /api/user/admin/list
 */
export async function listUsersByAdmin(current, size) {
  const pageQuery = { current, size };
  const response = await http.post('/api/user/admin/list', pageQuery, HDRS);
  return response.data;
}

// --- 管理员专属功能接口 ---

/**
 * (管理员) 修改指定用户的二级密码
 * @param {object} passwordData - 包含用户ID和新密码的对象
 * @param {number | string} passwordData.userId - 目标用户的ID
 * @param {string} passwordData.newPassword - 新的二级密码
 * @returns {Promise<Result2<string>>} 返回操作结果
 * @see POST /api/user/admin/update/paswad
 * @description 注意：后端代码实现可能存在歧义，它调用了`userService.updateTwoPasswordByUserId(StpUtil.getLoginIdAsLong(), u)`，这通常是修改当前登录者（即管理员自己）的密码。此处前端实现假定其意图是修改指定用户的密码，因此`UpdateTwoPasswordDto`中应包含`userId`字段。
 */
export async function updateUserPasswordByAdmin(passwordData) {
   if (!passwordData || !passwordData.userId || !passwordData.newPassword) {
    return Promise.reject(new Error("必须提供用户ID和新密码"));
  }
  const response = await http.post('/api/user/admin/update/paswad', passwordData, HDRS);
  return response.data;
}

/**
 * (管理员) 获取系统手续费率
 * @returns {Promise<Result2<number>>} 返回手续费率
 * @see POST /api/user/admin/get/free
 */
export async function getFeeRateByAdmin() {
  const response = await http.post('/api/user/admin/get/free', null, HDRS);
  return response.data;
}

/**
 * (管理员) 根据用户ID获取其团队和资产的统计数据
 * @param {number | string} userId - 目标用户的 ID
 * @returns {Promise<Result2<UserStatsDTO>>} 返回包含多项统计数据的对象
 * @see POST /api/user/admin/get/count/{userId}
 */
export async function getUserStatsByAdmin(userId) {
  const response = await http.post(`/api/user/admin/get/count/${userId}`, null, HDRS);
  return response.data;
}


/**
 * @description 根据用户ID获取单个用户的完整信息
 * @param {number} userId - 用户的ID
 * @returns {Promise} - 返回包含用户完整信息的 Promise
 */
export async function getUserByIdForAdmin(userId) {
  const response = await http.post(`/api/user/admin/user/by-id/${userId}`, null, HDRS);
  return response.data;
}



// --- 类型定义 (TypeScript, 用于参考) ---
/*
// 后端返回的管理员通用结果类型
interface Result2<T> {
  code: number;
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

// 用户实体 (对应 User.java)
interface User {
  id: number;
  uuid: string;
  keyField: string;
  walletAddressId: number;
  uid: string;
  balance: string; // 使用字符串以保持精度
  invitationCodeId: string;
  upInvitationCode: string;
  // twoPassword 在JSON中被忽略
  upTeamId: number;
  teamId: number;
  userTeamKjYesterdayIncome: string;
  userSumIncomeKj: string;
  userKjYesterdayIncome: string;
  YesterdayReward: string;
  registrationTime: string; // 'yyyy-MM-dd HH:mm:ss'
  updateTime: string; // 'yyyy-MM-dd HH:mm:ss'
  resignCount: number;
}

// 管理员获取的用户统计数据 DTO
interface UserStatsDTO {
  "直推人数": number;
  "间推人数": number;
  "三代人数": number;
  "个人团队总人数": number;
  "个人矿机数量(有效期)": string;
  "个人理财产品数量(有效期)": string;
}

// 管理员更新用户二级密码 DTO (推断)
interface UpdateUserPasswordAdminDTO {
    userId: number;
    newPassword: string;
    // 根据后端 DTO 可能还包含 oldPassword 或 confirmPassword
}
*/