<template>
    <n-drawer-content closable>
        <template #header>
            <n-button type="primary" @click="stores.newDialog">新建会话</n-button>
        </template>
        <template #default>
            <n-scrollbar style="max-height: 100%">
                <n-list hoverable clickable v-for="(item, index) in stores.dialog_titles"
                    :bordered="stores.dialog_index === item.id" @click="stores.changeDialog(item, index)">
                    <n-list-item>
                        <template #default>
                            <div class="list-list-box2">{{ item.title }}</div>
                        </template>
                        <template #suffix>
                            <div class="list-list-box3">
                                <n-dropdown :options="options" trigger="click"
                                    @select="handleSelect($event, options, item, index)">
                                    <n-button size="small" :bordered="false">
                                        <template #icon>
                                            <n-icon :component="EllipsisHorizontalOutline"></n-icon>
                                        </template>
                                    </n-button>
                                </n-dropdown>
                            </div>
                        </template>
                    </n-list-item>
                </n-list>
            </n-scrollbar>
        </template>
    </n-drawer-content>
</template>
<script setup lang="ts">
import { EllipsisHorizontalOutline, TrashOutline, Pencil } from '@vicons/ionicons5'
import '../../assets/list-list.css'
import { NIcon, useDialog, useMessage } from 'naive-ui'
const message = useMessage()
const dialog = useDialog()
const {
    public: { api_base_url },
} = useRuntimeConfig();
const stores = useUserStore()

const renderIcon = (icon: Component) => {
    return () => {
        return h(NIcon, null, {
            default: () => h(icon)
        })
    }
}
const options: any = [
    {
        label: '重命名',
        key: 1,
        icon: renderIcon(Pencil)
    },
    {
        label: '删除',
        key: 2,
        icon: renderIcon(TrashOutline)
    }]
const handleSelect = async (key: number, options: any, item: any, index: any) => {
    if(key === 1) message.info('正在开发中...')
    if (key === 2) {
        dialog.warning({
            title: '警告',
            content: '你确定要删除？',
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                // console.log(key, options, item)
                const result = await deleteDialogTitle(api_base_url, item.id, stores.token)
                if (result.type === 'success') {
                    stores.dialog_list.length = 0
                    stores.dialog_titles.splice(index, 1)
                    message.success('删除成功')
                    return
                }
                message.success('删除失败')
            },
            onNegativeClick: () => {
                // message.error('不确定')
            }
        })
    }
}
</script>