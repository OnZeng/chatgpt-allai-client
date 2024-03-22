<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="login-box1">
        <n-card class="login-box2">
            <div class="login-box3">
                <n-card title="更新日志">
                    <n-scrollbar style="max-height: 360px">
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
                            <n-form>
                                <n-form-item-row label="用户名">
                                    <n-input />
                                </n-form-item-row>
                                <n-form-item-row label="密码">
                                    <n-input />
                                </n-form-item-row>
                            </n-form>
                            <n-button type="primary" block secondary strong>
                                登录
                            </n-button>
                        </n-tab-pane>
                        <n-tab-pane name="signup" tab="注册">
                            <n-form>
                                <n-form-item-row label="用户名">
                                    <n-input />
                                </n-form-item-row>
                                <n-form-item-row label="密码">
                                    <n-input />
                                </n-form-item-row>
                                <n-form-item-row label="重复密码">
                                    <n-input />
                                </n-form-item-row>
                            </n-form>
                            <n-button type="primary" block secondary strong>
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
</script>