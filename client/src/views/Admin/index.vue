<template>
  <div class="admin-page">
    <div class="admin-header">
      <button class="back-button" @click="goHome">
        <svg class="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>返回主页</span>
      </button>
      <h1 class="admin-title">后台管理</h1>
    </div>
    <div class="admin-content">
      <n-tabs v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="users" tab="用户管理">
          <UserManagement />
        </n-tab-pane>
        <n-tab-pane name="models" tab="模型管理">
          <ModelManagement />
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NTabs, NTabPane } from 'naive-ui'
import UserManagement from './UserManagement.vue'
import ModelManagement from './ModelManagement.vue'
import './index.css'

const router = useRouter()
const activeTab = ref('users')

const goHome = () => {
  router.push('/')
}
</script>
