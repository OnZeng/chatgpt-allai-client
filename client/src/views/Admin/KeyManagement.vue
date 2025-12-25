<template>
  <div class="key-management">
    <div class="management-header">
      <div class="filter-section">
        <n-select v-model:value="filterModelId" placeholder="搜索/筛选模型" clearable filterable style="width: 300px"
          :options="modelOptions" @update:value="handleFilter" />
        <n-select v-model:value="filterStatus" placeholder="筛选状态" clearable filterable style="width: 150px"
          :options="statusOptions" @update:value="handleFilter" />
      </div>
      <div class="action-buttons">
        <n-button @click="handleReset">
          <template #icon>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          重置
        </n-button>
        <n-button @click="handleRefresh">
          <template #icon>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          刷新
        </n-button>
        <n-button type="primary" @click="handleAddKey">
          <template #icon>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          新增密钥
        </n-button>
      </div>
    </div>

    <n-data-table :columns="columns" :data="keys" :loading="loading" :pagination="pagination"
      @update:page="handlePageChange" @update:page-size="handlePageSizeChange" :bordered="true" striped />

    <!-- 新增/编辑密钥弹窗 -->
    <n-modal v-model:show="showKeyModal" preset="dialog" :title="editingKey ? '编辑密钥' : '新增密钥'"
      @update:show="(value) => { if (!value) handleKeyModalClose() }">
      <n-form ref="keyFormRef" :model="keyFormData" :rules="keyRules" label-placement="left" label-width="100px">
        <n-form-item label="模型" path="modelId">
          <n-select v-model:value="keyFormData.modelId" placeholder="请选择模型" :options="modelOptions" filterable />
        </n-form-item>
        <n-form-item label="API密钥" path="apiKey">
          <n-input v-model:value="keyFormData.apiKey" type="textarea" placeholder="请输入API密钥" :rows="3"
            :autosize="{ minRows: 3, maxRows: 5 }" />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="keyFormData.status" :options="statusOptions" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="showKeyModal = false">取消</n-button>
          <n-button type="primary" @click="handleKeySubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NSpace, NInput, NForm, NFormItem, NTag, NSelect } from 'naive-ui'
import { get, post, put, del } from '@/utils/api'

const message = useMessage()
const dialog = useDialog()
const keyFormRef = ref(null)
const keys = ref([])
const loading = ref(false)
const showKeyModal = ref(false)
const editingKey = ref(null)
const filterText = ref('')
const filterModelId = ref(null)
const filterStatus = ref(null)
const models = ref([])

const modelOptions = computed(() => {
  // 从模型列表中生成选项，显示品牌名称、服务名称和模型名称
  return models.value.map(model => ({
    label: `${model.brandName || ''} - ${model.serviceName || ''} - ${model.name || ''}`,
    value: model.id,
    serviceName: model.serviceName,
    modelName: model.name,
    brandName: model.brandName
  }))
})

const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' }
]

const keyFormData = ref({
  modelId: null,
  apiKey: '',
  status: 'active'
})

const keyRules = {
  modelId: {
    required: true,
    message: '请选择模型',
    trigger: 'change'
  },
  apiKey: {
    required: true,
    message: '请输入API密钥',
    trigger: 'blur'
  }
}

const pagination = ref({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  itemCount: 0
})

const columns = [
  {
    title: '品牌',
    key: 'brandName',
    width: 120
  },
  {
    title: '服务名称',
    key: 'serviceName',
    width: 150,
    render: (row) => {
      return h(NTag, { type: 'info' }, { default: () => row.serviceName || '-' })
    }
  },
  {
    title: '模型名称',
    key: 'modelName',
    width: 150
  },
  {
    title: 'API密钥',
    key: 'maskedKey',
    width: 200,
    render: (row) => {
      return h('code', { style: 'font-family: monospace; color: var(--text-secondary)' }, row.maskedKey)
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      return h(
        NTag,
        { type: row.status === 'active' ? 'success' : 'error' },
        { default: () => row.status === 'active' ? '启用' : '停用' }
      )
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row) => {
      return row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-'
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
              onClick: () => handleEditKey(row)
            },
            { default: () => '编辑' }
          ),
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
              onClick: () => handleDeleteKey(row)
            },
            { default: () => '删除' }
          )
        ]
      })
    }
  }
]

