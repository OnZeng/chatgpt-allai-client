<template>
  <div class="app-loading">
    <div class="loading">
      <div></div>
      <div></div>
      <div></div>
    </div>
    <n-button v-if="is_reset" type="warning" @click="reset">重新刷新</n-button>
  </div>
</template>
<script setup lang="ts">
import "./ai-loading.css";

const is_reset = ref(false);

// 重新刷新
const reset = () => {
  window.location.reload();
};
onMounted(() => {
  setTimeout(() => {
    is_reset.value = true;
  }, 10000);
});
</script>
