// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
export default defineNuxtConfig({
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
