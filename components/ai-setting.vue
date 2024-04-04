<template>
  <div class="s-box1">
    <div class="s-box2">
      <n-icon size="30" :component="ReorderFourOutline" @click="open_drawer" v-if="stores.token !== null"/>
    </div>
    <div class="s-box3" @click="open_modal">
      <n-icon size="30" :component="SettingsOutline" />
    </div>
  </div>
  <n-modal :show="show" class="custom-card" preset="card" style="width: 600px;" title="设置" size="huge" closable
    @close="open_modal" @mask-click="open_modal" :bordered="false">
    <template #default>
      <ai-modal />
    </template>
  </n-modal>
  <n-drawer v-model:show="active" width="260px" placement="left">
    <lists-list-list />
  </n-drawer>
</template>
<script setup lang="ts">
import '../assets/setting.css'
import { SettingsOutline, ReorderFourOutline } from '@vicons/ionicons5'

const stores = useUserStore()
const show = ref(false)
const active = ref(false)
const open_modal = () => {
  if (show.value) {
    show.value = false
  } else {
    show.value = true
  }
}
const open_drawer = () => {
  if (active.value) {
    active.value = false
  } else {
    active.value = true
  }
}
</script>
