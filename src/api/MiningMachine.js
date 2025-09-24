import http from './http'

// 沿用之前的请求头配置
const HDRS = { headers: { 'Account-test': 'application/q1s7j3z0e8' } }

/**
 * 添加矿机
 * POST /api/mining-machine/add
 * @param {object} miningMachine - 矿机对象，不含id
 */
export async function addMiningMachine(miningMachine) {
  const response = await http.post('/api/mining-machine/add', miningMachine, HDRS);
  // 后端直接返回 Result2 类型的字符串，需要解析
  // 为了和现有风格统一，这里假设 http 库会自动解析 JSON 字符串
  // 如果 http 库没有这个功能，你可能需要手动 JSON.parse(response.data)
  return response.data; // 返回完整的 Result2 对象，方便业务层判断成功或失败
}

/**
 * 根据ID删除矿机
 * POST /api/mining-machine/delete/{id}
 * @param {number | string} id - 矿机的ID
 */
export async function deleteMiningMachine(id) {
  // 注意：后端使用了 @PathVariable，但请求方法是 POST。
  // 通常 RESTful 风格中删除会用 DELETE 方法。这里我们严格按照后端代码来实现。
  const response = await http.post(`/api/mining-machine/delete/${id}`, null, HDRS);
  return response.data; // 返回 Result2 字符串
}

/**
 * 更新矿机
 * POST /api/mining-machine/update
 * @param {object} miningMachine - 矿机对象，必须包含id
 */
export async function updateMiningMachine(miningMachine) {
  const response = await http.post('/api/mining-machine/update', miningMachine, HDRS);
  return response.data; // 返回 Result2 字符串
}

/**
 * 根据ID查询矿机
 * POST /api/mining-machine/get/{id}
 * @param {number | string} id - 矿机的ID
 */
export async function getMiningMachineById(id) {
  const response = await http.post(`/api/mining-machine/get/${id}`, null, HDRS);
  // 后端返回的是 Result 类型的字符串，其 data 字段是矿机对象
  // 同样，假设 http 库会处理 JSON 解析
  return response.data; // 返回 Result 对象
}

/**
 * 分页查询矿机列表
 * POST /api/mining-machine/list
 * @param {object} page - 分页参数，例如 { current: 1, size: 10 }
 */
export async function listMiningMachines(page) {
  const response = await http.post('/api/mining-machine/list', page, HDRS);
  // 返回 Result 对象，其 data 字段是分页结果
  return response.data;
}

/**
 * 查询所有矿机列表
 * POST /api/mining-machine/all
 */
export async function listAllMiningMachines() {
  const response = await http.post('/api/mining-machine/admin/all', null, HDRS);
  // 返回 Result 对象，其 data 字段是所有矿机的列表 (List)
  return response.data;
}