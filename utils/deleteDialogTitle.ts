/**
 * @description 删除对话标题
 */
export default async function (url: string, id: number, token: string) {
  const res = await fetch(url + "/api/dialog/deletetitle", {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    method: "POST",
    body: JSON.stringify({
      id: id,
    }),
  });
  return await res.json();
}
