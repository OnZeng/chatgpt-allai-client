<template>
  <div class="admin-page">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="admin-sidebar-header">
        <h2 class="admin-sidebar-title" v-if="!sidebarCollapsed">后台管理</h2>
        <button class="admin-sidebar-toggle" @click="toggleSidebar" :title="sidebarCollapsed ? '展开' : '收起'">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="sidebarCollapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav class="admin-sidebar-nav">
        <!-- 用户管理 -->
        <div class="admin-menu-item" :class="{ active: activeMenu === 'users' }" @click="activeMenu = 'users'">
          <svg class="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span v-if="!sidebarCollapsed">用户管理</span>
        </div>

        <!-- 大模型管理（可展开） -->
        <div class="admin-menu-group">
          <div class="admin-menu-item" :class="{ active: activeMenu.startsWith('ai-') }" @click="toggleAIMenu">
            <svg class="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span v-if="!sidebarCollapsed">大模型管理</span>
            <svg v-if="!sidebarCollapsed" class="admin-menu-arrow" :class="{ expanded: aiMenuExpanded }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div v-if="aiMenuExpanded && !sidebarCollapsed" class="admin-submenu">
            <div class="admin-submenu-item" :class="{ active: activeMenu === 'ai-brands' }" @click="activeMenu = 'ai-brands'">
              <span>品牌管理</span>
            </div>
            <div class="admin-submenu-item" :class="{ active: activeMenu === 'ai-models' }" @click="activeMenu = 'ai-models'">
              <span>模型管理</span>
            </div>
            <div class="admin-submenu-item" :class="{ active: activeMenu === 'ai-keys' }" @click="activeMenu = 'ai-keys'">
              <span>密钥管理</span>
            </div>
          </div>
        </div>

        <!-- 消息管理 -->
        <div class="admin-menu-item" :class="{ active: activeMenu === 'messages' }" @click="activeMenu = 'messages'">
          <svg class="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span v-if="!sidebarCollapsed">消息管理</span>
        </div>
      </nav>

      <div class="admin-sidebar-footer">
        <button class="admin-back-button" @click="goHome">
          <svg class="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
          <span v-if="!sidebarCollapsed">返回主页</span>
      </button>
    </div>
    </aside>

    <!-- 主内容区 -->
    <main class="admin-main">
    <div class="admin-content">
        <UserManagement v-if="activeMenu === 'users'" />
        <BrandManagement v-if="activeMenu === 'ai-brands'" />
        <ModelManagement v-if="activeMenu === 'ai-models'" />
        <KeyManagement v-if="activeMenu === 'ai-keys'" />
        <MessageManagement v-if="activeMenu === 'messages'" />
    </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UserManagement from './UserManagement.vue'
import BrandManagement from './BrandManagement.vue'
import ModelManagement from './ModelManagement.vue'
import KeyManagement from './KeyManagement.vue'
import MessageManagement from './MessageManagement.vue'
import './index.css'

const router = useRouter()
const activeMenu = ref('users')
const sidebarCollapsed = ref(false)
const aiMenuExpanded = ref(true)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (sidebarCollapsed.value) {
    aiMenuExpanded.value = false
  } else {
    aiMenuExpanded.value = true
  }
}

const toggleAIMenu = () => {
  if (!sidebarCollapsed.value) {
    aiMenuExpanded.value = !aiMenuExpanded.value
  }
}

const goHome = () => {
  router.push('/')
}
</script>
