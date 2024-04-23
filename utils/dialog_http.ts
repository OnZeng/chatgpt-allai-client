// 使用chatpgt模型
export default async function dialog_http(
  url: string,
  model: string,
  messages: any,
  temperature: number,
  token: string,
  id: any
) {
  return await fetch(url + "/api/dialog/v1", {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    method: "post",
    body: JSON.stringify({
      model,
      messages,
      temperature,
      id:id,
    }),
  });
}
