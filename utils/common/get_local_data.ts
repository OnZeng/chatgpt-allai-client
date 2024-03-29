export function get_local_theme() {
  const localData = localStorage.getItem("theme");
  if (localData) {
    return localData;
  } else {
    return "light";
  }
}
export function get_local_token() {
  return window.localStorage.getItem("token");
}
export function get_local_userinfo() {
  if (!window.localStorage.getItem("userinfo")) {
    return;
  }
  try {
    const local_data: any = window.localStorage.getItem("userinfo");
    return JSON.parse(local_data);
  } catch (error) {
    return;
  }
}
