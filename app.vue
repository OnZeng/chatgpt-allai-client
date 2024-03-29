<template>
  <NConfigProvider style="width: 100%; height: 100%" :inline-theme-disabled="true"
    :theme="stores.theme === 'light' ? null : darkTheme">
    <n-global-style />
    <NDialogProvider>
      <NMessageProvider>
        <div style="width: 100%; height: 100%" v-show="is">
          <NuxtLayout>
            <template #header>
              <ai-setting />
            </template>
            <template #main>
              <NuxtPage />
            </template>
          </NuxtLayout>
        </div>
        <ai-loading style="width: 100%;height: 100%;" v-if="!is" />
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>
<script setup lang="ts">
import './assets/app.css'
import { darkTheme } from 'naive-ui'
import { get_local_theme, get_local_token, get_local_userinfo } from './utils/common/index'

const stores = useUserStore()
const { public: { api_base_url } } = useRuntimeConfig()
const is = ref(false)
const time_r: any = ref(null);

// onBeforeMount(() => {
//   const checkConsole = () => {
//     // 检查是否有 console 输出
//     console.log('Checking console...');
//     window.location.replace('about:blank');
//   };

//   time_r.value = setInterval(() => {
//     // 检查是否有新的 console 输出
//     checkConsole();
//   }, 1000);
//   window.addEventListener("keydown", (event) => {
//     // 示例：在页面加载后 3 秒钟后检查控制台是否已经打开
//     setTimeout(() => {
//       if (!isConsoleOpened) {
//         console.log('控制台未打开！');
//       }
//     }, 3000);
//     // 初始化一个标志位，表示控制台是否被打开
//     let isConsoleOpened = false;

//     // 保存原始的 console.log 方法
//     const originalConsoleLog = console.log;

//     // 重写 console.log 方法
//     console.log = function () {
//       // 如果控制台被打开且尚未设置标志位，则更新标志位并执行相关操作
//       if (!isConsoleOpened) {
//         isConsoleOpened = true;
//         console.warn('控制台已打开！');
//         window.location.replace('about:blank');
//         // 这里可以执行你想要的其他操作，比如记录日志或跳转到其他页面
//       }
//       // 调用原始的 console.log 方法
//       originalConsoleLog.apply(console, arguments);
//     };
//     // 禁止 F12 键
//     if (event.keyCode === 123) {
//       event.preventDefault();
//     }

//     // 禁止 Ctrl + Shift + I 打开控制台
//     if (event.ctrlKey && event.shiftKey && event.keyCode === 73) {
//       event.preventDefault();
//     }
//   });
// })


onMounted(async () => {
  is.value = true
  //读取本地主题
  stores.theme = get_local_theme()
  stores.token = get_local_token()
  stores.userinfo = get_local_userinfo()
  if (!stores.token) return
  stores.userinfo = await getuserinfo(api_base_url, stores.token)
})

onUnmounted(() => {
  window.removeEventListener('keydown', (event) => {
  })
  window.clearInterval(time_r)
})
</script>
