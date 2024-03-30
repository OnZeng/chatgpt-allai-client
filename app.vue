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
const time_r: any = ref(null);



onMounted(async () => {
  is.value = true
  //读取本地主题
  stores.theme = get_local_theme()
  stores.token = get_local_token()
  stores.userinfo = get_local_userinfo()
  if (!stores.token) return
  stores.userinfo = await getuserinfo(api_base_url, stores.token)
})
</script>
