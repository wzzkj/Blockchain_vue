/**
 * @file 用户提现审批相关接口
 * @description 根据后端 UserWithdrawalReviewController.java (重构后) 编写
 */

import http from './http' // 假设 http 模块封装了axios或fetch

// 假设提现审批接口也需要类似的测试账户头，如果不需要可以移除
// 如果有统一的认证（如 Bearer Token），http 模块的请求拦截器应自动处理
import { HDRS } from './apiConfig';

// --- 用户提现审批接口 ---

/**
 * 分页查询提现审批列表
 * @param {ReviewListRequest} queryParams - 查询参数对象, 对应后端的 ReviewListRequestDTO
 * @returns {Promise<Result<Page<UserWithdrawalReview>>>} 返回包含分页数据的 Result 对象
 * @see POST /api/user/withdrawal/review/list
 */
export async function getReviewList(queryParams) {
  // 后端已重构为 @RequestBody，此处的调用方式是正确的
  const response = await http.post('/api/user/withdrawal/review/list', queryParams, HDRS);
  return response.data;
}

/**
 * 更新提现审批的状态
 * @param {UpdateStatusRequest} updatePayload - 包含 ID 和目标状态的对象, 对应后端的 UpdateStatusRequestDTO
 * @returns {Promise<Result<string>>} 返回操作结果
 * @see POST /api/user/withdrawal/review/update-status
 */
export async function updateReviewStatus(updatePayload) {
  // 后端接口已重构，id 和 status 都通过请求体传递
  if (!updatePayload.id || updatePayload.status === undefined || updatePayload.status === null) {
      return Promise.reject(new Error("更新状态必须提供 id 和 status"));
  }
  const response = await http.post(`/api/user/withdrawal/review/update-status`, updatePayload, HDRS);
  return response.data;
}

/**
 * 删除提现审批记录
 * @param {number | string} id - 要删除的审批记录的 ID
 * @returns {Promise<Result<string>>} 返回操作结果
 * @see POST /api/user/withdrawal/review/delete/{id}
 */
export async function deleteReview(id) {
  // 该接口设计未变，依然使用路径参数，是合理的 RESTful 实践
  const response = await http.post(`/api/user/withdrawal/review/delete/${id}`, null, HDRS);
  return response.data;
}

/**
 * 编辑审批数据（如修改金额、备注等）
 * @param {EditReviewRequest} editPayload - 包含 ID 和待更新字段的审批对象, 对应后端的 EditReviewRequestDTO
 * @returns {Promise<Result<string>>} 返回操作结果
 * @see POST /api/user/withdrawal/review/edit
 */
export async function editReview(editPayload) {
  if (!editPayload.id) {
    return Promise.reject(new Error("更新审批信息必须提供 id"));
  }
  const response = await http.post('/api/user/withdrawal/review/edit', editPayload, HDRS);
  return response.data;
}

/**
 * 用户提交新的提现申请
 * @param {AddReviewRequest} addPayload - 提现申请信息, 对应后端的 AddReviewRequestDTO
 * @returns {Promise<Result<string>>} 返回操作结果
 * @see POST /api/user/withdrawal/review/add
 */
export async function addReview(addPayload) {
  const response = await http.post('/api/user/withdrawal/review/add', addPayload, HDRS);
  return response.data;
}


// --- 类型定义 (TypeScript, 用于参考和前端开发) ---
/*
// 后端返回的通用结果类型
interface Result<T> {
  code: number; // 或者 success: boolean, message: string
  message: string;
  data: T;
}

// Mybatis-Plus 分页对象
interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// --- 请求 DTO 的类型定义 ---

// 对应 ReviewListRequestDTO.java
interface ReviewListRequest {
  currentPage?: number;
  pageSize?: number;
  status?: number; // 审批状态 (可选)
}

// 对应 UpdateStatusRequestDTO.java
interface UpdateStatusRequest {
  id: number | string;
  status: number;
}

// 对应 EditReviewRequestDTO.java
interface EditReviewRequest {
  id: number | string;
  amount?: number; // 假设金额可编辑
  remarks?: string; // 假设备注可编辑
}

// 对应 AddReviewRequestDTO.java
interface AddReviewRequest {
  userId: number;
  amount: number;
  walletAddress: string;
  coinType: string;
}


// --- 响应数据的实体类型定义 ---

// 用户提现审核实体 (对应 UserWithdrawalReview.java)
interface UserWithdrawalReview {
  id?: number | string;
  orderId: number;
  userId: number;
  withdrawalAmount: number; // 注意前端处理 BigInt 或高精度数字库
  status: 0 | 1 | 2 | 3 | 4 | 5; // 0:待审核, 1:通过, 2:不通过, 3:打款中, 4:成功, 5:失败
  userWalletAddress: string;
  requestTime?: string; // 'YYYY-MM-DD HH:mm:ss'
  reviewTime?: string;  // 'YYYY-MM-DD HH:mm:ss'
  reviewerId?: number;
  // ... 其他实体字段
}
*/