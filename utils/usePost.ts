type modeType = "初始化" | "刷新" | "标准";
/**
 * @description 封装POST请求
 * @param url 请求地址
 * @param data 携带的参数
 */
export default async function usePost(url: string, mode: modeType, data: any) {
  return await http(url, mode, "POST", data);
}
