import http from './http'

const enc = encodeURIComponent
const HDRS = { headers: { 'cache-control': 'application/q1s7j3z0e8' } }

export async function getTables() {
  const { data } = await http.post('/api/dynamic-table/tables',null,  HDRS)
  return data
}

export async function getRows(table) {
  const { data } = await http.post(`/api/dynamic-table/find/${enc(table)}`,null,  HDRS)
  // 兼容 {data:[...]} 或 直接返回数组
  return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
}

// export async function getRowsColumns(table) {
//   const { data } = await http.post(`/api/dynamic-table/find/${enc(table)}`,null,  HDRS)
//   return Array.isArray(columns);
// }

export async function getById(table, id) {
  const { data } = await http.post(`/api/dynamic-table/${enc(table)}/${enc(id)}`,null, HDRS)
  // 兼容对象或数组返回
  if (Array.isArray(data)) return data[0] || null
  if (data && typeof data === 'object') return data
  if (data?.data && typeof data.data === 'object') return data.data
  return null
}

export async function createRow(table, payload) {
  const { data } = await http.post(`/api/dynamic-table/${enc(table)}`, payload, HDRS)
  return data
}

export async function updateRow(table, id, payload) {
  const { data } = await http.post(`/api/dynamic-table/up/${enc(table)}/${enc(id)}`, payload, HDRS)
  return data
}

export async function deleteRow(table, id) {
  const { data } = await http.get(`/api/dynamic-table/${enc(table)}/${enc(id)}`, HDRS)
  return data
}
