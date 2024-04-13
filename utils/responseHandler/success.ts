/**
 * @description 登录处理
 */
export function login(result: any) {
  const stores = useUserStore();
  stores.$state.token = result.token;
  stores.$state.userinfo = result.data;
  window.localStorage.setItem("token", result.token);
  window.localStorage.setItem("userinfo", JSON.stringify(result.data));
}

/**
 * @description 会话(初始化或刷新)
 */
export function refreshDialog(result: any, mode: string) {
  if (mode === "刷新") return refreshDialog_(result);
  initDialog(result);
}

/**
 * @description 刷新会话
 */
export function refreshDialog_(result: any) {
  const stores = useUserStore();
  stores.$state.dialog_contents = result.data.contents;
  stores.$state.dialog_titles = result.data.titles;
}
/**
 * @description 初始化会话
 */
export function initDialog(result: any) {
  const stores = useUserStore();
  stores.$state.dialog_contents = result.data.contents;
  stores.$state.dialog_titles = result.data.titles;
  // console.log(stores.$state.dialog_contents);
  // 页面初始化
  if (stores.$state.dialog_contents.length > 0) {
    if (stores.$state.userinfo.dialog_id === 1000) {
      stores.$state.dialog_index =
        stores.$state.dialog_titles[stores.$state.dialog_titles.length - 1].id;
    } else {
      stores.$state.dialog_index = stores.$state.userinfo.dialog_id;
    }
    // console.log(stores.dialog_index)
    stores.$state.dialog_contents.map((item: any) => {
      if (item.d_id === stores.$state.dialog_index) {
        let temp = {
          role: item.role,
          content: item.content,
        };
        stores.$state.dialog_list.push(temp);
      }
    });
    setTimeout(() => {
      stores.rollToTheBottom();
    }, 100);
  }
}

/**
 * @description 获取用户信息
 */
export function getInfo(result: any, mode: string) {
  const stores = useUserStore();
  stores.$state.userinfo = result.data;
  window.localStorage.setItem(
    "userinfo",
    JSON.stringify(stores.$state.userinfo)
  );
  if (mode === "刷新") {
    stores.$state.dialog_index = stores.$state.userinfo.dialog_id;
  }
}
