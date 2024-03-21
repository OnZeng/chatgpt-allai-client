//使用chatpgt模型
export async function dialog_http(model: any, messages: any, temperature: any) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer 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",
    },
    method: "post",
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: true,
    }),
  })
    .then((response) => {
      return response;
    })
    .catch(() => {
      return "请求失败";
    });
}
