<template>
  <div class="app">
    <setting />
    <home v-if="stores.Dialog_List.length === 0" />
    <dialogp v-else />
    <send v-if="stores.IS" />
    <send-loading v-else />
  </div>
</template>
<script setup lang="ts">
import "./assets/app.css";
import { useUserStore } from "@/stores/index";
const stores = useUserStore();
</script>
