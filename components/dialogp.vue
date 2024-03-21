<template>
  <div class="d-box1">
    <div class="d-box2">
      <template v-for="item in stores.Dialog_List" v-bind:key="item.id">
        <div :class="[item.role == stores.MyInfo.role ? 'd-right' : 'd-left']">
          <div class="d-box3">
            <img
              class="d-img1"
              :src="
                item.role == stores.MyInfo.role
                  ? stores.Account.Avatar
                  : stores.Account.AI_Icon
              "
            />
          </div>
          <div
            :class="[
              item.role == stores.MyInfo.role
                ? 'd-right-style'
                : 'd-left-style',
            ]"
            v-html="mdi.render(item.content)"
          ></div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import "../assets/dialog.css";
import { useUserStore } from "../stores/index";
import MarkdownIt from "markdown-it";
import mdKatex from "@traptitech/markdown-it-katex";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark-reasonable.css";

const stores = useUserStore();

const mdi = new MarkdownIt({
  linkify: true,
  highlight(code: any, language: any) {
    // 当前时间加随机数生成唯一的id标识
    const codeIndex =
      parseInt(Date.now()) + Math.floor(Math.random() * 10000000);
    const validLang = !!(language && hljs.getLanguage(language));
    if (validLang) {
      const lang = language ?? "";
      return highlightBlock(
        hljs.highlight(lang, code, true).value,
        lang,
        codeIndex
      );
    }
    return highlightBlock(hljs.highlightAuto(code).value, "", codeIndex);
  },
});
mdi.use(mdKatex, {
  blockClass: "katexmath-block rounded-md p-[0px]",
  errorColor: " #cc0000",
});

function highlightBlock(str: any, lang: any, codeIndex: any) {
  return `<pre class="pre-code-box"><div class="pre-code-header"><span class="code-block-header__lang">${lang}</span><span class="code-block-header__copy" data-clipboard-action="copy" data-clipboard-target="#copy${codeIndex}">复制代码</span></div><div class="pre-code" id="copy${codeIndex}"><code class="hljs code-block-body ${lang}">${str}</code></div></pre>`;
}
</script>
<style scoped>
:deep() .pre-code-header {
  position: relative;
  background-color: rgb(52, 53, 65);
  color: white;
}
:deep() .code-block-header__copy {
  position: absolute;
  cursor: pointer;
  right: 4px;
}
:deep() .code-block-header__lang {
  margin-left: 4px;
}
</style>
