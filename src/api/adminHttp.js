import axios from 'axios'


export const BASE_URL = 'http://192.168.110.101:8065'
export const HDRS = { headers: { 'cache-control': 'application/q1s7j3z0e8' } }

const http = axios.create({
baseURL: BASE_URL,
timeout: 12000,
headers:HDRS
})


http.interceptors.response.use(
(res) => res,
(err) => {
const msg = err?.response?.data?.message || err.message || '请求失败'
return Promise.reject(new Error(msg))
}
)


export default http