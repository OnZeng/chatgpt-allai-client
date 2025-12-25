# ChatGPT-like 聊天应用

一个类似ChatGPT的聊天应用，包含登录、注册和打字机效果的对话功能。

## 技术栈

- **前端**: Vue 3 + naive-ui
- **后端**: Koa.js
- **数据库**: MySQL

## 项目结构

```
.
├── server/          # 后端服务
│   ├── routes/      # 路由
│   ├── db.js        # 数据库配置
│   └── index.js     # 服务器入口
├── client/          # 前端应用
│   ├── src/         # 源代码
│   │   ├── assets/  # 静态资源
│   │   ├── composables/ # 组合式函数
│   │   ├── router/  # 路由配置
│   │   ├── utils/   # 工具函数
│   │   ├── views/   # 页面视图
│   │   ├── App.vue  # 根组件
│   │   └── main.js  # 入口文件
│   ├── index.html   # HTML模板
│   ├── vite.config.js # Vite配置
│   └── package.json # 依赖配置
└── README.md
```

## 安装和运行

### 便捷安装和运行（推荐）

在项目根目录执行以下命令可以同时安装前后端依赖并启动服务：

```bash
# 安装所有依赖
npm run install:all

# 分别启动前后端服务
npm run dev:server  # 启动后端服务
npm run dev:client  # 启动前端服务
```

### 手动安装和运行

#### 后端

```bash
cd server
npm install
npm run dev
```

后端服务将在 `http://localhost:3001` 启动

#### 前端

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
- ✅ 聊天历史记录管理
- ✅ 会话创建和管理
- ✅ 管理员后台
- ✅ 模型管理
- ✅ API密钥管理
- ✅ 响应式设计

## API 接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 聊天接口

- `POST /api/chat/message` - 发送消息（SSE流式响应）
- `GET /api/chat/sessions` - 获取聊天会话列表
- `GET /api/chat/history` - 获取聊天历史记录（支持按chatId过滤）
- `POST /api/chat/session/new` - 创建新会话
- `DELETE /api/chat/message/:messageId` - 删除指定消息
- `PATCH /api/chat/session/:chatId` - 更新会话（标题、置顶状态）
- `DELETE /api/chat/session/:chatId` - 删除指定会话
- `GET /api/chat/models/available` - 获取可用的AI模型列表

### 管理员接口

#### 用户管理
- `GET /api/admin/users` - 获取用户列表
- `DELETE /api/admin/users/:id` - 删除用户
- `PATCH /api/admin/users/:id/status` - 启用/停用用户

#### 品牌管理
- `GET /api/admin/brands` - 获取品牌列表
- `POST /api/admin/brands` - 创建新品牌
- `PUT /api/admin/brands/:id` - 更新品牌信息
- `DELETE /api/admin/brands/:id` - 删除品牌
- `PATCH /api/admin/brands/:id/status` - 启用/停用品牌

#### 模型管理
- `GET /api/admin/models` - 获取模型列表
- `POST /api/admin/models` - 创建新模型
- `PUT /api/admin/models/:id` - 更新模型信息
- `DELETE /api/admin/models/:id` - 删除模型
- `PATCH /api/admin/models/:id/status` - 启用/停用模型

#### API密钥管理
- `GET /api/admin/keys` - 获取API密钥列表
- `POST /api/admin/keys` - 创建新API密钥
- `PUT /api/admin/keys/:id` - 更新API密钥
- `DELETE /api/admin/keys/:id` - 删除API密钥

## 注意事项

1. 生产环境请修改 `JWT_SECRET`
2. 当前AI回复是模拟的，可以替换为真实的AI API（如OpenAI）
3. 数据库配置：
   - 默认使用MySQL数据库
   - 连接信息可通过环境变量配置（DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME）
   - 应用会自动创建数据库和表结构
4. 默认管理员账号：
   - 用户名：admin
   - 密码：123456
   - 建议首次登录后修改密码
5. 确保MySQL服务已启动

