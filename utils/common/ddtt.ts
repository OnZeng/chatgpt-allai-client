//解析数据
export function parsePack(str: any) {
  // console.log(JSON.parse(str));
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
  // const result = str;
  // 输出所有解析出的 JSON 对象
  return result;
}

/**
 * @description 输出二
 */
export async function output2(
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
    // console.log(value);
    if (done) {
      dialog_finish.value = true;
      dialog_is.value = true;
      break;
    }
    count++;
    const jsonArray = decoder.decode(value);
    // console.log(jsonArray);
    if (count === 1) {
      dialog_list.value.push({ role: "assistant", content: "" });
    }
    dialog_list.value[dialog_list.value.length - 1].content += jsonArray;
    emit();
  }
}
