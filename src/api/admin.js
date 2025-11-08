import http from './http' // 假设 http 模块在同级目录下

// 沿用之前的请求头配置，如果需要的话
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

/**
 * 管理员登录
 * @param {object} data 包含 username 和 password 的对象
 * @returns {Promise<any>} 返回后端接口的响应数据
 */
export async function adminLogin(data) {
  // data 的格式应该是: { username: 'your_username', password: 'your_password' }
  const response = await http.post('/api/admin/login', data, HDRS);
  return response.data;
}

/**
 * 检查管理员 Token 是否有效
 * @param {string} token 需要被校验的 token 字符串
 * @returns {Promise<any>} 返回后端接口的响应数据
 */
export async function checkAdminToken(token) {
  const data = { token: token };
  const response = await http.post('/api/admin/check', data, HDRS);
  return response.data;
}