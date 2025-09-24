import http from './http'

// 假设沿用之前的请求头配置
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

/**
 * 添加静态理财产品
 * POST /api/static-product/add
 * @param {object} product - 静态理财产品对象，不含id
 */
export async function addStaticProduct(product) {
  const response = await http.post('/api/static-product/add', product, HDRS);
  // 后端返回 Result2 类型的 JSON 字符串，假设 http 库会自动解析
  return response.data; // 返回完整的 Result2 对象
}

/**
 * 根据ID删除静态理财产品
 * POST /api/static-product/delete/{id}
 * @param {number | string} id - 产品的ID
 */
export async function deleteStaticProduct(id) {
  const response = await http.post(`/api/static-product/delete/${id}`, null, HDRS);
  return response.data; // 返回 Result2 对象
}

/**
 * 更新静态理财产品
 * POST /api/static-product/update
 * @param {object} product - 静态理财产品对象，必须包含id
 */
export async function updateStaticProduct(product) {
  const response = await http.post('/api/static-product/update', product, HDRS);
  return response.data; // 返回 Result2 对象
}

/**
 * 根据ID获取单个静态理财产品
 * POST /api/static-product/get
 * @param {number | string} id - 产品的ID
 */
export async function getStaticProductById(id) {
  // 后端接口需要一个包含 id 的 JSON 对象作为请求体
  const payload = { id: id };
  const response = await http.post('/api/static-product/get', payload, HDRS);
  return response.data; // 返回 Result 对象
}

/**
 * 分页查询静态理财产品列表
 * POST /api/static-product/list
 * @param {object} page - 分页参数，例如 { current: 1, size: 10 }
 */
export async function listStaticProducts(page) {
  const response = await http.post('/api/static-product/list', page, HDRS);
  return response.data; // 返回 Result 对象，其 data 字段为分页结果
}

/**
 * 获取所有静态理财产品列表 (普通用户)
 * POST /api/static-product/all
 */
export async function listAllStaticProducts() {
  const response = await http.post('/api/static-product/all', null, HDRS);
  return response.data; // 返回 Result 对象，其 data 字段为产品列表
}

/**
 * 获取所有静态理财产品列表 (管理员)
 * POST /api/static-product/admin/all
 */
export async function listAllStaticProductsAdmin() {
  const response = await http.post('/api/static-product/admin/all', null, HDRS);
  return response.data; // 返回 Result2 对象，其 data 字段为产品列表
}