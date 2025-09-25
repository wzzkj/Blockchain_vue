/**
 * @file 用户平台资金流水相关接口
 * @description 根据后端 UserPlatformFlowController.java 编写
 */

import http from './http' // 假设 http 模块在同级目录下

// 沿用之前的请求头配置，如果需要的话
// 注意：Sa-Token 通常通过 'Authorization' 或自定义 Token 名称的请求头来传递令牌
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

/**
 * 获取当前登录用户的平台资金流水记录
 * @description 根据类型查询充值或提现记录
 * @param {'recharge' | 'withdrawal'} type - 查询类型, 'recharge' (充值) 或 'withdrawal' (提现)
 * @returns {Promise<Result<UserPlatformFlow[]>>} 返回一个包含资金流水对象数组的 Result 对象
 * @see POST /api/UserPlatformFlow/select/{type}
 */
export async function getUserPlatformFlow(type) {
  // 在调用前进行简单的参数校验，增强代码健壮性
  if (type !== 'recharge' && type !== 'withdrawal') {
    return Promise.reject(new Error("无效的查询类型，请使用 'recharge' 或 'withdrawal'"));
  }
  const response = await http.post(`/api/UserPlatformFlow/select/${type}`, null, HDRS);
  // 后端返回 Result 类型的 JSON 字符串，http 客户端通常会自动解析
  // response.data 的预期结构: { code: number, message: string, data: UserPlatformFlow[] }
  return response.data;
}

/**
 * 【管理员】查询所有用户的平台资金流水
 * @description 需要管理员权限。获取系统中所有用户的资金流水。
 * @returns {Promise<Result2<UserPlatformFlow[]>>} 返回一个包含所有资金流水对象数组的 Result2 对象
 * @see GET /api/UserPlatformFlow/selectAll
 */
export async function getAllUserPlatformFlow() {
  // 注意：后端接口方法为 GetMapping，因此前端应使用 http.get
  const response = await http.get('/api/UserPlatformFlow/selectAll', HDRS);
  // response.data 的预期结构: { code: number, message: string, data: UserPlatformFlow[] }
  return response.data;
}

/**
 * 根据动态条件查询用户资金流水
 * @description 如果不传入任何参数，则查询所有数据。
 * @param {object} [queryDTO={}] - 查询条件 DTO 对象
 * @param {number} [queryDTO.userId] - 用户ID
 * @param {string} [queryDTO.userWalletAddress] - 用户钱包地址
 * @param {string} [queryDTO.transactionOrderId] - 交易订单ID
 * @param {string} [queryDTO.transactionType] - 交易类型 (例如: 'DEPOSIT', 'WITHDRAWAL')
 * @param {string} [queryDTO.fundType] - 资金类型 (例如: 'INCOME', 'EXPENSE')
 * @param {string} [queryDTO.startTime] - 查询开始时间 (格式: 'yyyy-MM-dd HH:mm:ss')
 * @param {string} [queryDTO.endTime] - 查询结束时间 (格式: 'yyyy-MM-dd HH:mm:ss')
 * @returns {Promise<Result2<UserPlatformFlow[]>>} 返回一个包含符合条件的资金流水对象数组的 Result2 对象
 * @see POST /api/UserPlatformFlow/search
 */
export async function searchUserPlatformFlow(queryDTO = {}) {
  const response = await http.post('/api/UserPlatformFlow/search', queryDTO, HDRS);
  // response.data 的预期结构: { code: number, message: string, data: UserPlatformFlow[] }
  return response.data;
}

// --- 类型定义 (TypeScript, 用于参考) ---
/*
// 后端返回的通用结果类型
interface Result<T> {
  code: number;200成功/400失败
  message: string;
  data: T;
}

interface Result2<T> {
  code: number;
  msg: string;
  data: T;
}

// 用户平台资金流水对象类型 (对应 UserPlatformFlow.java)
interface UserPlatformFlow {
  id: number;
  userId: number;
  userWalletAddress: string;
  transactionOrderId: string;
  txId: string;
  transactionType: string; // 'PURCHASE', 'DEPOSIT', 'WITHDRAWAL', 'EXCHANGE' 等
  amount: string;
  remark: string;
  fundType: string; // 'INCOME', 'EXPENSE'
  balanceBefore: string;
  balanceAfter: string;
  transactionTime: string; // 'yyyy-MM-dd HH:mm:ss'
}
*/