/**
 * @description 修改对话标题
 */
export default async function (
  url: string,
  id: number,
  title: string,
  token: string
) {
  const res = await fetch(url + "/api/dialog/updatetitle", {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    method: "POST",
    body: JSON.stringify({
      id: id,
      title: title,
    }),
  });
  return await res.json();
}
