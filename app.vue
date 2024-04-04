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



onMounted(async () => {
  is.value = true
  //读取本地数据
  stores.theme = get_local_theme()
  stores.token = get_local_token()
  stores.userinfo = get_local_userinfo()
  if (!stores.token) return
  // 获取最新数据
  const result: any = await getuserinfo(api_base_url, stores.token)
  if (result.type === "error") {
    window.localStorage.removeItem("userinfo");
    window.localStorage.removeItem("token");
    return
  }
  stores.userinfo = result
  window.localStorage.setItem('userinfo', JSON.stringify(stores.userinfo))
  const result2 = await getDialogList(api_base_url, stores.token)
  stores.dialog_contents = result2.contents
  stores.dialog_titles = result2.titles
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
    stores.rollToTheBottom()
  }
})
</script>
