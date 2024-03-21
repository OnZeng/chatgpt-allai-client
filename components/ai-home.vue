<template>
  <div class="h-box1">
    <div class="h-box3">
      <div v-for="(item, index) in stores.list" :key="index" class="h-box4" @click="go(item)">
        <div class="h-box4-title">
          {{ item.role }}
        </div>
        <div class="h-box4-content">
          {{ item.content }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import '../assets/home.css'
import { useUserStore } from '@/stores/index'
const stores = useUserStore()

const go = (item: any) => {
  stores.myinfo.content = item.content
  stores.handleEnter(event)
}
</script>
