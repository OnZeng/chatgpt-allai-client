import Router from 'koa-router';
import { getDB } from '../db.js';
import { verifyToken } from './auth.js';

const router = new Router();

// 验证管理员权限中间件
async function verifyAdmin(ctx, next) {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 403;
      ctx.body = { error: '无权限访问' };
      return;
    }

    // 从数据库验证用户是否为管理员
    const db = getDB();
    const [users] = await db.query(
      'SELECT isAdmin FROM users WHERE id = ?',
      [user.userId]
    );

    if (users.length === 0 || !(users[0].isAdmin === 1 || users[0].isAdmin === true)) {
      ctx.status = 403;
      ctx.body = { error: '无权限访问' };
      return;
    }

    await next();
  } catch (error) {
    console.error('验证管理员权限错误:', error);
    ctx.status = 403;
    ctx.body = { error: '无权限访问' };
  }
}

// 所有管理路由都需要认证和管理员权限
router.use(verifyToken);
router.use(verifyAdmin);

// 获取用户列表
router.get('/users', async (ctx) => {
  try {
    const { page = 1, pageSize = 10 } = ctx.query;
    const db = getDB();

    // 获取总数
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;

    // 获取分页数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const [users] = await db.query(
      `SELECT id, username, email, role, plan, ipAddress, deviceType, status, createdAt, lastLoginAt, isAdmin
       FROM users
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    );

    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email || '',
      role: user.role || (user.isAdmin === 1 || user.isAdmin === true ? 'admin' : 'user'),
      plan: user.plan || 'free',
      ipAddress: user.ipAddress || '',
      deviceType: user.deviceType || '',
      status: user.status || 'active',
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null
    }));

    ctx.body = {
      users: formattedUsers,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    console.error('获取用户列表错误:', error);
    ctx.status = 500;
    ctx.body = { error: '获取用户列表失败' };
  }
});

// 删除用户
router.delete('/users/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const db = getDB();

    // 不能删除自己
    if (id === ctx.state.user.userId) {
      ctx.status = 400;
      ctx.body = { error: '不能删除自己的账号' };
      return;
    }

    // 检查用户是否存在
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '用户不存在' };
      return;
    }

    // 删除用户（由于外键约束，聊天记录会自动删除）
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    ctx.body = {
      message: '用户删除成功'
    };
  } catch (error) {
    console.error('删除用户错误:', error);
    ctx.status = 500;
    ctx.body = { error: '删除用户失败' };
  }
});

// 停用/启用用户
router.patch('/users/:id/status', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { status } = ctx.request.body;

    if (!['active', 'disabled'].includes(status)) {
      ctx.status = 400;
      ctx.body = { error: '无效的状态值' };
      return;
    }

    // 不能停用自己的账号
    if (id === ctx.state.user.userId) {
      ctx.status = 400;
      ctx.body = { error: '不能停用自己的账号' };
      return;
    }

    const db = getDB();

    // 检查用户是否存在
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '用户不存在' };
      return;
    }

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    ctx.body = {
      message: status === 'active' ? '用户已启用' : '用户已停用'
    };
  } catch (error) {
    console.error('更新用户状态错误:', error);
    ctx.status = 500;
    ctx.body = { error: '更新用户状态失败' };
  }
});

// 获取品牌列表
router.get('/brands', async (ctx) => {
  try {
    const { page = 1, pageSize = 10 } = ctx.query;
    const db = getDB();

    // 获取总数
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM brands');
    const total = countResult[0].total;

    // 获取分页数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const [brands] = await db.query(
      `SELECT id, name, status, createdAt, updatedAt 
       FROM brands 
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    );

    const formattedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      status: brand.status || 'active',
      createdAt: brand.createdAt ? brand.createdAt.toISOString() : null,
      updatedAt: brand.updatedAt ? brand.updatedAt.toISOString() : null
    }));

    ctx.body = {
      brands: formattedBrands,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    console.error('获取品牌列表错误:', error);
    ctx.status = 500;
    ctx.body = { error: '获取品牌列表失败' };
  }
});

// 新增品牌
router.post('/brands', async (ctx) => {
  try {
    const { name } = ctx.request.body;

    if (!name || !name.trim()) {
      ctx.status = 400;
      ctx.body = { error: '品牌名称是必填项' };
      return;
    }

    const db = getDB();

    // 检查品牌名称是否已存在
    const [existingBrands] = await db.query('SELECT id FROM brands WHERE name = ?', [name.trim()]);
    if (existingBrands.length > 0) {
      ctx.status = 400;
      ctx.body = { error: '品牌名称已存在' };
      return;
    }

    const brandId = Date.now().toString();
    const now = new Date();

    await db.query(
      `INSERT INTO brands (id, name, status, createdAt)
       VALUES (?, ?, ?, ?)`,
      [brandId, name.trim(), 'active', now]
    );

    ctx.body = {
      message: '品牌创建成功',
      brand: {
        id: brandId,
        name: name.trim(),
        status: 'active',
        createdAt: now.toISOString()
      }
    };
  } catch (error) {
    console.error('创建品牌错误:', error);
    ctx.status = 500;
    ctx.body = { error: '创建品牌失败' };
  }
});

