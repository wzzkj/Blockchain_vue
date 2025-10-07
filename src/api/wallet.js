/**
 * @file wallet.js 钱包管理相关接口
 * @description 根据后端 WalletController.java 编写
 */

import http from './http' // 假设 http 模块封装了 axios 或 fetch

// 沿用项目统一的请求头配置
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

// --- 钱包管理 ---

/**
 * 添加一个新的钱包
 * @param {Omit<Wallet, 'id' | 'creatTime' | 'updateTime'>} walletData - 钱包对象，不需要包含 id、创建和更新时间
 * @returns {Promise<Result<Wallet>>} 返回操作结果，成功时 data 包含创建的钱包信息
 * @see POST /api/wallet/add
 */
export async function addWallet(walletData) {
  const response = await http.post('/api/wallet/add', walletData, HDRS);
  return response.data;
}

/**
 * 根据 ID 删除一个钱包
 * @param {number | string} walletId - 要删除的钱包的 ID
 * @returns {Promise<Result<null>>} 返回操作结果
 * @see POST /api/wallet/delete
 */
export async function deleteWallet(walletId) {
  // 后端 @RequestBody 需要一个包含 id 的 Wallet 对象
  const response = await http.post('/api/wallet/delete', { id: walletId }, HDRS);
  return response.data;
}

/**
 * 更新一个已存在的钱包信息
 * @param {Partial<Wallet> & {id: number}>} walletData - 需要更新的钱包对象，必须包含 id
 * @returns {Promise<Result<Wallet>>} 返回操作结果，成功时 data 包含更新后的钱包信息
 * @see POST /api/wallet/update
 */
export async function updateWallet(walletData) {
  if (!walletData.id) {
    return Promise.reject(new Error("更新钱包信息必须提供 id"));
  }
  const response = await http.post('/api/wallet/update', walletData, HDRS);
  return response.data;
}

/**
 * 根据 ID 获取单个钱包的详细信息
 * @param {number | string} walletId - 要查询的钱包的 ID
 * @returns {Promise<Result<Wallet>>} 返回查询到的钱包信息
 * @see POST /api/wallet/get
 */
export async function getWalletById(walletId) {
  // 后端 @RequestBody 需要一个包含 id 的 Wallet 对象
  const response = await http.post('/api/wallet/get', { id: walletId }, HDRS);
  return response.data;
}

/**
 * 分页查询钱包列表
 * @param {Page<Wallet>} pageConfig - 分页配置，例如 { current: 1, size: 10 }
 * @returns {Promise<Result<Page<Wallet>>>} 返回分页查询结果
 * @see POST /api/wallet/list
 */
export async function listWallets(pageConfig) {
  const response = await http.post('/api/wallet/list', pageConfig, HDRS);
  return response.data;
}

/**
 * (用户端) 根据钱包 ID 获取钱包信息
 * @description 后端方法名为 selectByUserId，但 Controller 的 @PathVariable 是钱包的 Id，这里遵循 URL 结构
 * @param {number | string} walletId - 钱包的 ID
 * @returns {Promise<Result<Wallet>>} 返回查询到的钱包信息
 * @see POST /api/wallet/by-id/{Id}
 */
export async function getWalletByIdForUser(walletId) {
  // @PathVariable 注解表示参数在 URL 路径中，请求体为 null
  const response = await http.post(`/api/wallet/by-id/${walletId}`, null, HDRS);
  return response.data;
}

/**
 * (管理端) 根据钱包 ID 获取钱包信息
 * @description 后端方法名为 selectByUserId，但 Controller 的 @PathVariable 是钱包的 Id，这里遵循 URL 结构
 * @param {number | string} walletId - 钱包的 ID
 * @returns {Promise<Result2<Wallet>>} 返回查询到的钱包信息
 * @see POST /api/wallet/by-id/admin/{Id}
 */
export async function getWalletByIdForAdmin(walletId) {
  // @PathVariable 注解表示参数在 URL 路径中，请求体为 null
  const response = await http.post(`/api/wallet/by-id/admin/${walletId}`, null, HDRS);
  return response.data;
}


/*
// --- 以下为数据结构定义 (TypeScript/JSDoc) ---

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

// 分页对象 (对应 MybatisPlus 的 Page)
interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 钱包实体 (对应 Wallet.java)
interface Wallet {
  id?: number;                  // 主键ID (可选)
  uuid: string;                 // UUID，用于生成IV
  keyField: string;             // 密钥字段，存储加密后的20位随机字符串
  userWalletAddress?: string;   // 用户钱包地址 (可选)
  uid: string;                  // 用户ID
  creatTime?: string;           // 创建时间 'yyyy-MM-dd HH:mm:ss' (可选)
  updateTime?: string;          // 更新时间 'yyyy-MM-dd HH:mm:ss' (可选)
}
*/