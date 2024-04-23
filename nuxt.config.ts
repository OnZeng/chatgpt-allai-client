// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
export default defineNuxtConfig({
  app: {
    head: {
      title: "Chat AI",
      meta: [
        { charset: "utf-8" },
        {
          name: "description",
          content:
            "我们的人工智能聊天机器人可提供卓越的客户支持，帮助您解决问题和回答疑问。立即与我们互动，享受高效、便捷的客户服务体验！",
        },
        {
          name: "keywords",
          content: "人工智能， 聊天机器人， 客户支持， 问题解答， 在线客服",
        },
        {
          name: "author",
          content: "Chat AI",
        },
        {
          name: "og:title",
          content: "Your Company Name - 客户支持的人工智能聊天机器人",
        },
        {
          name: "og:description",
          content:
            "我们的人工智能聊天机器人可提供卓越的客户支持，帮助您解决问题和回答疑问。立即与我们互动，享受高效、便捷的客户服务体验！",
        },
        {
          name: "og:image",
          content: "https://chatgpt.com/og-image.jpg",
        },
        {
          name: "og:url",
          content: "https://chatgpt.com",
        },
        {
          name: "og:type",
          content: "website",
        },
        {
          name: "twitter:title",
          content: "Your Company Name - 客户支持的人工智能聊天机器人",
        },
        {
          name: "twitter:description",
          content:
            "我们的人工智能聊天机器人可提供卓越的客户支持，帮助您解决问题和回答疑问。立即与我们互动，享受高效、便捷的客户服务体验！",
        },
        {
          name: "og:title",
          content: "Your Company Name - 客户支持的人工智能聊天机器人",
        },
        {
          name: "og:description",
          content:
            "我们的人工智能聊天机器人可提供卓越的客户支持，帮助您解决问题和回答疑问。立即与我们互动，享受高效、便捷的客户服务体验！",
        },
        { name: "viewport", content: "width=device-width, initial-scale=1" },

        { name: "theme-color", content: "#ffffff" },

        { name: "msapplication-TileColor", content: "#ffffff" },
        { name: "msapplication-TileImage", content: "/favicon.ico" },
      ],
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/favicon.ico",
        },
        { rel: "shortcut icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/favicon.ico" },
      ],
    },
  },
  ssr: true,
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  devServer: {
    host: "127.0.0.1",
    port: Number(process.env.PORT),
  },
  devtools: { enabled: false },
  modules: ["@pinia/nuxt"],
  build: {
    transpile:
      process.env.NODE_ENV === "production"
        ? [
            "naive-ui",
            "vueuc",
            "@css-render/vue3-ssr",
            "@juggle/resize-observer",
            "date-fns",
            "@css-render/plugin-bem",
          ]
        : ["@juggle/resize-observer"],
  },
  vite: {
    plugins: [
      Components({
        dts: true,
        resolvers: [NaiveUiResolver()],
      }),
    ],
  },
  runtimeConfig: {
    public: {
      api_base_url: process.env.VITE_BASE_URL,
    },
  },
});
