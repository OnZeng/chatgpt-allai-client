/**
 * @description 注册
 */
export default async function register(url: string, data: any) {
  const res = await fetch(url + "/api/user/register", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  return await res.json();
}