// 修改品牌
router.put('/brands/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { name } = ctx.request.body;

    if (!name || !name.trim()) {
      ctx.status = 400;
      ctx.body = { error: '品牌名称是必填项' };
      return;
    }

    const db = getDB();

    // 检查品牌是否存在
    const [brands] = await db.query('SELECT * FROM brands WHERE id = ?', [id]);
    if (brands.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '品牌不存在' };
      return;
    }

    // 检查品牌名称是否与其他品牌冲突
    const [existingBrands] = await db.query('SELECT id FROM brands WHERE name = ? AND id != ?', [name.trim(), id]);
    if (existingBrands.length > 0) {
      ctx.status = 400;
      ctx.body = { error: '品牌名称已存在' };
      return;
    }

    await db.query(
      `UPDATE brands SET name = ?, updatedAt = ? WHERE id = ?`,
      [name.trim(), new Date(), id]
    );

    ctx.body = {
      message: '品牌更新成功'
    };
  } catch (error) {
    console.error('更新品牌错误:', error);
    ctx.status = 500;
    ctx.body = { error: '更新品牌失败' };
  }
});

// 删除品牌
router.delete('/brands/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const db = getDB();

    // 检查品牌是否存在
    const [brands] = await db.query('SELECT id FROM brands WHERE id = ?', [id]);
    if (brands.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '品牌不存在' };
      return;
    }

    // 删除品牌（由于外键约束，关联的模型会自动删除）
    await db.query('DELETE FROM brands WHERE id = ?', [id]);

    ctx.body = {
      message: '品牌删除成功'
    };
  } catch (error) {
    console.error('删除品牌错误:', error);
    ctx.status = 500;
    ctx.body = { error: '删除品牌失败' };
  }
});

// 停用/启用品牌
router.patch('/brands/:id/status', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { status } = ctx.request.body;

    if (!['active', 'disabled'].includes(status)) {
      ctx.status = 400;
      ctx.body = { error: '无效的状态值' };
      return;
    }

    const db = getDB();

    // 检查品牌是否存在
    const [brands] = await db.query('SELECT id FROM brands WHERE id = ?', [id]);
    if (brands.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '品牌不存在' };
      return;
    }

    await db.query('UPDATE brands SET status = ? WHERE id = ?', [status, id]);

    ctx.body = {
      message: status === 'active' ? '品牌已启用' : '品牌已停用'
    };
  } catch (error) {
    console.error('更新品牌状态错误:', error);
    ctx.status = 500;
    ctx.body = { error: '更新品牌状态失败' };
  }
});

// 获取模型列表（按品牌分组）
router.get('/models', async (ctx) => {
  try {
    const { page = 1, pageSize = 10 } = ctx.query;
    const db = getDB();

    // 获取总数
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM models');
    const total = countResult[0].total;

    // 获取分页数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const [models] = await db.query(
      `SELECT m.id, m.brandId, m.name, m.serviceName, m.description, m.status, m.createdAt, m.updatedAt, b.name as brandName
       FROM models m
       LEFT JOIN brands b ON m.brandId = b.id
       ORDER BY b.name, m.serviceName, m.name
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    );

    const formattedModels = models.map(model => ({
      id: model.id,
      brandId: model.brandId,
      brandName: model.brandName || '',
      name: model.name,
      serviceName: model.serviceName || '',
      description: model.description || '',
      status: model.status || 'active',
      createdAt: model.createdAt ? model.createdAt.toISOString() : null,
      updatedAt: model.updatedAt ? model.updatedAt.toISOString() : null
    }));

    ctx.body = {
      models: formattedModels,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    console.error('获取模型列表错误:', error);
    ctx.status = 500;
    ctx.body = { error: '获取模型列表失败' };
  }
});

// 新增模型
router.post('/models', async (ctx) => {
  try {
    const { brandId, name, serviceName, description } = ctx.request.body;

    if (!brandId || !name || !name.trim()) {
      ctx.status = 400;
      ctx.body = { error: '品牌和模型名称是必填项' };
      return;
    }

    if (!serviceName || !serviceName.trim()) {
      ctx.status = 400;
      ctx.body = { error: '服务名称是必填项' };
      return;
    }

    const db = getDB();

    // 检查品牌是否存在
    const [brands] = await db.query('SELECT id FROM brands WHERE id = ?', [brandId]);
    if (brands.length === 0) {
      ctx.status = 400;
      ctx.body = { error: '品牌不存在' };
      return;
    }

    // 检查该品牌下模型名称是否已存在
    const [existingModels] = await db.query('SELECT id FROM models WHERE brandId = ? AND name = ?', [brandId, name.trim()]);
    if (existingModels.length > 0) {
      ctx.status = 400;
      ctx.body = { error: '该品牌下模型名称已存在' };
      return;
    }

    // 检查服务名称是否已存在（全局唯一）
    const [existingServiceNames] = await db.query('SELECT id FROM models WHERE serviceName = ?', [serviceName.trim()]);
    if (existingServiceNames.length > 0) {
      ctx.status = 400;
      ctx.body = { error: '服务名称已存在，必须唯一' };
      return;
    }

    const modelId = Date.now().toString();
    const now = new Date();

    await db.query(
      `INSERT INTO models (id, brandId, name, serviceName, description, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [modelId, brandId, name.trim(), serviceName.trim(), description || '', 'active', now]
    );

    ctx.body = {
      message: '模型创建成功',
      model: {
        id: modelId,
        brandId,
        name: name.trim(),
        serviceName: serviceName || '',
        description: description || '',
        status: 'active',
        createdAt: now.toISOString()
      }
    };
  } catch (error) {
    console.error('创建模型错误:', error);
    ctx.status = 500;
    ctx.body = { error: '创建模型失败' };
  }
});

