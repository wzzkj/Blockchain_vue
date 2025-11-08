import axios from 'axios'


export const BASE_URL = 'http://192.168.110.102:8065'
// export const BASE_URL = 'https://tronApi.steadyai.vip'


const http = axios.create({
baseURL: BASE_URL,
timeout: 12000
})


http.interceptors.response.use(
(res) => res,
(err) => {
const msg = err?.response?.data?.message || err.message || '请求失败'
return Promise.reject(new Error(msg))
}
)


export default http