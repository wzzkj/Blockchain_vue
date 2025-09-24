import http from './http'

// 假设沿用之前的请求头配置
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

/**
 * 添加动态理财产品
 * POST /api/dynamic-product/add
 * @param {object} product - 动态理财产品对象，不含id
 */
export async function addProduct(product) {
  const response = await http.post('/api/dynamic-product/add', product, HDRS);
  // 后端返回 Result2 类型的 JSON 字符串，假设 http 库会自动解析
  return response.data; // 返回完整的 Result2 对象
}

/**
 * 根据ID删除动态理财产品
 * POST /api/dynamic-product/delete/{id}
 * @param {number | string} id - 产品的ID
 */
export async function deleteProduct(id) {
  const response = await http.post(`/api/dynamic-product/delete/${id}`, null, HDRS);
  return response.data; // 返回 Result2 对象
}

/**
 * 更新动态理财产品
 * POST /api/dynamic-product/update
 * @param {object} product - 动态理财产品对象，必须包含id
 */
export async function updateProduct(product) {
  const response = await http.post('/api/dynamic-product/update', product, HDRS);
  return response.data; // 返回 Result2 对象
}

/**
 * 获取所有动态理财产品列表
 * POST /api/dynamic-product/admin/all
 */
export async function listAllProductsAdmin() {
  const response = await http.post('/api/dynamic-product/admin/all', null, HDRS);
  return response.data; // 返回 Result2 对象，其 data 字段为产品列表
}