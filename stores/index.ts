import { defineStore } from "pinia";
import { dialog_http } from "@/API/index";
import { output } from "@/utils/index";
export const useUserStore = defineStore("userInfo", () => {
  //控制对话是否正在进行中
  const IS = ref(true);
  //是否显示对话
  const Dialog_Laoding = ref(false);
  //初始化静态数据
  const List = ref([
    {
      role: "🧐 提出复杂问题",
      content: "我可以为我挑剔的只吃橙色食物的孩子做什么饭?",
    },
    {
      role: "🙌 获取更好的答案",
      content: "销量最高的 3 种宠物吸尘器有哪些优点和缺点?",
    },
    {
      role: "🎨 获得创意灵感",
      content: "以海盗的口吻写一首关于外太空鳄鱼的俳句",
    },
  ]);
  //账号信息
  const Account = ref({
    Avatar: "https://img.lzxjack.top:99/202203311718517.webp",
    AI_Icon: "_nuxt/assets/images/icon.png",
  });
  //模型
  const Chatgpt_Model = ref({
    model: "gpt-3.5-turbo",
    temperature: 0.5,
  });
  //当前对话记录
  const Dialog_List: any = ref([]);
  //当前角色
  const MyInfo: any = ref({
    role: "user",
    content: null,
  });
  // 处理回车发送消息
  const handleEnter = async (event: any) => {
    if (event.shiftKey) {
      //换行
    } else {
      Dialog_List.value.push(JSON.parse(JSON.stringify(MyInfo.value)));
      // emit("getElementHeightDynamically");
      IS.value = false;
      Dialog_Laoding.value = false;
      // event.preventDefault()
      MyInfo.value.content = null;
      //发送请求
      const res: any = await dialog_http(
        Chatgpt_Model.value.model,
        Dialog_List.value,
        Chatgpt_Model.value.temperature
      );
      if (res === "请求失败") {
        IS.value = true;
        return;
      }
      console.log(res);
      if (!res.body) return;
      const reader = res.body.getReader();
      //调用流式输出
      output(reader, Dialog_List, IS);
    }
  };
  return {
    List,
    Dialog_List,
    MyInfo,
    handleEnter,
    Dialog_Laoding,
    Chatgpt_Model,
    Account,
    IS,
  };
});
