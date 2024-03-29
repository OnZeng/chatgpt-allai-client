<template>
    <n-tabs type="line" animated>
        <n-tab-pane name="oasis" tab="账户信息" v-if="isShow()">
            <modals-system-userinfo />
        </n-tab-pane>
        <n-tab-pane name="the beatles" tab="系统设置">
            <modals-system-setting />
        </n-tab-pane>
    </n-tabs>
</template>
<script setup lang="ts">
const stores = useUserStore()

const isShow = () => {
    if (!stores.token) {
        return false
    } else {
        return true
    }
}
</script>