<template>
  <div class="sendLoading-box1">
    <n-button type="error" @click="stores.stopAnswer"> 停止响应 </n-button>
    <div class="loader">
      <div class="loader-dot" />
      <div class="loader-dot" />
      <div class="loader-dot" />
    </div>
  </div>
</template>
<script setup lang="ts">
import "./ai-send-loading.css";

const stores = useUserStore();
</script>
