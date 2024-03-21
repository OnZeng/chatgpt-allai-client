<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <ai-home v-if="stores.dialog_list.length === 0" />
    <ai-dialog v-else />
    <ai-send v-if="stores.dialog_is" />
    <ai-send-loading v-else />
</template>
<script setup lang="ts">
import './assets/index.css'
import { useUserStore } from '../stores/index'
const stores = useUserStore()
</script>