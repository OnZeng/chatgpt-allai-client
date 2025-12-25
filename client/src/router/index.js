import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Chat from '@/views/Chat/index.vue'
import Admin from '@/views/Admin/index.vue'

const routes = [
  {
    path: '/',
    name: 'Chat',
    component: Chat
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 初始化认证状态和权限检查
router.beforeEach((to, from, next) => {
  const { initAuth, isAdmin } = useAuth()
  initAuth()
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !isAdmin.value) {
    next('/')
    return
  }
  
  next()
})

export default router






