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
import { useUserStore } from './stores/index'
import { get_local_theme } from './utils/index'
const stores = useUserStore()
const is = ref(false)

onMounted(() => {
  is.value = true
  //读取本地主题
  stores.theme = get_local_theme()
})
</script>
