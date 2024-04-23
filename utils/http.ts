import { createDiscreteApi, darkTheme, lightTheme } from "naive-ui";
import { login, refreshDialog, getInfo } from "./responseHandler/success";
import { errorHandler1, errorHandler2 } from "./responseHandler/error";
/**
 * @description 封装$fetch请求
 */
export async function http(url: string, mode: string, method: any, data: any) {
  const stores = useUserStore();
  const {
    public: { api_base_url },
  } = useRuntimeConfig();
  const configProviderPropsRef = computed(() => ({
    theme: stores.$state.theme === "light" ? lightTheme : darkTheme,
  }));
  const { message } = createDiscreteApi(["message"], {
    configProviderProps: configProviderPropsRef,
  });
  const option = {
    method,
    body: data,
    query: data,
    headers: {
      "Content-Type": "application/json",
      Authorization: stores.$state.token,
    },
  };
  if (method === "GET") {
    delete option.body;
  } else {
    delete option.query;
  }
  return await $fetch(api_base_url + url, option)
    .then(async (result: any) => {
      if (url === "/api/user/login") login(result);
      if (url === "/api/user/getInfo") getInfo(result, mode);
      if (url === "/api/dialog/getlist") refreshDialog(result, mode);
      return result;
    })
    .catch((err) => {
      // 错误处理
      if (url === "/api/user/getInfo") errorHandler1(err, message);
      if (url === "/api/dialog/getlist") errorHandler2(err, message);
      return err.data;
    });
}
