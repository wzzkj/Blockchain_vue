/**
 * @file 团队相关接口
 * @description 根据后端 TeamController.java 编写
 */

import http from './http' // 假设 http 模块在同级目录下

// 沿用之前的请求头配置
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

// --- 基础 CRUD 操作 ---

/**
 * 添加团队成员信息
 * @param {object} teamData - 团队对象，通常至少包含 userId, upUserId, parentId 等
 * @returns {Promise<Result<Team>>} 返回操作结果及添加后的团队信息
 * @see POST /api/team/add
 */
export async function addTeam(teamData) {
  const response = await http.post('/api/team/add', teamData, HDRS);
  return response.data;
}

/**
 * 根据 ID 删除团队信息
 * @param {number | string} teamId - 要删除的团队记录的 ID
 * @returns {Promise<Result<null>>} 返回操作结果
 * @see POST /api/team/delete
 */
export async function deleteTeam(teamId) {
  // 后端需要的是一个包含 id 的 Team 对象，我们在前端封装一下，让调用更便捷
  const response = await http.post('/api/team/delete', { id: teamId }, HDRS);
  return response.data;
}

/**
 * 更新团队信息
 * @param {object} teamData - 需要更新的团队对象，必须包含 id
 * @returns {Promise<Result<Team>>} 返回操作结果及更新后的团队信息
 * @see POST /api/team/update
 */
export async function updateTeam(teamData) {
  if (!teamData.id) {
    return Promise.reject(new Error("更新团队信息必须提供 id"));
  }
  const response = await http.post('/api/team/update', teamData, HDRS);
  return response.data;
}

/**
 * 根据 ID 获取单个团队的详细信息
 * @param {number | string} teamId - 团队记录的 ID
 * @returns {Promise<Result<Team>>} 返回包含团队详细信息的 Result 对象
 * @see POST /api/team/get
 */
export async function getTeamById(teamId) {
  // 同样，为了调用方便，我们只传递 id
  const response = await http.post('/api/team/get', { id: teamId }, HDRS);
  return response.data;
}

/**
 * 分页查询团队列表
 * @param {number} current - 当前页码
 * @param {number} size - 每页显示的条数
 * @returns {Promise<Result<Page<Team>>>} 返回分页后的团队列表数据
 * @see POST /api/team/list
 */
export async function listTeamsByPage(current, size) {
  // 后端需要 Mybatis-Plus 的 Page 对象格式
  const pageQuery = { current, size };
  const response = await http.post('/api/team/list', pageQuery, HDRS);
  return response.data;
}

// --- 针对当前登录用户的接口 ---

/**
 * 获取当前登录用户的整个团队列表 (不含收益计算)
 * @returns {Promise<Result<Team[]>>} 返回当前用户的所有团队成员列表
 * @see POST /api/team/all
 */
export async function getCurrentUserTeamList() {
  const response = await http.post('/api/team/all', null, HDRS);
  return response.data;
}

/**
 * 获取当前登录用户的整个团队列表 (包含团队收益计算)
 * @returns {Promise<Result<any>>} 返回计算后的团队数据
 * @see POST /api/team/all/sum
 */
export async function getCurrentUserTeamListWithSum() {
  const response = await http.post('/api/team/all/sum', null, HDRS);
  return response.data;
}

/**
 * 获取当前登录用户的团队概览信息
 * @description 包含团队统计数据 (如总收益、总人数) 和详细的成员列表
 * @returns {Promise<Result<TeamOverviewDTO>>} 返回团队概览数据对象
 * @see POST /api/team/members/all
 */
export async function getTeamOverview() {
  const response = await http.post('/api/team/members/all', null, HDRS);
  return response.data;
}

// --- 其他查询接口 ---

/**
 * 通过钱包地址查询其所有下级成员
 * @param {string} walletAddress - 用户的钱包地址
 * @returns {Promise<Result2<TeamMemberDTO[]>>} 返回下级成员列表
 * @see POST /api/team/by-wallet
 */
export async function getSubordinatesByWallet(walletAddress) {
  const response = await http.post('/api/team/by-wallet', { walletAddress }, HDRS);
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

// 团队实体 (对应 Team.java)
interface Team {
  id: number;
  uuid: string;
  uid: string;
  keyField: string;
  userId: number;
  upUserId: number;
  parentId: number;
  invitationCode: string;
  upInvitationCode: string;
  creatTime: string; // 'yyyy-MM-dd HH:mm:ss'
  updateTime: string; // 'yyyy-MM-dd HH:mm:ss'
}

// 团队成员信息 DTO (对应 TeamMemberDTO.java)
interface TeamMemberDTO {
  userId: number;
  walletAddress: string;
  relation: '直推' | '间推';
}

// 团队概览 DTO (对应 TeamOverviewDTO.java)
interface TeamOverviewDTO {
  teamIncome: number;
  teamSize: number;
  calculationDate: string; // 'yyyy-MM-dd'
  directPush: number;
  intervalPush: number;
  teamAllBuyKjTotalAmount: string;
  userTeamKjYesterdayIncome: string;
  userSumIncomeKj: string;
  userKjYesterdayIncome: string;
  teamMembers: TeamMemberDTO[];
}
*/