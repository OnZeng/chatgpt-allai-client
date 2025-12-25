<template>
  <div class="message-management">
    <div class="management-header">
      <div class="filter-section">
        <n-input
          v-model:value="filterText"
          placeholder="搜索消息内容"
          clearable
          style="width: 250px"
          @update:value="handleFilter"
        >
          <template #prefix>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </template>
        </n-input>
        <n-select
          v-model:value="filterRole"
          placeholder="筛选角色"
          clearable
          filterable
          style="width: 150px"
          :options="roleOptions"
          @update:value="handleFilter"
        />
        <n-input
          v-model:value="filterUserId"
          placeholder="用户ID"
          clearable
          style="width: 200px"
          @update:value="handleFilter"
        />
        <n-input
          v-model:value="filterChatId"
          placeholder="会话ID"
          clearable
          style="width: 200px"
          @update:value="handleFilter"
        />
      </div>
      <div class="action-buttons">
        <n-button @click="handleReset">
          <template #icon>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          重置
        </n-button>
        <n-button @click="handleRefresh">
          <template #icon>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          刷新
        </n-button>
      </div>
    </div>

    <n-data-table
      :columns="columns"
      :data="messages"
      :loading="loading"
      :pagination="pagination"
      :bordered="true"
      striped
      max-height="600px"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useMessage } from 'naive-ui'
import { NButton, NSpace, NInput, NTag, NSelect } from 'naive-ui'
import { get, del } from '@/utils/api'

const message = useMessage()
const messages = ref([])
const loading = ref(false)
const filterText = ref('')
const filterRole = ref(null)
const filterUserId = ref('')
const filterChatId = ref('')
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page) => {
    pagination.value.page = page
    loadMessages()
  },
  onUpdatePageSize: (pageSize) => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
    loadMessages()
  }
})

const roleOptions = [
  { label: '用户', value: 'user' },
  { label: '助手', value: 'assistant' }
]

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 120,
    render: (row) => {
      return h('code', { style: 'font-size: 0.75rem; font-family: monospace' }, row.id.substring(0, 12) + '...')
    }
  },
  {
    title: '用户',
    key: 'username',
    width: 150
  },
  {
    title: '角色',
    key: 'role',
    width: 100,
    render: (row) => {
      return h(
        NTag,
        { type: row.role === 'user' ? 'info' : 'success' },
        { default: () => row.role === 'user' ? '用户' : '助手' }
      )
    }
  },
  {
    title: '消息内容',
    key: 'content',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '会话标题',
    key: 'sessionTitle',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '时间',
    key: 'timestamp',
    width: 180,
    render: (row) => {
      return row.timestamp ? new Date(row.timestamp).toLocaleString('zh-CN') : '-'
    }
  },
]

// 加载消息列表
const loadMessages = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }

    if (filterUserId.value) {
      params.userId = filterUserId.value
    }
    if (filterChatId.value) {
      params.chatId = filterChatId.value
    }
    if (filterRole.value) {
      params.role = filterRole.value
    }

    // 构建查询字符串
    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
    const url = queryParams ? `/admin/messages?${queryParams}` : '/admin/messages'
    const result = await get(url)
    if (result.success && result.data.messages) {
      // 如果有搜索文本，在前端过滤
      let filtered = result.data.messages
      if (filterText.value) {
        filtered = filtered.filter(msg =>
          msg.content.toLowerCase().includes(filterText.value.toLowerCase())
        )
      }
      messages.value = filtered
      pagination.value.total = result.data.total || 0
    } else {
      message.error(result.error || '加载消息列表失败')
    }
  } catch (error) {
    message.error(error.message || '加载消息列表失败')
  } finally {
    loading.value = false
  }
}

// 筛选
const handleFilter = () => {
  pagination.value.page = 1
  loadMessages()
}

// 重置筛选
const handleReset = () => {
  filterText.value = ''
  filterRole.value = null
  filterUserId.value = ''
  filterChatId.value = ''
  pagination.value.page = 1
  loadMessages()
}

// 刷新
const handleRefresh = () => {
  loadMessages()
}


onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.message-management {
  background-color: var(--bg-primary);
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-section {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}
</style>

