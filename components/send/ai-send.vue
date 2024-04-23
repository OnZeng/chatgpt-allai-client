<template>
  <div class="send-box1">
    <div class="send-box2">
      <n-input
        v-model:value="stores.myinfo.content"
        placeholder="有问题尽管问我..."
        type="textarea"
        :autosize="{
          minRows: 1,
          maxRows: 5,
        }"
        @keydown.enter="stores.handleEnter"
        @focus="stores.checkLogin"
      />
      <n-button type="primary" @click="stores.handleEnter"> 发送 </n-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import "./ai-send.css";

const stores = useUserStore();
</script>
