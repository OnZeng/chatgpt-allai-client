import { defineStore } from "pinia";
import { useRouter } from "vue-router";
import { output } from "~/utils/common/index";
import dialog_http from "~/utils/dialog_http";

export const useUserStore = defineStore("userInfo", () => {
  const {
    public: { api_base_url },
  } = useRuntimeConfig();
  const router = useRouter();
  // 主题
  const theme = ref("light");
  // 用户会话
  const token: any = ref(null);
  // 用户信息
  const userinfo: any = ref({
    nickName: "",
    role: "",
    avatar: "",
    email: "",
    createdAt: "",
    useCount: 0,
    tokens: 0,
  });
  // 控制对话是否正在进行中
  const dialog_is = ref(true);
  // 中止对话
  const dialog_finish = ref(false);
  // 元素
  const el2: any = ref(null);
  // 是否显示对话
  const dialog_laoding = ref(false);
  // 初始化静态数据
  const list = ref([
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
  // 对话页面信息
  const account = ref({
    Avatar: "https://img.lzxjack.top:99/202203311718517.webp",
    AI_Icon: "https://img2.imgtp.com/2024/03/31/Fy7KJNCP.png",
  });
  // 当前模型
  const chatgpt_model = ref({
    model: "gpt-3.5-turbo",
    temperature: 0.5,
  });
  //我的全部对话标题
  const dialog_titles: any = ref([]);
  //我的全部对话记录
  const dialog_contents: any = ref([]);
  //当前对话索引
  const dialog_index = ref(1000);
  // 当前对话记录
  const dialog_list: any = ref([]);
  // 当前角色
  const myinfo: any = ref({
    role: "user",
    content: null,
  });
  // 处理回车发送消息
  const handleEnter = async (event: any) => {
    if (!checkLogin()) {
      return;
    }
    if (event.shiftKey) {
      //换行
    } else {
      if (myinfo.value.content === null) return;
      if (myinfo.value.content.trim() === "") return;
      dialog_finish.value = false;
      dialog_list.value.push(JSON.parse(JSON.stringify(myinfo.value)));
      // 滚动
      rollToTheBottom();
      dialog_is.value = false;
      dialog_laoding.value = false;
      myinfo.value.content = null;
      // 请求对话
      const result: any = await dialog_http(
        api_base_url,
        chatgpt_model.value.model,
        dialog_list.value,
        chatgpt_model.value.temperature,
        token.value,
        dialog_index.value
      );
      // console.log(res.headers.get("Content-Type"));
      if (!result.body) return;
      const reader = result.body.getReader();
      // 调用流式输出
      output(reader, dialog_list, dialog_is, dialog_finish, rollToTheBottom);
      // 获取用户信息
      const result2: any = await useGet("/api/user/getInfo", "刷新", null);
      if (result2.type === "success") {
        // 获取会话记录
        const result3 = await useGet("/api/dialog/getlist", "刷新", null);
        // 新会话?
        if (dialog_index.value === 1000) {
          dialog_index.value =
            result3.data.titles[result3.data.titles.length - 1].id;
        }
      }
    }
  };
  // 停止响应
  const stopAnswer = () => {
    dialog_is.value = true;
    dialog_finish.value = true;
  };
  // 滚动条自动滚动
  const rollToTheBottom = async () => {
    await nextTick();
    el2.value.scrollTop = el2.value.scrollHeight;
  };
  // 登录检测
  const checkLogin = () => {
    if (!token.value) {
      // window.location.href = "/login";
      router.push("/login");
      return false;
    } else {
      return true;
    }
  };
  // 新会话
  const newDialog = async () => {
    dialog_list.value.length = 0;
    dialog_index.value = 1000;
  };
  // 切换会话
  const changeDialog = async (item: any) => {
    dialog_list.value.length = 0;
    dialog_index.value = item.id;
    dialog_contents.value.map((item: any) => {
      if (item.d_id === dialog_index.value) {
        const temp = {
          role: item.role,
          content: item.content,
        };
        dialog_list.value.push(temp);
      }
    });
    rollToTheBottom();
  };
  return {
    list,
    dialog_list,
    myinfo,
    dialog_laoding,
    chatgpt_model,
    account,
    dialog_is,
    el2,
    token,
    theme,
    userinfo,
    dialog_titles,
    dialog_contents,
    dialog_index,
    stopAnswer,
    handleEnter,
    rollToTheBottom,
    checkLogin,
    newDialog,
    changeDialog,
  };
});
