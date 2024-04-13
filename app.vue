<template>
  <NConfigProvider style="width: 100%; height: 100%" :inline-theme-disabled="true"
    :theme="stores.theme === 'light' ? null : darkTheme">
    <n-global-style />
    <NDialogProvider>
      <NMessageProvider>
        <div style="width: 100%; height: 100%" v-show="is">
          <NuxtLayout>
            <template #header>
              <ai-setting />
            </template>
            <template #main>
              <NuxtPage />
            </template>
          </NuxtLayout>
        </div>
        <ai-loading style="width: 100%;height: 100%;" v-if="!is" />
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>
<script setup lang="ts">
import './assets/app.css'
import { darkTheme } from 'naive-ui'
import { get_local_theme, get_local_token, get_local_userinfo } from './utils/common/index'


const stores = useUserStore()
const { public: { api_base_url } } = useRuntimeConfig()
const is = ref(false)



onMounted(async () => {
  //读取本地数据
  stores.theme = get_local_theme()
  stores.token = get_local_token()
  stores.userinfo = get_local_userinfo()
  if (!stores.token) return is.value = true
  // 获取最新数据
  const result: any = await useGet('/api/user/getInfo', '初始化', null)
  if (result.type === 'success') await useGet('/api/dialog/getlist', '初始化', null)
  is.value = true
})
</script>
