import { ref, computed } from 'vue'
import { post } from '@/utils/api'

const user = ref(null)
const token = ref(null)

export const useAuth = () => {
  const login = async (username, password) => {
    const result = await post('/auth/login', { username, password }, {
      needAuth: false,
      errorMessage: '登录失败'
    })

    if (result.success) {
      token.value = result.data.token
      user.value = result.data.user
      
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))
    }

    return result
  }

  const register = async (username, password, email) => {
    const result = await post('/auth/register', { username, password, email }, {
      needAuth: false,
      errorMessage: '注册失败'
    })

    if (result.success) {
      token.value = result.data.token
      user.value = result.data.user
      
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))
    }

    return result
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const initAuth = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin === true)

  return {
    user,
    token,
    login,
    register,
    logout,
    initAuth,
    isAuthenticated,
    isAdmin
  }
}

