<template>
  <div class="send-box1">
    <div class="send-box2">
      <n-input v-model:value="stores.myinfo.content" placeholder="有问题尽管问我...（Shift + Enter = 换行，&quot;/&quot; 触发提示词）"
        type="textarea" :autosize="{
        minRows: 1,
        maxRows: 5,
      }" @keydown.enter="stores.handleEnter" />
      <n-button type="primary" @click="stores.handleEnter">
        发送
      </n-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import '../assets/send.css'
import { useUserStore } from '@/stores/index'
const stores = useUserStore()
</script>
