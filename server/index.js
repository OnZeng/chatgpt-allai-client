import 'dotenv/config';
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import { initDB } from './db.js';

const app = new Koa();
const router = new Router();

const PORT = process.env.PORT || 3001;

// 初始化数据库并启动服务器
async function startServer() {
  try {
    await initDB();
    
    // 中间件 - CORS配置（必须在最前面，处理所有请求包括OPTIONS预检）
    app.use(async (ctx, next) => {
      const origin = ctx.request.header.origin;
      
      // 允许所有本地请求（开发环境）
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        ctx.set('Access-Control-Allow-Origin', origin);
        ctx.set('Access-Control-Allow-Credentials', 'true');
        ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
        ctx.set('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
        ctx.set('Access-Control-Max-Age', '86400');
        
        // 处理预检请求（OPTIONS）
        if (ctx.method === 'OPTIONS') {
          ctx.status = 204;
          return;
        }
      }
      
      await next();
    });

    app.use(bodyParser());

    // 请求日志中间件（只记录实际请求，不记录 OPTIONS 预检）
    app.use(async (ctx, next) => {
      if (ctx.method !== 'OPTIONS') {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
      } else {
        await next();
      }
    });

    // 路由
    router.use('/api/auth', authRoutes.routes());
    router.use('/api/chat', chatRoutes.routes());
    router.use('/api/admin', adminRoutes.routes());

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
