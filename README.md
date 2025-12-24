# ChatGPT-like 聊天应用

一个类似ChatGPT的聊天应用，包含登录、注册和打字机效果的对话功能。

## 技术栈

- **前端**: Nuxt 3 + Tailwind CSS
- **后端**: Koa.js
- **数据库**: LowDB (JSON文件数据库)

## 项目结构

```
.
├── server/          # 后端服务
│   ├── routes/      # 路由
│   ├── db.js        # 数据库配置
│   └── index.js     # 服务器入口
├── client/          # 前端应用
│   ├── pages/       # 页面
│   ├── composables/ # 组合式函数
│   ├── middleware/  # 中间件
│   └── assets/      # 静态资源
└── README.md
```

## 安装和运行

### 后端

```bash
cd server
npm install
npm run dev
```

后端服务将在 `http://localhost:3001` 启动

### 前端

```bash
cd client
npm install
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

## 功能特性

- ✅ 用户注册和登录
- ✅ JWT 身份验证
- ✅ 实时聊天对话
- ✅ 打字机效果
- ✅ 聊天历史记录
- ✅ 响应式设计

## API 接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 聊天接口

- `POST /api/chat/message` - 发送消息
- `GET /api/chat/history` - 获取聊天历史

## 注意事项

1. 生产环境请修改 `JWT_SECRET`
2. 当前AI回复是模拟的，可以替换为真实的AI API（如OpenAI）
3. 数据库文件 `server/db.json` 会自动创建

## 开发

- 后端使用 `nodemon` 实现热重载
- 前端使用 Nuxt 3 的开发服务器

