// 导出一个对象，但 headers 属性是一个 getter
export const HDRS = {
  // 使用 get 关键字
  get headers() {
    // 这部分代码会在每次访问 .headers 属性时执行
    const adminToken = localStorage.getItem('admin_token');

    const dynamicHeaders = {
      'Account-test': 'application/q1s7j3z0e8',
    };

    if (adminToken) {
      dynamicHeaders['Account-token'] = adminToken;
    }

    return dynamicHeaders;
  }
};