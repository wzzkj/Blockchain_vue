import http from './http' // 假设 http 模块在同级目录下

// 沿用之前的请求头配置，如果需要的话
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

/**
 * 获取内容配置
 * 业务上通常只有一个全局配置，所以不需要传参
 * POST /api/content-config/get
 */
export async function getContentConfig() {
  // 注意：后端getContentConfig()返回的是Result类型的JSON字符串，其data字段直接就是ContentConfig对象
  const response = await http.post('/api/content-config/admin/get', null, HDRS);
  console.log('getContentConfig raw response:', response);
  return response.data; // 返回完整的 Result 对象，例如 { code: 200, msg: 'success', data: { ... } }
}

/**
 * 更新内容配置
 * POST /api/content-config/update
 * @param {object} config - 内容配置对象，通常应包含id以进行更新
 */
export async function updateContentConfig(config) {
  const response = await http.post('/api/content-config/update', config, HDRS);
  // 后端返回 Result2 类型的 JSON 字符串
  return response.data; // 返回完整的 Result2 对象，例如 { code: 200, msg: 'success', data: true }
}


// --- 以下为后端标记为“不常用”或“不推荐”的接口，按需使用 ---

/**
 * 【不常用】根据ID获取内容配置
 * POST /api/content-config/by/id/{id}
 * @param {number | string} id - 配置的ID
 */
export async function getContentConfigById(id) {
  const response = await http.post(`/api/content-config/by/id/${id}`, null, HDRS);
  return response.data; // 返回 Result2 对象，其 data 字段为 ContentConfig 对象
}

/**
 * 【不常用】新增一条配置（一般业务场景下不需要）
 * POST /api/content-config/add
 * @param {object} config - 新的内容配置对象，不含id
 */
export async function addContentConfig(config) {
  const response = await http.post('/api/content-config/add', config, HDRS);
  return response.data; // 返回 Result2 对象，其 data 字段为 boolean
}

/**
 * 【非常不推荐】根据ID删除内容配置
 * POST /api/content-config/delete/{id}
 * @param {number | string} id - 要删除的配置的ID
 */
export async function deleteContentConfig(id) {
  const response = await http.post(`/api/content-config/delete/${id}`, null, HDRS);
  return response.data; // 返回 Result2 对象, 其 data 字段为 boolean 或 错误信息
}