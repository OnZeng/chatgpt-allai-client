<template>
  <div class="model-management">
    <div class="management-header">
      <div class="filter-section">
        <n-select
          v-model:value="filterBrandId"
          placeholder="筛选品牌"
          clearable
          filterable
          style="width: 200px"
          :options="brandOptions"
          @update:value="handleFilter"
        />
        <n-input
          v-model:value="filterText"
          placeholder="搜索模型名称"
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
        <n-button type="primary" @click="handleAddModel">
          <template #icon>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          新增模型
        </n-button>
      </div>
    </div>

    <n-data-table
      :columns="columns"
      :data="models"
      :loading="loading"
      :pagination="pagination"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      striped
    />
    
    <!-- 新增/编辑模型弹窗 -->
    <n-modal v-model:show="showModelModal" preset="dialog" :title="editingModel ? '编辑模型' : '新增模型'" @update:show="(value) => { if (!value) handleModelModalClose() }">
      <n-form ref="modelFormRef" :model="modelFormData" :rules="modelRules" label-placement="left" label-width="80px">
        <n-form-item label="品牌" path="brandId">
          <n-select 
            v-model:value="modelFormData.brandId" 
            placeholder="请选择品牌" 
            :options="brandOptions"
            :disabled="!!editingModel"
          />
        </n-form-item>
        <n-form-item label="服务名称" path="serviceName">
          <n-input v-model:value="modelFormData.serviceName" placeholder="请输入服务名称（必填，全局唯一）" />
        </n-form-item>
        <n-form-item label="模型名称" path="name">
          <n-input v-model:value="modelFormData.name" placeholder="请输入模型名称" />
        </n-form-item>
        <n-form-item label="模型描述" path="description">
          <n-input 
            v-model:value="modelFormData.description" 
            type="textarea" 
            placeholder="请输入模型描述（可选）"
            :rows="3"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="showModelModal = false">取消</n-button>
          <n-button type="primary" @click="handleModelSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, h, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NSpace, NInput, NForm, NFormItem, NTag, NSelect } from 'naive-ui'
import { get, post, put, del, patch } from '@/utils/api'

const message = useMessage()
const dialog = useDialog()
const modelFormRef = ref(null)
const brands = ref([])
const models = ref([])
const loading = ref(false)
const showModelModal = ref(false)
const editingModel = ref(null)
const filterText = ref('')
const filterStatus = ref(null)
const filterBrandId = ref(null)

const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' }
]

const brandOptions = computed(() => {
  return brands.value
    .filter(brand => brand.status === 'active')
    .map(brand => ({
      label: brand.name,
      value: brand.id
    }))
})

const modelFormData = ref({
  brandId: null,
  serviceName: '',
  name: '',
  description: ''
})

const modelRules = {
  brandId: {
    required: true,
    message: '请选择品牌',
    trigger: 'change'
  },
  serviceName: {
    required: true,
    message: '请输入服务名称',
    trigger: 'blur'
  },
  name: {
    required: true,
    message: '请输入模型名称',
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

// 加载品牌列表
const loadBrands = async () => {
  try {
    const result = await get('/admin/brands')
    if (result.success) {
      brands.value = result.data.brands
    } else {
      message.error(result.error || '获取品牌列表失败')
    }
  } catch (error) {
    message.error('获取品牌列表失败')
  }
}

// 加载模型列表
const loadModels = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterBrandId.value) params.brandId = filterBrandId.value
    
    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
    const url = queryParams ? `/admin/models?${queryParams}` : '/admin/models'
    
    const result = await get(url)
    if (result.success && result.data) {
      models.value = result.data.models
      pagination.value.itemCount = result.data.total || 0
      
      // 前端文本筛选
      if (filterText.value) {
        const text = filterText.value.toLowerCase()
        models.value = models.value.filter(model => 
          model.name.toLowerCase().includes(text) ||
          (model.serviceName && model.serviceName.toLowerCase().includes(text))
        )
      }
    } else {
      message.error(result.error || '获取模型列表失败')
    }
  } catch (error) {
    message.error('获取模型列表失败')
  } finally {
    loading.value = false
  }
}

