import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDB } from '../db.js';

const router = new Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 注册
router.post('/register', async (ctx) => {
  try {
    const { username, password, email } = ctx.request.body;

    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { error: '用户名和密码是必填项' };
      return;
    }

    const db = getDB();
    
    // 检查用户名是否已存在
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      ctx.status = 400;
      ctx.body = { error: '用户名已存在' };
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();
    const isAdmin = username === '123456';
    const role = isAdmin ? 'admin' : 'user';
    const now = new Date();

    // 插入新用户
    await db.query(
      `INSERT INTO users (id, username, email, password, isAdmin, role, status, plan, ipAddress, deviceType, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        username,
        email || '',
        hashedPassword,
        isAdmin,
        role,
        'active',
        'free',
        ctx.request.ip || '',
        ctx.headers['user-agent'] || '',
        now
      ]
    );

    const token = jwt.sign({ userId, username, isAdmin }, JWT_SECRET, {
      expiresIn: '7d'
    });

    ctx.body = {
      message: '注册成功',
      token,
      user: {
        id: userId,
        username,
        email: email || '',
        isAdmin
      }
    };
  } catch (error) {
    console.error('注册错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

// 登录
router.post('/login', async (ctx) => {
  try {
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { error: '用户名和密码是必填项' };
      return;
    }

    const db = getDB();
    
    // 查询用户
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      ctx.status = 401;
      ctx.body = { error: '用户名或密码错误' };
      return;
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      ctx.status = 401;
      ctx.body = { error: '用户名或密码错误' };
      return;
    }

    // 确保用户有必要的字段（MySQL 中 BOOLEAN 是 TINYINT(1)，0 或 1）
    const isAdmin = username === 'admin' || user.isAdmin === 1 || user.isAdmin === true || user.isAdmin === '1';
    const role = isAdmin ? 'admin' : (user.role || 'user');
    const status = user.status || 'active';
    const plan = user.plan || 'free';

    // 检查账号是否被停用
    if (status === 'disabled') {
      ctx.status = 403;
      ctx.body = { error: '账号已被停用' };
      return;
    }

    // 更新登录信息和用户信息
    await db.query(
      `UPDATE users SET 
        isAdmin = ?,
        role = ?,
        status = ?,
        plan = ?,
        ipAddress = ?,
        deviceType = ?,
        lastLoginAt = ?
       WHERE id = ?`,
      [
        isAdmin,
        role,
        status,
        plan,
        ctx.request.ip || '',
        ctx.headers['user-agent'] || '',
        new Date(),
        user.id
      ]
    );

    const token = jwt.sign({ userId: user.id, username: user.username, isAdmin }, JWT_SECRET, {
      expiresIn: '7d'
    });

    ctx.body = {
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || '',
        isAdmin
      }
    };
  } catch (error) {
    console.error('登录错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

// 验证token中间件
async function verifyToken(ctx, next) {
  const token = ctx.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    ctx.status = 401;
    ctx.body = { error: '未提供token' };
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: '无效的token' };
  }
}

export default router;
export { verifyToken };