// 修改模型
router.put('/models/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { name, serviceName, description } = ctx.request.body;

    if (!name || !name.trim()) {
      ctx.status = 400;
      ctx.body = { error: '模型名称是必填项' };
      return;
    }

    if (!serviceName || !serviceName.trim()) {
      ctx.status = 400;
      ctx.body = { error: '服务名称是必填项' };
      return;
    }

    const db = getDB();

    // 检查模型是否存在
    const [models] = await db.query('SELECT * FROM models WHERE id = ?', [id]);
    if (models.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '模型不存在' };
      return;
    }

    const model = models[0];

    // 检查该品牌下模型名称是否与其他模型冲突
    const [existingModels] = await db.query('SELECT id FROM models WHERE brandId = ? AND name = ? AND id != ?', [model.brandId, name.trim(), id]);
    if (existingModels.length > 0) {
      ctx.status = 400;
      ctx.body = { error: '该品牌下模型名称已存在' };
      return;
    }

    // 检查服务名称是否与其他模型冲突（全局唯一）
    const [existingServiceNames] = await db.query('SELECT id FROM models WHERE serviceName = ? AND id != ?', [serviceName.trim(), id]);
    if (existingServiceNames.length > 0) {
      ctx.status = 400;
      ctx.body = { error: '服务名称已存在，必须唯一' };
      return;
    }

    await db.query(
      `UPDATE models SET name = ?, serviceName = ?, description = ?, updatedAt = ? WHERE id = ?`,
      [name.trim(), serviceName.trim(), description || '', new Date(), id]
    );

    ctx.body = {
      message: '模型更新成功'
    };
  } catch (error) {
    console.error('更新模型错误:', error);
    ctx.status = 500;
    ctx.body = { error: '更新模型失败' };
  }
});

// 删除模型
router.delete('/models/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const db = getDB();

    // 检查模型是否存在
    const [models] = await db.query('SELECT id FROM models WHERE id = ?', [id]);
    if (models.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '模型不存在' };
      return;
    }

    await db.query('DELETE FROM models WHERE id = ?', [id]);

    ctx.body = {
      message: '模型删除成功'
    };
  } catch (error) {
    console.error('删除模型错误:', error);
    ctx.status = 500;
    ctx.body = { error: '删除模型失败' };
  }
});

// 停用/启用模型
router.patch('/models/:id/status', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { status } = ctx.request.body;

    if (!['active', 'disabled'].includes(status)) {
      ctx.status = 400;
      ctx.body = { error: '无效的状态值' };
      return;
    }

    const db = getDB();

    // 检查模型是否存在
    const [models] = await db.query('SELECT id FROM models WHERE id = ?', [id]);
    if (models.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '模型不存在' };
      return;
    }

    await db.query('UPDATE models SET status = ? WHERE id = ?', [status, id]);

    ctx.body = {
      message: status === 'active' ? '模型已启用' : '模型已停用'
    };
  } catch (error) {
    console.error('更新模型状态错误:', error);
    ctx.status = 500;
    ctx.body = { error: '更新模型状态失败' };
  }
});

// ==================== API密钥管理 ====================

