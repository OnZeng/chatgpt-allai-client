<template>
  <div class="sendLoading-box1">
    <n-button type="error">停止响应</n-button>
    <div class="loader">
      <div class="loader-dot"></div>
      <div class="loader-dot"></div>
      <div class="loader-dot"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import "../assets/sendLoading.css";
import { useUserStore } from "@/stores/index";
const stores = useUserStore();
</script>
