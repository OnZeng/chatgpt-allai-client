<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="login-box1">
        <n-card class="login-box2">
            <div class="login-box3">
                <n-card title="更新日志">
                    <n-scrollbar style="max-height: 400px">
                        我们在田野上面找猪<br>
                        想象中已找到了三只<br>
                        小鸟在白云上面追逐<br>
                        它们在树底下跳舞<br>
                        啦啦啦啦啦啦啦啦咧<br>
                        啦啦啦啦咧<br>
                        我们在想象中度过了许多年<br>
                        想象中我们是如此的疯狂<br>
                        我们在城市里面找猪<br>
                        想象中已找到了几百万只<br>
                        小鸟在公园里面唱歌<br>
                        它们独自在想象里跳舞<br>
                        啦啦啦啦啦啦啦啦咧<br>
                        啦啦啦啦咧<br>
                        我们在想象中度过了许多年<br>
                        许多年之后我们又开始想象<br>
                        啦啦啦啦啦啦啦啦咧
                        想象中我们是如此的疯狂<br>
                        我们在城市里面找猪<br>
                        想象中已找到了几百万只<br>
                        小鸟在公园里面唱歌<br>
                        它们独自在想象里跳舞<br>
                        啦啦啦啦啦啦啦啦咧<br>
                        啦啦啦啦咧<br>
                        我们在想象中度过了许多年<br>
                        许多年之后我们又开始想象<br>
                        啦啦啦啦啦啦啦啦咧
                    </n-scrollbar>
                </n-card>
                <n-card>
                    <n-tabs class="card-tabs" default-value="signin" size="large" animated
                        pane-wrapper-style="margin: 0 -4px"
                        pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;">
                        <n-tab-pane name="signin" tab="登录">
                            <n-form ref="loginFormRef" :model="loginForm" :rules="rules">
                                <n-form-item-row label="用户名" path="email">
                                    <n-input v-model:value="loginForm.email" placeholder="输入邮箱" />
                                </n-form-item-row>
                                <n-form-item-row label="密码" path="password">
                                    <n-input v-model:value="loginForm.password" placeholder="输入密码" />
                                </n-form-item-row>
                            </n-form>
                            <n-button type="primary" block secondary strong @click="onSubmit">
                                登录
                            </n-button>
                        </n-tab-pane>
                        <n-tab-pane name="signup" tab="注册">
                            <n-form ref="registerFormRef" :model="registerForm" :rules="rules">
                                <n-form-item-row label="用户名" path="email">
                                    <n-input v-model:value="registerForm.email" placeholder="输入邮箱" />
                                </n-form-item-row>
                                <n-form-item-row label="密码" path="password">
                                    <n-input v-model:value="registerForm.password" placeholder="输入密码" />
                                </n-form-item-row>
                                <n-form-item-row label="重复密码" path="repeat_password">
                                    <n-input v-model:value="registerForm.repeat_password" placeholder="输入密码" />
                                </n-form-item-row>
                                <n-form-item-row label="验证码" path="code">
                                    <n-input v-model:value="registerForm.code" placeholder="输入验证码">
                                        <template #suffix>
                                            <n-button type="primary" text
                                                @click="onSendCode">发送验证码</n-button>
                                        </template>
                                    </n-input>
                                </n-form-item-row>
                            </n-form>
                            <n-button type="primary" block secondary strong @click="onRegisterSubmit">
                                注册
                            </n-button>
                        </n-tab-pane>
                    </n-tabs>
                </n-card>
            </div>
        </n-card>
    </div>
</template>
<script setup lang="ts">
import '../assets/login.css'
import { useMessage } from 'naive-ui'
import { login } from '@/API/index'
import { rules, registerFormRef, loginFormRef } from '@/utils/index'

const message = useMessage()
const { public: { api_base_url } } = useRuntimeConfig()

const loginForm = ref({
    email: '',
    password: ''
})
const registerForm = ref({
    email: '',
    password: '',
    repeat_password: '',
    code: ''
})

// 登录
const onSubmit = async () => {
    const feedback = await loginFormRef.value?.validate()
    if (!feedback) {
        return
    } else {
        const data = await login(api_base_url, loginForm.value)
        if (data.type === 'success') {
            message.success(data.message)
        } else {
            message.error(data.message)
        }
    }
}

// 注册
const onRegisterSubmit = async () => {
    const feedback = await registerFormRef.value?.validate()
    if (!feedback) {
        return
    } else {

    }
}

// 验证码
const onSendCode = async (event: any) => {
    event.preventDefault()
}
</script>