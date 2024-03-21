//解析数据
export function parsePack(str: any) {
  // 定义正则表达式匹配模式
  const pattern = /data:\s*({.*?})\s*\n/g;
  // 定义一个数组来存储所有匹 配到的 JSON 对象
  const result = [];
  // 使用正则表达式匹配完整的 JSON 对象并解析它们
  let match;
  while ((match = pattern.exec(str)) !== null) {
    const jsonStr = match[1];
    try {
      const json = JSON.parse(jsonStr);
      result.push(json);
    } catch (e) {
      console.log(e);
    }
  }
  // 输出所有解析出的 JSON 对象
  return result;
}
//输出
export async function output(
  reader: any,
  dialog_list: any,
  dialog_is: any,
  dialog_finish: any,
  emit: any
) {
  const decoder = new TextDecoder();
  let count = 0;
  while (!dialog_finish.value) {
    const { done, value } = await reader.read();
    if (done) {
      dialog_finish.value = true;
      dialog_is.value = false;
      break;
    }
    // eslint-disable-next-line no-unused-vars
    count++;
    const jsonArray = parsePack(decoder.decode(value));
    // console.log(jsonArray)
    // break
    if (count === 1) {
      dialog_list.value.push(jsonArray[0].choices[0].delta);
    }
    jsonArray.forEach((item: any) => {
      // console.log(item.choices[0].delta.content)
      if (
        !item.choices ||
        item.choices.length === 0 ||
        item.choices[0].delta.content === undefined
      ) {
        return;
      }
      const a = item.choices[0].delta.content;
      // console.log(a)
      dialog_list.value[dialog_list.value.length - 1].content += a;
    });
    // emit("getElementHeightDynamically");
    emit()
  }
}
