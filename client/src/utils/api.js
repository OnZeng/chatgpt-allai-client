/**
 * 统一的 API 请求封装
 */

// API 基础地址
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

/**
 * 获取认证 token
 */
const getToken = () => {
  return localStorage.getItem('token')
}

/**
 * 请求拦截器 - 构建请求配置
 */
const buildRequestConfig = (options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    needAuth = true
  } = options

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  // 如果需要认证，自动添加 token
  if (needAuth) {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  // 如果有 body，转换为 JSON
  if (body) {
    config.body = JSON.stringify(body)
  }

  return config
}

/**
 * 响应拦截器 - 处理响应
 */
const handleResponse = async (response) => {
  // 尝试解析 JSON
  let data
  try {
    const text = await response.text()
    data = text ? JSON.parse(text) : {}
  } catch (error) {
    data = {}
  }

  // 如果响应不成功，返回错误信息
  if (!response.ok) {
    return {
      success: false,
      error: data.error || data.message || `请求失败: ${response.status} ${response.statusText}`,
      status: response.status,
      data: null
    }
  }

  // 成功响应
  return {
    success: true,
    data,
    error: null,
    status: response.status
  }
}

/**
 * 错误处理
 */
const handleError = (error, defaultMessage = '请求失败') => {
  console.error('API 请求错误:', error)
  return {
    success: false,
    error: error.message || defaultMessage,
    data: null,
    status: 0
  }
}

/**
 * 通用请求方法
 * @param {string} url - 请求地址（相对于 API_BASE）
 * @param {object} options - 请求选项
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
export const request = async (url, options = {}) => {
  try {
    // 构建完整 URL
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
    
    // 构建请求配置
    const config = buildRequestConfig(options)
    
    // 发送请求
    const response = await fetch(fullUrl, config)
    
    // 处理响应
    return await handleResponse(response)
  } catch (error) {
    return handleError(error, options.errorMessage || '网络请求失败，请检查网络连接')
  }
}

/**
 * GET 请求
 * @param {string} url - 请求地址
 * @param {object} options - 请求选项
 */
export const get = (url, options = {}) => {
  return request(url, {
    ...options,
    method: 'GET'
  })
}

/**
 * POST 请求
 * @param {string} url - 请求地址
 * @param {object} body - 请求体
 * @param {object} options - 请求选项
 */
export const post = (url, body, options = {}) => {
  return request(url, {
    ...options,
    method: 'POST',
    body
  })
}

/**
 * PUT 请求
 * @param {string} url - 请求地址
 * @param {object} body - 请求体
 * @param {object} options - 请求选项
 */
export const put = (url, body, options = {}) => {
  return request(url, {
    ...options,
    method: 'PUT',
    body
  })
}

/**
 * DELETE 请求
 * @param {string} url - 请求地址
 * @param {object} options - 请求选项
 */
export const del = (url, options = {}) => {
  return request(url, {
    ...options,
    method: 'DELETE'
  })
}

/**
 * PATCH 请求
 * @param {string} url - 请求地址
 * @param {object} body - 请求体
 * @param {object} options - 请求选项
 */
export const patch = (url, body, options = {}) => {
  return request(url, {
    ...options,
    method: 'PATCH',
    body
  })
}

export default {
  request,
  get,
  post,
  put,
  delete: del,
  patch
}
