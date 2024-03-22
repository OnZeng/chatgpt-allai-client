<template>
  <NConfigProvider v-show="is" style="width: 100%; height: 100%" :inline-theme-disabled="true">
    <NDialogProvider>
      <NMessageProvider>
        <NuxtLayout>
          <template #header>
            <ai-setting />
          </template>
          <template #main>
            <NuxtPage />
          </template>
        </NuxtLayout>
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
  <ai-loading v-if="!is" />
</template>
<script setup lang="ts">
import './assets/app.css'
const is = ref(false)
onMounted(() => {
  is.value = true
})
</script>
