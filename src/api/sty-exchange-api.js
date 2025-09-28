/**
 * @file STY 买卖池/交易所相关接口
 * @description 根据后端 STYExchangeController.java 编写
 */

import http from './http' // 假设 http 模块封装了axios或fetch，并在同级目录下

// 沿用之前的请求头配置，如果需要登录token，http模块的请求拦截器通常会自动处理
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

// --- 基础 CRUD 操作 ---

/**
 * 添加新的交易订单
 * @param {object} orderData - 订单对象，对应 STYExchange 实体类
 * @returns {Promise<Result<STYExchange>>} 返回操作结果及添加后的订单信息
 * @see POST /api/sty-exchange/add
 */
export async function addOrder(orderData) {
  const response = await http.post('/api/sty-exchange/add', orderData, HDRS);
  return response.data;
}

/**
 * 根据 ID 删除订单
 * @param {number | string} orderId - 要删除的订单记录的 ID
 * @returns {Promise<Result<null>>} 返回操作结果
 * @see POST /api/sty-exchange/delete
 */
export async function deleteOrder(orderId) {
  // 后端需要的是一个包含 id 的对象，我们在前端封装一下，让调用更便捷
  const response = await http.post('/api/sty-exchange/delete', { id: orderId }, HDRS);
  return response.data;
}

/**
 * 更新订单信息
 * @param {object} orderData - 需要更新的订单对象，必须包含 id
 * @returns {Promise<Result<STYExchange>>} 返回操作结果及更新后的订单信息
 * @see POST /api/sty-exchange/update
 */
export async function updateOrder(orderData) {
  if (!orderData.id) {
    return Promise.reject(new Error("更新订单信息必须提供 id"));
  }
  const response = await http.post('/api/sty-exchange/update', orderData, HDRS);
  return response.data;
}

/**
 * 根据 ID 获取单个订单的详细信息
 * @param {number | string} orderId - 订单记录的 ID
 * @returns {Promise<Result<STYExchange>>} 返回包含订单详细信息的 Result 对象
 * @see POST /api/sty-exchange/get
 */
export async function getOrderById(orderId) {
  // 同样，为了调用方便，我们只传递 id
  const response = await http.post('/api/sty-exchange/get', { id: orderId }, HDRS);
  return response.data;
}

/**
 * (管理员) 分页查询订单列表
 * @param {number} current - 当前页码
 * @param {number} size - 每页显示的条数
 * @returns {Promise<Result<Page<STYExchange>>>} 返回分页后的订单列表数据
 * @see POST /api/sty-exchange/list
 */
export async function listOrdersByPage(current) {
  // 后端需要 Mybatis-Plus 的 Page 对象格式
//   const pageQuery = { current};
  const response = await http.post('/api/sty-exchange/list', current, HDRS);
  return response.data;
}


// --- 针对特定用户的接口 ---

/**
 * 查询当前登录用户的全部订单列表 (旧接口，建议使用 my-orders)
 * @returns {Promise<Result<STYExchange[]>>} 返回当前用户的所有订单列表
 * @see POST /api/sty-exchange/all
 * @deprecated 建议使用 listMyOrders 接口
 */
export async function listCurrentUserOrders() {
  const response = await http.post('/api/sty-exchange/all', null, HDRS);
  return response.data;
}

/**
 * 查询当前登录用户的所有STY交易订单
 * @returns {Promise<Result<STYExchange[]>>} 返回当前用户的所有STY交易订单列表
 * @see POST /api/sty-exchange/my-orders
 */
export async function listMyOrders() {
    const response = await http.post('/api/sty-exchange/my-orders', null, HDRS);
    return response.data;
}

/**
 * 根据状态查询当前登录用户STY交易订单
 * @param {number} status - 订单状态 (0-待匹配, 1-已匹配/交易成功, 2-已取消)
 * @returns {Promise<Result<STYExchange[]>>} 返回符合状态的订单列表
 * @see POST /api/sty-exchange/my-orders/by-status
 */
export async function listMyOrdersByStatus(status) {
    // 后端使用 @RequestParam, 需要将参数放到请求的 params 中
    const config = { ...HDRS, params: { status } };
    const response = await http.post('/api/sty-exchange/my-orders/by-status', null, config);
    return response.data;
}

/**
 * 根据订单类型查询当前登录用户STY交易订单
 * @param {number} type - 订单类型 (1-买入STY, 2-卖出STY)
 * @returns {Promise<Result<STYExchange[]>>} 返回符合类型的订单列表
 * @see POST /api/sty-exchange/my-orders/by-type
 */
export async function listMyOrdersByType(type) {
    // 后端使用 @RequestParam, 需要将参数放到请求的 params 中
    const config = { ...HDRS, params: { type } };
    const response = await http.post('/api/sty-exchange/my-orders/by-type', null, config);
    return response.data;
}


// --- 公共数据查询接口 ---

/**
 * 获取所有交易池的数据 (对所有用户开放)
 * @returns {Promise<Result<STYExchange[]>>} 返回所有交易池的订单列表
 * @see POST /api/sty-exchange/get/all
 */
export async function getAllPublicOrders() {
    const response = await http.post('/api/sty-exchange/get/all', null, HDRS);
    return response.data;
}

/**
 * 获取所有交易池的数据 (管理员)
 * @returns {Promise<Result<STYExchange[]>>} 返回所有交易池的订单列表
 * @see POST /api/sty-exchange/get/admin/all
 */
export async function getAllAdminOrders() {
    const response = await http.post('/api/sty-exchange/get/admin/all', null, HDRS);
    return response.data;
}


// --- 类型定义 (TypeScript, 用于参考) ---
/*
// 后端返回的通用结果类型
interface Result<T> {
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

// STY 交易所订单实体 (对应 STYExchange.java)
interface STYExchange {
  id?: number;
  uuid?: string;
  keyField?: string;
  uid?: string;
  styPlacementId?: string;
  usdtPaymentId?: string;
  creatorId?: number;
  takerId?: number;
  orderType?: 1 | 2; // 1-买入STY, 2-卖出STY
  orderStatus?: 0 | 1 | 2 | 3; // 0-待匹配, 1-已匹配/交易成功, 2-已取消, 3-异常
  message?: string;
  exchangeRate?: string;
  styAmount?: string;
  usdtAmount?: string;
  tradingTrx?: string;
  tradingEnergy?: string;
  tradingBandwidth?: string;
  tradingStyAi?: string;
  txId?: string;
  createTime?: string; // 'yyyy-MM-dd HH:mm:ss'
  endTime?: string;   // 'yyyy-MM-dd HH:mm:ss'
}
*/