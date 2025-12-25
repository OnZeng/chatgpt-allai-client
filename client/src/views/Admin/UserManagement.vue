<template>
  <div class="user-management">
    <div class="management-header">
      <div class="filter-section">
        <n-input
          v-model:value="filterText"
          placeholder="搜索用户名、邮箱"
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
          v-model:value="filterStatus"
          placeholder="筛选状态"
          clearable
          filterable
          style="width: 150px"
          :options="statusOptions"
          @update:value="handleFilter"
        />
        <n-select
          v-model:value="filterRole"
          placeholder="筛选角色"
          clearable
          filterable
          style="width: 150px"
          :options="roleOptions"
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
      :data="users"
      :loading="loading"
      :pagination="pagination"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      striped
    />
  </div>
</template>

<script setup>
import { ref, onMounted, h, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NTag, NSpace, NInput, NSelect } from 'naive-ui'
import { get, del, patch } from '@/utils/api'

const message = useMessage()
const dialog = useDialog()
const users = ref([])
const loading = ref(false)
const filterText = ref('')
const filterStatus = ref(null)
const filterRole = ref(null)

const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '停用', value: 'disabled' }
]

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' }
]

const pagination = ref({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  itemCount: 0
})

// 获取设备类型
const getDeviceType = (userAgent) => {
  if (!userAgent) return '未知'
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return '移动设备'
  }
  return '桌面设备'
}

// 获取用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterRole.value) params.role = filterRole.value
    
    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
    const url = queryParams ? `/admin/users?${queryParams}` : '/admin/users'
    
    const result = await get(url)
    if (result.success && result.data) {
      users.value = result.data.users.map(user => ({
        ...user,
        deviceType: getDeviceType(user.deviceType)
      }))
      pagination.value.itemCount = result.data.total || 0
      
      // 前端文本筛选
      if (filterText.value) {
        const text = filterText.value.toLowerCase()
        users.value = users.value.filter(user => 
          user.username.toLowerCase().includes(text) ||
          (user.email && user.email.toLowerCase().includes(text))
        )
      }
    } else {
      message.error(result.error || '获取用户列表失败')
    }
  } catch (error) {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  pagination.value.page = 1
  loadUsers()
  message.success('刷新成功')
}

// 重置筛选条件
const handleReset = () => {
  filterText.value = ''
  filterStatus.value = null
  filterRole.value = null
  pagination.value.page = 1
  loadUsers()
  message.success('已重置筛选条件')
}

// 筛选
const handleFilter = () => {
  pagination.value.page = 1
  loadUsers()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.value.page = page
  loadUsers()
}

// 每页数量变化
const handlePageSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  loadUsers()
}

// 删除用户
const handleDelete = async (user) => {
  const result = await del(`/admin/users/${user.id}`)
  if (result.success) {
    message.success('删除成功')
    await loadUsers()
  } else {
    message.error(result.error || '删除失败')
  }
}

// 停用/启用用户
const handleToggleStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'disabled' : 'active'
  const result = await patch(`/admin/users/${user.id}/status`, { status: newStatus })
  if (result.success) {
    message.success(newStatus === 'active' ? '已启用' : '已停用')
    await loadUsers()
  } else {
    message.error(result.error || '操作失败')
  }
}

// 表格列定义
const columns = [
  {
    title: '用户名',
    key: 'username',
    width: 120
  },
  {
    title: '邮箱',
    key: 'email',
    width: 180
  },
  {
    title: '角色',
    key: 'role',
    width: 100,
    render: (row) => {
      const roleMap = {
        admin: { text: '管理员', type: 'error' },
        user: { text: '普通用户', type: 'default' }
      }
      const role = roleMap[row.role] || { text: row.role || '普通用户', type: 'default' }
      return h(NTag, { type: role.type }, { default: () => role.text })
    }
  },
  {
    title: '套餐',
    key: 'plan',
    width: 100,
    render: (row) => {
      const planMap = {
        free: { text: '免费', type: 'default' },
        pro: { text: '专业', type: 'info' },
        premium: { text: '高级', type: 'success' }
      }
      const plan = planMap[row.plan] || { text: row.plan, type: 'default' }
      return h(NTag, { type: plan.type }, { default: () => plan.text })
    }
  },
  {
    title: 'IP地址',
    key: 'ipAddress',
    width: 150
  },
  {
    title: '设备类型',
    key: 'deviceType',
    width: 120
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      return h(
        NTag,
        { type: row.status === 'active' ? 'success' : 'error' },
        { default: () => row.status === 'active' ? '正常' : '停用' }
      )
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              type: row.status === 'active' ? 'warning' : 'success',
              onClick: () => handleToggleStatus(row)
            },
            { default: () => row.status === 'active' ? '停用' : '启用' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => {
                dialog.warning({
                  title: '确认删除',
                  content: `确定要删除用户 "${row.username}" 吗？此操作不可恢复。`,
                  positiveText: '确定',
                  negativeText: '取消',
                  onPositiveClick: () => handleDelete(row)
                })
              }
            },
            { default: () => '删除' }
          )
        ]
      })
    }
  }
]

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  background-color: var(--bg-primary);
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.filter-section {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}
</style>