// 获取API密钥列表
router.get('/keys', async (ctx) => {
  try {
    const { page = 1, pageSize = 20 } = ctx.query;
    const db = getDB();

    // 获取总数
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM api_keys');
    const total = countResult[0].total;

    // 获取分页数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const [keys] = await db.query(
      `SELECT id, serviceName, 
              CONCAT(LEFT(apiKey, 8), '...', RIGHT(apiKey, 4)) as maskedKey,
              status, createdAt, updatedAt
       FROM api_keys
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    );

    ctx.body = {
      keys: keys.map(key => ({
        id: key.id,
        serviceName: key.serviceName,
        maskedKey: key.maskedKey,
        status: key.status || 'active',
        createdAt: key.createdAt ? key.createdAt.toISOString() : null,
        updatedAt: key.updatedAt ? key.updatedAt.toISOString() : null
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    console.error('获取API密钥列表错误:', error);
    ctx.status = 500;
    ctx.body = { error: '获取API密钥列表失败' };
  }
});

// 创建API密钥
router.post('/keys', async (ctx) => {
  try {
    const { serviceName, apiKey } = ctx.request.body;

    if (!serviceName || !apiKey) {
      ctx.status = 400;
      ctx.body = { error: '服务名称和API密钥都是必填项' };
      return;
    }

    const db = getDB();
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    await db.query(
      `INSERT INTO api_keys (id, serviceName, apiKey, status, createdAt, updatedAt)
       VALUES (?, ?, ?, 'active', ?, ?)`,
      [keyId, serviceName, apiKey, now, now]
    );

    ctx.body = {
      message: 'API密钥创建成功',
      key: {
        id: keyId,
        serviceName,
        maskedKey: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
        status: 'active'
      }
    };
  } catch (error) {
    console.error('创建API密钥错误:', error);
    ctx.status = 500;
    ctx.body = { error: '创建API密钥失败' };
  }
});

// 更新API密钥
router.put('/keys/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { serviceName, apiKey, status } = ctx.request.body;
    const db = getDB();

    // 检查密钥是否存在
    const [keys] = await db.query('SELECT id FROM api_keys WHERE id = ?', [id]);
    if (keys.length === 0) {
      ctx.status = 404;
      ctx.body = { error: 'API密钥不存在' };
      return;
    }

    const updates = [];
    const values = [];

    if (serviceName !== undefined) {
      updates.push('serviceName = ?');
      values.push(serviceName);
    }
    if (apiKey !== undefined) {
      updates.push('apiKey = ?');
      values.push(apiKey);
    }
    if (status !== undefined) {
      if (!['active', 'disabled'].includes(status)) {
        ctx.status = 400;
        ctx.body = { error: '无效的状态值' };
        return;
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      ctx.status = 400;
      ctx.body = { error: '没有要更新的字段' };
      return;
    }

    updates.push('updatedAt = ?');
    values.push(new Date());
    values.push(id);

    await db.query(
      `UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    ctx.body = {
      message: 'API密钥更新成功'
    };
  } catch (error) {
    console.error('更新API密钥错误:', error);
    ctx.status = 500;
    ctx.body = { error: '更新API密钥失败' };
  }
});

// 删除API密钥
router.delete('/keys/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const db = getDB();

    // 检查密钥是否存在
    const [keys] = await db.query('SELECT id FROM api_keys WHERE id = ?', [id]);
    if (keys.length === 0) {
      ctx.status = 404;
      ctx.body = { error: 'API密钥不存在' };
      return;
    }

    await db.query('DELETE FROM api_keys WHERE id = ?', [id]);

    ctx.body = {
      message: 'API密钥删除成功'
    };
  } catch (error) {
    console.error('删除API密钥错误:', error);
    ctx.status = 500;
    ctx.body = { error: '删除API密钥失败' };
  }
});

// ==================== 消息管理 ====================

// 获取消息列表
router.get('/messages', async (ctx) => {
  try {
    const { page = 1, pageSize = 50, userId, chatId, role } = ctx.query;
    const db = getDB();

    let whereConditions = [];
    let params = [];

    if (userId) {
      whereConditions.push('c.userId = ?');
      params.push(userId);
    }
    if (chatId) {
      whereConditions.push('c.chatId = ?');
      params.push(chatId);
    }
    if (role) {
      whereConditions.push('c.role = ?');
      params.push(role);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM chats c ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取消息列表
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const [messages] = await db.query(
      `SELECT c.id, c.chatId, c.userId, c.modelId, c.role, c.content, c.timestamp,
              u.username, s.title as sessionTitle
       FROM chats c
       LEFT JOIN users u ON c.userId = u.id
       LEFT JOIN sessions s ON c.chatId = s.id
       ${whereClause}
       ORDER BY c.timestamp DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ctx.body = {
      messages: messages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        userId: msg.userId,
        username: msg.username || '未知用户',
        modelId: msg.modelId || null,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp ? msg.timestamp.toISOString() : null,
        sessionTitle: msg.sessionTitle || null
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    console.error('获取消息列表错误:', error);
    ctx.status = 500;
    ctx.body = { error: '获取消息列表失败' };
  }
});


export default router;
