import http from './http';
// 沿用之前的请求头配置
import { HDRS } from './apiConfig';

/**
 * ===========================================================================
 * 接口日志与统计分析 API
 * 对应后端控制器: AdminController
 * ===========================================================================
 */

/**
 * 获取系统所有原始操作日志(可以不需要)
 * 对应后端: POST /api/admin/sys-open-log/all
 * 
 * @returns {Promise<Array>} 返回 SysOperLog 对象数组
 */
export async function getSysOpenLog() {
  const response = await http.post('/api/admin/sys-open-log/all', null, HDRS);
  // 后端返回 Result2，日志列表在 data 字段中
  return response.data?.data || [];
}

/**
 * 获取日志统计分析报表（没有查询参数，默认查询7天）
 * 对应后端: POST /api/admin/sys-open-log/analysis
 * 
 * @param {object} params - 查询参数 (LogAnalysisRequestDTO)
 * @param {string} [params.startTime] - 开始时间 (例如: "2025-11-24 00:00:00")
 * @param {string} [params.endTime] - 结束时间 (例如: "2025-11-24 23:59:59")
 * 
 * @returns {Promise<object>} 返回 LogAnalysisResultVO 统计结构
 * 
 * 返回结构详解:
 * {
 *   totalRequests: number,       // 总请求数
 *   avgCostTime: number,         // 所有请求平均耗时(ms)
 *   errorCount: number,          // 错误(非200)请求数
 * 
 *   // 时间维度统计 (Key: 时间点字符串, Value: 请求数)
 *   requestsByDay: { [date: string]: number },
 *   requestsByHour: { [datetime: string]: number },
 *   requestsByMinute: { [datetime: string]: number },
 * 
 *   // 接口性能统计列表
 *   apiPerformance: [
 *     {
 *       uri: string,             // 接口地址
 *       requestCount: number,    // 请求次数
 *       avgCostTime: number,     // 平均耗时
 *       maxCostTime: number,     // 最大耗时
 *       minCostTime: number      // 最小耗时
 *     },
 *     ...
 *   ],
 * 
 *   // 用户行为统计 (最活跃的用户+接口组合)
 *   topActiveUsers: [
 *     {
 *       userWalletAddress: string, // 用户钱包地址
 *       username: string,          // 用户名
 *       uri: string,               // 访问接口地址
 *       count: number              // 访问次数
 *     },
 *     ...
 *   ],
 * 
 *   // 按小时的详情数据
 *   hourlyDetails: [
 *     {
 *       timeSlot: string,          // 时间点 (例如 "2025-11-24 15:00")
 *       totalRequestInSlot: number,// 该时间段总请求数
 *       // 该时间段下的用户行为列表
 *       userActions: [
 *         {
 *           userWalletAddress: string, // 钱包地址
 *           username: string,          // 用户名
 *           totalCount: number,        // 该用户在该时间段的总请求数
 *           // 该用户请求的具体接口详情
 *           apis: [
 *             {
 *               uri: string,           // 接口地址
 *               count: number,         // 请求次数
 *               avgCost: number,       // 平均耗时
 *               requestTimes: string[] // 该接口下的每一次具体请求时间 ["2025-11-24 15:28:54", ...]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export async function getSysOpenLogAnalysis(params = {}) {
  const response = await http.post('/api/admin/sys-open-log/analysis', params, HDRS);
  return response.data?.data || {};
}