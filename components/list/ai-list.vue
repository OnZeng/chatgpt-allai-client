<template>
  <n-drawer-content closable>
    <template #header>
      <n-button type="primary" @click="stores.newDialog">新建会话</n-button>
    </template>
    <template #default>
      <n-scrollbar style="max-height: 100%">
        <n-list
          v-bind:key="index"
          hoverable
          clickable
          v-for="(item, index) in stores.dialog_titles"
          :bordered="stores.dialog_index === item.id"
          @click="stores.changeDialog(item)"
        >
          <n-list-item>
            <template #default>
              <div class="list-list-box2">{{ item.title }}</div>
            </template>
            <template #suffix>
              <div class="list-list-box3">
                <n-dropdown
                  :options="options"
                  trigger="hover"
                  @select="handleSelect($event, options, item, index)"
                >
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
import "./ai-list.css";
import {
  EllipsisHorizontalOutline,
  TrashOutline,
  Pencil,
} from "@vicons/ionicons5";
import { NIcon, useDialog, useMessage, NInput } from "naive-ui";

const message = useMessage();
const dialog = useDialog();
const stores = useUserStore();

const renderIcon = (icon: Component) => {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon),
    });
  };
};
const options: any = [
  {
    label: "重命名",
    key: 1,
    icon: renderIcon(Pencil),
  },
  {
    label: "删除",
    key: 2,
    icon: renderIcon(TrashOutline),
  },
];
const handleSelect = async (
  key: number,
  options: any,
  item: any,
  index: any
) => {
  let tempTitle = ref("");
  if (key === 1) {
    dialog.info({
      title: "信息",
      content: () => {
        return h(NInput, {
          type: "text",
          value: tempTitle.value,
          placeholder: "请输入新的标题",
          onUpdateValue: (value) => {
            tempTitle.value = value;
          },
        });
      },
      positiveText: "确定",
      negativeText: "取消",
      onPositiveClick: async () => {
        if (tempTitle.value === "") return;
        if (tempTitle.value.trim() === "") return;
        // 重命名
        const result = await usePost("/api/dialog/updatetitle", "标准", {
          id: item.id,
          title: tempTitle.value.trim(),
        });
        if (result.type === "success") {
          stores.dialog_titles[index].title = tempTitle.value;
          message.success("重命名成功");
          return;
        }
        message.success("重命名失败");
      },
    });
  }
  if (key === 2) {
    dialog.warning({
      title: "警告",
      content: "你确定要删除？",
      positiveText: "确定",
      negativeText: "取消",
      onPositiveClick: async () => {
        // console.log(key, options, item)
        const result = await usePost("/api/dialog/deletetitle", "标准", {
          id: item.id,
        });
        if (result.type === "success") {
          stores.dialog_list.length = 0;
          stores.dialog_titles.splice(index, 1);
          message.success("删除成功");
          return;
        }
        message.success("删除失败");
      },
    });
  }
};
</script>
