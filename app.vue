<template>
  <div class="app">
    <ai-setting />
    <ai-home v-if="stores.dialog_list.length === 0" />
    <ai-dialog v-else />
    <ai-send v-if="stores.dialog_is" />
    <ai-send-loading v-else />
  </div>
</template>
<script setup lang="ts">
import "./assets/app.css";
import { useUserStore } from "@/stores/index";
const stores = useUserStore();
</script>