// 加载模型列表（用于获取服务名称）
const loadModels = async () => {
  try {
    const result = await get('/admin/models')
    if (result.success && result.data.models) {
      models.value = result.data.models
    }
  } catch (error) {
    console.error('加载模型列表失败:', error)
  }
}

// 加载密钥列表
const loadKeys = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterModelId.value) params.modelId = filterModelId.value

    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
    const url = queryParams ? `/admin/keys?${queryParams}` : '/admin/keys'

    const result = await get(url)
    if (result.success && result.data) {
      keys.value = result.data.keys
      pagination.value.itemCount = result.data.total || 0
    } else {
      message.error(result.error || '加载密钥列表失败')
    }
  } catch (error) {
    message.error(error.message || '加载密钥列表失败')
  } finally {
    loading.value = false
  }
}

// 筛选
const handleFilter = () => {
  pagination.value.page = 1
  loadKeys()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.value.page = page
  loadKeys()
}

// 每页数量变化
const handlePageSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  loadKeys()
}

// 重置筛选
const handleReset = () => {
  filterModelId.value = null
  filterStatus.value = null
  pagination.value.page = 1
  loadKeys()
}

// 刷新
const handleRefresh = () => {
  loadKeys()
}

// 新增密钥
const handleAddKey = () => {
  editingKey.value = null
  keyFormData.value = {
    modelId: null,
    apiKey: '',
    status: 'active'
  }
  showKeyModal.value = true
}

// 编辑密钥
const handleEditKey = (key) => {
  editingKey.value = key
  keyFormData.value = {
    modelId: key.modelId,
    apiKey: '', // 不显示完整密钥，需要重新输入
    status: key.status
  }
  showKeyModal.value = true
}

// 关闭弹窗
const handleKeyModalClose = () => {
  editingKey.value = null
  keyFormData.value = {
    modelId: null,
    apiKey: '',
    status: 'active'
  }
}

// 提交表单
const handleKeySubmit = async () => {
  try {
    await keyFormRef.value?.validate()
  } catch (error) {
    return
  }

  try {
    let result
    if (editingKey.value) {
      result = await put(`/admin/keys/${editingKey.value.id}`, keyFormData.value)
    } else {
      result = await post('/admin/keys', keyFormData.value)
    }

    if (result.success) {
      message.success(editingKey.value ? '密钥更新成功' : '密钥创建成功')
      showKeyModal.value = false
      await loadKeys()
    } else {
      message.error(result.error || '操作失败')
    }
  } catch (error) {
    message.error(error.message || '操作失败')
  }
}

// 切换状态
const handleToggleStatus = async (key) => {
  try {
    const newStatus = key.status === 'active' ? 'disabled' : 'active'
    const result = await put(`/admin/keys/${key.id}`, { status: newStatus })
    if (result.success) {
      message.success(newStatus === 'active' ? '密钥已启用' : '密钥已停用')
      await loadKeys()
    } else {
      message.error(result.error || '操作失败')
    }
  } catch (error) {
    message.error(error.message || '操作失败')
  }
}

// 删除密钥
const handleDeleteKey = (key) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除密钥"${key.serviceName || key.modelName}"吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const result = await del(`/admin/keys/${key.id}`)
        if (result.success) {
          message.success('密钥删除成功')
          await loadKeys()
        } else {
          message.error(result.error || '删除失败')
        }
      } catch (error) {
        message.error(error.message || '删除失败')
      }
    }
  })
}

onMounted(() => {
  loadModels()
  loadKeys()
})
</script>

<style scoped>
.key-management {
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
