/**
 * @description 错误处理1
 */
export function errorHandler1(err: any, message: any) {
  const stores = useUserStore();
  stores.$state.userinfo = {};
  stores.$state.token = null;
  stores.$state.dialog_index = 1000;
  stores.$state.dialog_list = [];
  stores.$state.dialog_contents = [];
  stores.$state.dialog_titles = [];
  window.localStorage.removeItem("userinfo");
  window.localStorage.removeItem("token");
  message.error(err.data.message);
}

/**
 * @description 错误处理2
 */
export function errorHandler2(err: any, message: any) {
  const stores = useUserStore();
  stores.$state.userinfo = {};
  stores.$state.token = null;
  stores.$state.dialog_index = 1000;
  stores.$state.dialog_list = [];
  stores.$state.dialog_contents = [];
  stores.$state.dialog_titles = [];
  window.localStorage.removeItem("userinfo");
  window.localStorage.removeItem("token");
  message.error(err.data.message);
}
