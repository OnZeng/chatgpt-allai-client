<template>
  <div class="s-box1">
    <div class="s-box2" @click="open_modal">
      <n-icon size="32" :component="SettingsOutline" />
    </div>
  </div>
  <n-modal :show="show" class="custom-card" preset="card" style="width: 600px;" title="设置" size="huge" closable
    @close="open_modal" @mask-click="open_modal" :bordered="false">
    <template #default>
      <ai-modal />
    </template>
  </n-modal>
</template>
<script setup lang="ts">
import '../assets/setting.css'
import { SettingsOutline } from '@vicons/ionicons5'

const show = ref(false)
const open_modal = () => {
  if (show.value) {
    show.value = false
  } else {
    show.value = true
  }
}
</script>