// 加载所有数据
const loadAll = async () => {
  await Promise.all([loadBrands(), loadModels()])
}

// 刷新
const handleRefresh = () => {
  pagination.value.page = 1
  loadAll()
  message.success('刷新成功')
}

// 重置筛选条件
const handleReset = () => {
  filterText.value = ''
  filterStatus.value = null
  filterBrandId.value = null
  pagination.value.page = 1
  loadAll()
  message.success('已重置筛选条件')
}

// 筛选
const handleFilter = () => {
  pagination.value.page = 1
  loadModels()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.value.page = page
  loadModels()
}

// 每页数量变化
const handlePageSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  loadModels()
}

// 模型相关操作
const handleAddModel = () => {
  editingModel.value = null
  modelFormData.value = {
    brandId: null,
    serviceName: '',
    name: '',
    description: ''
  }
  showModelModal.value = true
}

const handleModelEdit = (model) => {
  editingModel.value = model
    modelFormData.value = {
      brandId: model.brandId,
      serviceName: model.serviceName || '',
      name: model.name,
      description: model.description || ''
    }
  showModelModal.value = true
}

const handleModelDelete = async (model) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除模型 "${model.name}" 吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      const result = await del(`/admin/models/${model.id}`)
      if (result.success) {
        message.success('删除成功')
        await loadModels()
      } else {
        message.error(result.error || '删除失败')
      }
    }
  })
}

const handleModelToggleStatus = async (model) => {
  const newStatus = model.status === 'active' ? 'disabled' : 'active'
  const result = await patch(`/admin/models/${model.id}/status`, { status: newStatus })
  if (result.success) {
    message.success(newStatus === 'active' ? '已启用' : '已停用')
    await loadModels()
  } else {
    message.error(result.error || '操作失败')
  }
}

const handleModelSubmit = async () => {
  try {
    await modelFormRef.value?.validate()
    
    if (editingModel.value) {
      // 更新模型
      const result = await put(`/admin/models/${editingModel.value.id}`, { 
        serviceName: modelFormData.value.serviceName || null,
        name: modelFormData.value.name,
        description: modelFormData.value.description
      })
      if (result.success) {
        message.success('更新成功')
        showModelModal.value = false
        await loadModels()
      } else {
        message.error(result.error || '更新失败')
      }
    } else {
      // 新增模型
      const result = await post('/admin/models', {
        brandId: modelFormData.value.brandId,
        serviceName: modelFormData.value.serviceName || null,
        name: modelFormData.value.name,
        description: modelFormData.value.description
      })
      if (result.success) {
        message.success('新增成功')
        showModelModal.value = false
        await loadModels()
      } else {
        message.error(result.error || '新增失败')
      }
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleModelModalClose = () => {
  editingModel.value = null
  modelFormData.value = { brandId: null, serviceName: '', name: '', description: '' }
  modelFormRef.value?.restoreValidation()
}

// 表格列定义
const columns = [
  {
    title: '品牌',
    key: 'brandName',
    width: 150
  },
  {
    title: '服务名称',
    key: 'serviceName',
    width: 150,
    render: (row) => {
      return row.serviceName || '-'
    }
  },
  {
    title: '模型名称',
    key: 'name',
    width: 200
  },
  {
    title: '模型描述',
    key: 'description',
    width: 150,
    ellipsis: {
      tooltip: true
    },
    render: (row) => {
      return row.description || '-'
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
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
    render: (row) => {
      return row.updatedAt ? new Date(row.updatedAt).toLocaleString('zh-CN') : '-'
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 250,
    render: (row) => {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              type: row.status === 'active' ? 'warning' : 'success',
              onClick: () => handleModelToggleStatus(row)
            },
            { default: () => row.status === 'active' ? '停用' : '启用' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => handleModelEdit(row)
            },
            { default: () => '修改' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => handleModelDelete(row)
            },
            { default: () => '删除' }
          )
        ]
      })
    }
  }
]

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
.model-management {
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
