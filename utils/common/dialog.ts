/**
 * @description 输出数据·
 */
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
