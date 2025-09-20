import http from './http'

// 沿用之前的请求头配置
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

/**
 * 查询所有系统配置
 * POST /api/sys/config/list
 */
export async function listConfigs() {
  const response = await http.post('/api/sys/config/list', null, HDRS);
  // 后端返回的数据在 Result2 对象的 data 字段中
  return response.data?.data || [];
}

/**
 * 新增配置
 * POST /api/sys/config/add
 * @param {object} payload - SysConfig 对象，不含id
 */
export async function createConfig(payload) {
  const response = await http.post('/api/sys/config/add', payload, HDRS);
  return response.data; // 返回完整的 Result2 对象，方便判断成功或失败
}

/**
 * 更新配置
 * POST /api/sys/config/update
 * @param {object} payload - SysConfig 对象，必须包含id
 */
export async function updateConfig(payload) {
  const response = await http.post('/api/sys/config/update', payload, HDRS);
  return response.data;
}

/**
 * 根据ID删除配置
 * POST /api/sys/config/{id}
 * @param {number} id - 配置的ID
 */
export async function deleteConfig(id) {
  const response = await http.post(`/api/sys/config/${id}`, null, HDRS);
  return response.data;
}