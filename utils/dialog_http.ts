// 使用chatpgt模型
export default async function dialog_http(
  url: string,
  model: any,
  messages: any,
  temperature: any,
  token: any,
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
      stream: true,
      id:id,
    }),
  });
}
