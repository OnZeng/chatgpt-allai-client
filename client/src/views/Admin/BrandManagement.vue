<template>
  <div class="brand-management">
    <div class="management-header">
      <div class="filter-section">
        <n-input
          v-model:value="filterText"
          placeholder="搜索品牌名称"
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
        <n-button type="primary" @click="handleAddBrand">
          <template #icon>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          新增品牌
        </n-button>
      </div>
    </div>

    <n-data-table
      :columns="columns"
      :data="brands"
      :loading="loading"
      :pagination="pagination"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      striped
    />
    
    <!-- 新增/编辑品牌弹窗 -->
    <n-modal v-model:show="showBrandModal" preset="dialog" :title="editingBrand ? '编辑品牌' : '新增品牌'" @update:show="(value) => { if (!value) handleBrandModalClose() }">
      <n-form ref="brandFormRef" :model="brandFormData" :rules="brandRules" label-placement="left" label-width="80px">
        <n-form-item label="品牌名称" path="name">
          <n-input v-model:value="brandFormData.name" placeholder="请输入品牌名称" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="showBrandModal = false">取消</n-button>
          <n-button type="primary" @click="handleBrandSubmit">确定</n-button>
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
const brandFormRef = ref(null)
const brands = ref([])
const loading = ref(false)
const showBrandModal = ref(false)
const editingBrand = ref(null)
const filterText = ref('')
const filterStatus = ref(null)

const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' }
]

const brandFormData = ref({
  name: ''
})

const brandRules = {
  name: {
    required: true,
    message: '请输入品牌名称',
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
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (filterStatus.value) params.status = filterStatus.value
    
    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
    const url = queryParams ? `/admin/brands?${queryParams}` : '/admin/brands'
    
    const result = await get(url)
    if (result.success && result.data) {
      brands.value = result.data.brands
      pagination.value.itemCount = result.data.total || 0
      
      // 前端文本筛选
      if (filterText.value) {
        const text = filterText.value.toLowerCase()
        brands.value = brands.value.filter(brand => 
          brand.name.toLowerCase().includes(text)
        )
      }
    } else {
      message.error(result.error || '获取品牌列表失败')
    }
  } catch (error) {
    message.error('获取品牌列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  pagination.value.page = 1
  loadBrands()
  message.success('刷新成功')
}

// 重置筛选条件
const handleReset = () => {
  filterText.value = ''
  filterStatus.value = null
  pagination.value.page = 1
  loadBrands()
  message.success('已重置筛选条件')
}

// 筛选
const handleFilter = () => {
  pagination.value.page = 1
  loadBrands()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.value.page = page
  loadBrands()
}

// 每页数量变化
const handlePageSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  loadBrands()
}

// 品牌相关操作
const handleAddBrand = () => {
  editingBrand.value = null
  brandFormData.value = { name: '' }
  showBrandModal.value = true
}

const handleBrandEdit = (brand) => {
  editingBrand.value = brand
  brandFormData.value = {
    name: brand.name
  }
  showBrandModal.value = true
}

const handleBrandDelete = async (brand) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除品牌 "${brand.name}" 吗？此操作将同时删除该品牌下的所有模型，且不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      const result = await del(`/admin/brands/${brand.id}`)
      if (result.success) {
        message.success('删除成功')
        await loadBrands()
      } else {
        message.error(result.error || '删除失败')
      }
    }
  })
}

const handleBrandToggleStatus = async (brand) => {
  const newStatus = brand.status === 'active' ? 'disabled' : 'active'
  const result = await patch(`/admin/brands/${brand.id}/status`, { status: newStatus })
  if (result.success) {
    message.success(newStatus === 'active' ? '已启用' : '已停用')
    await loadBrands()
  } else {
    message.error(result.error || '操作失败')
  }
}

const handleBrandSubmit = async () => {
  try {
    await brandFormRef.value?.validate()
    
    if (editingBrand.value) {
      // 更新品牌
      const result = await put(`/admin/brands/${editingBrand.value.id}`, brandFormData.value)
      if (result.success) {
        message.success('更新成功')
        showBrandModal.value = false
        await loadBrands()
      } else {
        message.error(result.error || '更新失败')
      }
    } else {
      // 新增品牌
      const result = await post('/admin/brands', brandFormData.value)
      if (result.success) {
        message.success('新增成功')
        showBrandModal.value = false
        await loadBrands()
      } else {
        message.error(result.error || '新增失败')
      }
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleBrandModalClose = () => {
  editingBrand.value = null
  brandFormData.value = { name: '' }
  brandFormRef.value?.restoreValidation()
}

// 表格列定义
const columns = [
  {
    title: '品牌名称',
    key: 'name',
    width: 200
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
              onClick: () => handleBrandToggleStatus(row)
            },
            { default: () => row.status === 'active' ? '停用' : '启用' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => handleBrandEdit(row)
            },
            { default: () => '修改' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => handleBrandDelete(row)
            },
            { default: () => '删除' }
          )
        ]
      })
    }
  }
]

onMounted(() => {
  loadBrands()
})
</script>

<style scoped>
.brand-management {
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



