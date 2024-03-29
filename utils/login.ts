/**
 * @description 登录
 */
export default async function login(url: string, data: any) {
  const res = await fetch(url + "/api/user/login", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  return await res.json();
}
