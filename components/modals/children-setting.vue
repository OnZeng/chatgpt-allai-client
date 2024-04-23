<template>
  <n-grid y-gap="12">
    <n-gi span="24">
      <n-card title="主题">
        <n-flex>
          <n-switch @update:value="switch_theme" :round="false">
            <template #checked-icon> 🤔 </template>
            <template #checked> 暗色 </template>
            <template #unchecked> 亮色 </template>
            <template #unchecked-icon> 🤔 </template>
          </n-switch>
        </n-flex>
      </n-card>
    </n-gi>
  </n-grid>
</template>
<script setup lang="ts">
const stores = useUserStore();

const switch_theme = () => {
  if (stores.theme === "light") {
    stores.theme = "dark";
    window.localStorage.setItem("theme", "dark");
  } else {
    stores.theme = "light";
    window.localStorage.setItem("theme", "light");
  }
};
</script>
