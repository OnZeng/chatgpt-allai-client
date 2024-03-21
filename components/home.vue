<template>
  <div class="h-box1">
    <div class="h-box3">
      <div
        class="h-box4"
        v-for="(item, index) in stores.List"
        v-bind:key="index"
        hoverShadow
      >
        <div class="h-box4-title">{{ item.role }}</div>
        <div class="h-box4-content">{{ item.content }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import "../assets/home.css";
import { useUserStore } from "@/stores/index";
const stores = useUserStore();
</script>
