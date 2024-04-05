<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="login-box1">
        <n-card class="login-box2">
            <div class="login-box3">
                <n-card title="更新日志" class="login-notice">
                    <n-scrollbar style="max-height: 400px">
                        <p>2024-4-4</p>
                        <p>1.支持多会话</p>
                        <p>2.修复部分bug</p>
                        开源地址：<a href="https://gitee.com/zmzm666/chatgpt-allai-client" target="_blank">gitee</a>&nbsp;
                        <a href="https://github.com/OnZeng/chatgpt-allai-client" target="_blank">github</a>
                        <br />
                        <p>交流群</p>
                        <img style="width: 100px;height: 100px;" src="../images/wx.png">
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
                            <n-button type="primary" block secondary strong @click="onSubmit" :loading="logining">
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
                                            <n-button type="primary" text @click="onSendCode" :loading="codeing">{{
                                                codeTimeText }}</n-button>
                                        </template>
                                    </n-input>
                                </n-form-item-row>
                            </n-form>
                            <n-button type="primary" block secondary strong @click="onRegisterSubmit"
                                :loading="registering">
                                注册
                            </n-button>
                        </n-tab-pane>
                        <n-tab-pane name="notice" tab="关于" v-if="is_notice < 601">
                            <n-scrollbar style="max-height: 400px">
                                <p>2024-4-4</p>
                                <p>1.支持多会话</p>
                                <p>2.修复部分bug</p>
                                开源地址：<a href="https://gitee.com/zmzm666/chatgpt-allai-client"
                                    target="_blank">gitee</a>&nbsp;
                                <a href="https://github.com/OnZeng/chatgpt-allai-client" target="_blank">github</a>
                                <br />
                                <p>交流群</p>
                                <img style="width: 100px;height: 100px;" src="../images/wx.png">
                            </n-scrollbar>
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
import { loginFormRef, registerFormRef, rules } from '@/utils/common/index'

const router = useRouter()
const stores = useUserStore()
const message = useMessage()
const { public: { api_base_url } } = useRuntimeConfig()

const is_notice = ref(601)
const codeTimeInterval: any = ref(0)
const codeTimeText = ref('发送验证码')
const codeing = ref(false)
const registering = ref(false)
const logining = ref(false)
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
    }
    logining.value = true
    const result = await login(api_base_url, loginForm.value)
    logining.value = false
    if (result.type === 'success') {
        stores.token = result.token
        stores.userinfo = result.data
        window.localStorage.setItem('token', result.token)
        window.localStorage.setItem('userinfo', JSON.stringify(result.data))
        const result2 = await getDialogList(api_base_url, stores.token);
        stores.dialog_contents = result2.contents;
        stores.dialog_titles = result2.titles;
        // 页面初始化
        if (stores.dialog_contents.length > 0) {
            if (stores.userinfo.dialog_id === 1000) {
                stores.dialog_index = stores.dialog_titles[stores.dialog_titles.length - 1].id
            } else {
                stores.dialog_index = stores.userinfo.dialog_id
            }
            // console.log(stores.dialog_index)
            stores.dialog_contents.map((item: any) => {
                if (item.d_id === stores.dialog_index) {
                    let temp = {
                        role: item.role,
                        content: item.content
                    }
                    stores.dialog_list.push(temp)
                }
            });
            setTimeout(() => {
                stores.rollToTheBottom()
            }, 100);
        }
        message.success(result.message)
        router.push('/')
    } else {
        message.error(result.message)
    }

}

// 注册
const onRegisterSubmit = async () => {
    const feedback = await registerFormRef.value?.validate()
    if (!feedback) {
        return
    }
    registering.value = true
    const res = await register(api_base_url, registerForm.value)
    registering.value = false
    if (res.type === 'success') {
        message.success(res.message)
        registerForm.value.email = ''
        registerForm.value.password = ''
        registerForm.value.repeat_password = ''
        registerForm.value.code = ''
    } else {
        message.error(res.message)
    }

}

// 验证码
const onSendCode = async (event: any) => {
    event.preventDefault()
    const pattern =
        /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (!pattern.test(registerForm.value.email)) {
        message.error('请输入正确的邮箱')
        return
    }
    if (codeTimeInterval.value > 0) {
        return
    }
    codeing.value = true
    const res = await sendcode(api_base_url, registerForm.value.email)
    codeing.value = false
    if (res.type === 'success') {
        message.success(res.message)
        codeTimeInterval.value = 60
        const tempTime = window.setInterval(() => {
            codeTimeInterval.value--
            window.sessionStorage.setItem('codeTimeInterval', codeTimeInterval.value)
            codeTimeText.value = codeTimeInterval.value + 's'
            if (codeTimeInterval.value <= 0) {
                codeTimeText.value = '发送验证码'
                codeTimeInterval.value = 0
                window.clearInterval(tempTime)
            }
        }, 1000)
    } else {
        message.error(res.message)
    }
}
onMounted(() => {
    window.onresize = function () {
        // console.log("宽度", document.documentElement.clientWidth);
        is_notice.value = document.documentElement.clientWidth
    };
    if (stores.token) {
        router.push('/')
    }
})
onUnmounted(() => {
    window.removeEventListener('resize', () => {
    })
})
</script>