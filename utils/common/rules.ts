export const loginFormRef: any = ref(null)
export const registerFormRef: any = ref(null)
/**
 * @description 表单校验规则
 */
export const rules = {
  email: [
    {
      validator: (rule: any, value: any) => {
        const pattern =
          /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if (!value.trim()) {
          return new Error("请输入邮箱");
        }
        if (value.length < 6 || value.length > 20) {
          return new Error("邮箱长度在6-20之间");
        }
        if (!pattern.test(value)) {
          return new Error("邮箱格式不正确");
        }
        return;
      },
      trigger: "blur",
    },
  ],
  password: {
    validator: (rule: any, value: any) => {
      if (!value.trim()) {
        return new Error("请输入密码");
      }
      if (value.length < 6 || value.length > 20) {
        return new Error("密码长度在6-20之间");
      }
      return;
    },
    trigger: ["input", "blur"],
  },
  repeat_password: {
    validator: (rule: any, value: any, c: any) => {
      if (!value.trim()) {
        return new Error("请输入确认密码");
      }
      if (value.length < 6 || value.length > 20) {
        return new Error("确认密码长度在6-20之间");
      }
      if (value !== registerFormRef.value.model.password) {
        // console.log(registerFormRef.value.model.password);
        return new Error("两次输入的密码不一致");
      }
    },
    trigger: ["input", "blur"],
  },
  code: {
    validator: (rule: any, value: any) => {
      if (!value.trim()) {
        return new Error("请输入验证码");
      }
      if (value.length !== 6) {
        return new Error("验证码长度在6位");
      }
    },
    trigger: ["blur"],
  },
};
