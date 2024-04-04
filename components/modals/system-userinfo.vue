<template>
    <n-card>
        <n-thing>
            <template #avatar>
                <n-avatar :src="stores.userinfo.avatar" />
            </template>
            <template #header>
                {{ stores.userinfo.nickName }}
            </template>
            <template #header-extra>
                <n-button @click="logout">退出登录</n-button>
            </template>
            <template #description>
                {{ stores.userinfo.role }}
            </template>
            <template #footer>
                <n-table :single-line="false">
                    <thead>
                        <tr>
                            <th>剩余次数</th>
                            <th>对话次数</th>
                            <th>tokens</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{{ stores.userinfo.canCount }}</td>
                            <td>{{ stores.userinfo.useCount }}</td>
                            <td>{{ stores.userinfo.tokens }}</td>
                        </tr>
                    </tbody>
                </n-table>
            </template>
            <template #action>
                <n-flex>
                    <n-button disabled>修改头像</n-button>
                    <n-button disabled>修改密码</n-button>
                </n-flex>
            </template>
        </n-thing>
    </n-card>
</template>
<script setup lang="ts">
const stores = useUserStore()
const router = useRouter()
// 退出登录
const logout = () => {
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('userinfo')
    window.location.href = '/'
}
</script>