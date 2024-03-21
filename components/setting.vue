<template>
  <div class="s-box1">
    <div class="s-box2"><n-icon size="32" :component="SettingsOutline" /></div>
  </div>
</template>
<script setup lang="ts">
import "../assets/setting.css";
import { SettingsOutline } from '@vicons/ionicons5'
const go = () => {
  console.log(123);
};
</script>
