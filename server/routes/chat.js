import Router from 'koa-router';
import { getDB } from '../db.js';
import { verifyToken } from './auth.js';
import { generateAIStream } from '../services/aiService.js';

const router = new Router();

// 所有聊天路由都需要认证
router.use(verifyToken);

// SSE响应头配置
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
};

// 设置SSE响应
function setupSSEResponse(ctx) {
  ctx.set(SSE_HEADERS);
  ctx.respond = false;
  ctx.res.writeHead(200, SSE_HEADERS);
}

// 写入SSE数据
function writeSSEData(ctx, data) {
  if (!ctx.res.destroyed && ctx.res.writable) {
    try {
      ctx.res.write(data);
      return true;
    } catch (err) {
      console.error('写入流数据错误:', err);
      return false;
    }
  }
  return false;
}

// 发送消息（流式响应）
router.post('/message', async (ctx) => {
  let isAborted = false;
  
  // 监听客户端断开连接
  ctx.req.on('close', () => {
    isAborted = true;
    console.log('客户端断开连接，停止生成');
  });
  
  ctx.req.on('aborted', () => {
    isAborted = true;
    console.log('请求被中止');
  });

  try {
    const { message, modelId, chatId: requestChatId } = ctx.request.body;
    const userId = ctx.state.user.userId;

    if (!message) {
      ctx.status = 400;
      ctx.body = { error: '消息内容不能为空' };
      return;
    }

    const db = getDB();
    const now = new Date();
    let chatId = requestChatId;

    // 验证模型是否存在（如果提供了modelId）
    let modelInfo = null;
    if (modelId) {
      const [models] = await db.query(
        `SELECT m.id, m.name, m.brandId, b.name as brandName 
         FROM models m 
         LEFT JOIN brands b ON m.brandId = b.id 
         WHERE m.id = ? AND m.status = 'active'`,
        [modelId]
      );
      if (models.length === 0) {
        ctx.status = 400;
        ctx.body = { error: '模型不存在或已停用' };
        return;
      }
      modelInfo = models[0];
    }

    // 处理会话：如果提供了chatId，检查是否存在；否则创建新会话
    if (chatId) {
      // 检查会话是否存在且属于当前用户
      const [sessions] = await db.query(
        `SELECT id FROM sessions WHERE id = ? AND userId = ?`,
        [chatId, userId]
      );
      if (sessions.length === 0) {
        // 会话不存在，创建新会话
        await db.query(
          `INSERT INTO sessions (id, userId, title, modelId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [chatId, userId, message.substring(0, 30), modelId || null, now, now]
        );
      } else {
        // 会话存在，更新更新时间
        await db.query(
          `UPDATE sessions SET updatedAt = ? WHERE id = ?`,
          [now, chatId]
        );
      }
    } else {
      // 创建新会话
      chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.query(
        `INSERT INTO sessions (id, userId, title, modelId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [chatId, userId, message.substring(0, 30), modelId || null, now, now]
      );
    }

    // 保存用户消息（关联到chatId）
    const userMessageId = `msg_${Date.now()}`;
    await db.query(
      `INSERT INTO chats (id, chatId, userId, modelId, role, content, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userMessageId, chatId, userId, modelId || null, 'user', message, now]
    );

    // 设置SSE响应
    setupSSEResponse(ctx);

    // 发送会话ID（让前端知道当前使用的chatId）
    writeSSEData(ctx, `data: ${JSON.stringify({ type: 'chatId', chatId: chatId })}\n\n`);

    // 调用AI API获取流式响应
    let accumulatedResponse = ''; // 用于存储中断时的响应
    
    try {
      // 获取模型名称（用于API调用）
      const apiModelName = modelInfo ? modelInfo.name : 'spark-x';
      
      console.log('调用AI服务:', {
        modelId,
        apiModelName,
        messageLength: message.length,
        hasModelInfo: !!modelInfo
      });
      
      // 调用AI服务生成流式响应（注意：第三个参数是模型名称，不是模型ID）
      const aiResponse = await generateAIStream(
        'spark', // 服务类型
        message,
        apiModelName, // 使用 models 表中的 name 字段作为模型名称
        {
          apiKey: process.env.SPARK_API_KEY || 'ziJCPnBsQjOQfeNeEQsJ:dMgRcXPMNFWzqaJompZU'
        },
        (rawChunk) => {
          if (!isAborted) {
            writeSSEData(ctx, rawChunk);
            // 累积响应内容（用于中断时保存）
            // 解析chunk中的内容
            const lines = rawChunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data !== '[DONE]') {
                  try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content || '';
                    if (content) {
                      accumulatedResponse += content;
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }
          }
        },
        () => isAborted
      );

      // 如果被中断
      if (isAborted) {
        // 保存中断时的响应内容
        if (accumulatedResponse && accumulatedResponse.trim()) {
          const aiMessageId = `msg_${Date.now() + 1}`;
          await db.query(
            `INSERT INTO chats (id, chatId, userId, modelId, role, content, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [aiMessageId, chatId, userId, modelId || null, 'assistant', accumulatedResponse.trim(), now]
          );
          // 更新会话更新时间
          await db.query(
            `UPDATE sessions SET updatedAt = ? WHERE id = ?`,
            [now, chatId]
          );
        }
        writeSSEData(ctx, `data: ${JSON.stringify({ type: 'aborted' })}\n\n`);
        ctx.res.end();
        return;
      }

      // 发送完成标记
      writeSSEData(ctx, 'data: [DONE]\n\n');

      // 保存完整的AI回复（关联到chatId）
      if (aiResponse && aiResponse.trim()) {
        const aiMessageId = `msg_${Date.now() + 1}`;
        await db.query(
          `INSERT INTO chats (id, chatId, userId, modelId, role, content, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [aiMessageId, chatId, userId, modelId || null, 'assistant', aiResponse, now]
        );
        // 更新会话更新时间
        await db.query(
          `UPDATE sessions SET updatedAt = ? WHERE id = ?`,
          [now, chatId]
        );
      }

      // 结束流
      ctx.res.end();
    } catch (error) {
      console.error('AI响应错误:', error);
      console.error('错误堆栈:', error.stack);
      if (!isAborted) {
        const errorMessage = error.message || '服务器错误';
        writeSSEData(ctx, `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
        ctx.res.end();
      }
    }
  } catch (error) {
    console.error('发送消息错误:', error);
    if (ctx.respond === false) {
      writeSSEData(ctx, `data: ${JSON.stringify({ type: 'error', error: '服务器错误' })}\n\n`);
      ctx.res.end();
    } else {
      ctx.status = 500;
      ctx.body = { error: '服务器错误' };
    }
  }
});


// 获取聊天历史（会话列表）- 按 chatId 分组
router.get('/sessions', async (ctx) => {
  try {
    const userId = ctx.state.user.userId;
    const db = getDB();

    // 查询该用户的所有会话，按置顶状态和更新时间排序
    const [sessions] = await db.query(
      `SELECT s.id, s.userId, s.title, s.modelId, s.isPinned, s.createdAt, s.updatedAt,
              (SELECT COUNT(*) FROM chats c WHERE c.chatId = s.id) as messageCount,
              (SELECT c.content FROM chats c WHERE c.chatId = s.id AND c.role = 'user' ORDER BY c.timestamp ASC LIMIT 1) as firstUserMessage
       FROM sessions s
       WHERE s.userId = ?
       ORDER BY s.isPinned DESC, s.updatedAt DESC`,
      [userId]
    );

    // 返回会话列表
    // 标题逻辑：如果用户修改过标题（s.title不为空），则显示修改后的标题；否则显示第一条用户消息
    ctx.body = {
      sessions: sessions.map(session => ({
        id: session.id,
        title: session.title && session.title.trim() 
          ? session.title 
          : (session.firstUserMessage ? session.firstUserMessage.substring(0, 30) : '新会话'),
        isPinned: session.isPinned === 1 || session.isPinned === true,
        messageCount: session.messageCount || 0,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        modelId: session.modelId || null
      }))
    };
  } catch (error) {
    console.error('获取会话列表错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

// 获取聊天历史（支持按 chatId 获取单个会话的历史记录）
router.get('/history', async (ctx) => {
  try {
    const userId = ctx.state.user.userId;
    const { chatId } = ctx.query;
    const db = getDB();

    let query, params;

    if (chatId) {
      // 如果提供了 chatId，获取指定会话的历史记录
      query = `SELECT id, chatId, userId, modelId, role, content, timestamp
               FROM chats 
               WHERE userId = ? AND chatId = ?
               ORDER BY timestamp ASC`;
      params = [userId, chatId];
    } else {
      // 如果没有提供 chatId，获取该用户的所有聊天记录，按会话分组
      query = `SELECT id, chatId, userId, modelId, role, content, timestamp
               FROM chats 
               WHERE userId = ? 
               ORDER BY chatId, timestamp ASC`;
      params = [userId];
    }

    const [chats] = await db.query(query, params);

    if (chatId) {
      // 返回单个会话的消息列表
      ctx.body = {
        chatId: chatId,
        messages: chats.map(chat => ({
          id: chat.id,
          chatId: chat.chatId,
          userId: chat.userId,
          modelId: chat.modelId || null,
          role: chat.role,
          content: chat.content,
          timestamp: chat.timestamp.toISOString()
        }))
      };
    } else {
      // 按 chatId 分组返回所有会话的消息
      const groupedChats = {};
      chats.forEach(chat => {
        if (!groupedChats[chat.chatId]) {
          groupedChats[chat.chatId] = [];
        }
        groupedChats[chat.chatId].push({
          id: chat.id,
          chatId: chat.chatId,
          userId: chat.userId,
          modelId: chat.modelId || null,
          role: chat.role,
          content: chat.content,
          timestamp: chat.timestamp.toISOString()
        });
      });

      ctx.body = {
        chats: groupedChats
      };
    }
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

// 创建新会话
router.post('/session/new', async (ctx) => {
  try {
    const userId = ctx.state.user.userId;
    const { title, modelId } = ctx.request.body || {};
    const db = getDB();

    // 生成会话ID
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    // 创建会话记录
    await db.query(
      `INSERT INTO sessions (id, userId, title, modelId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [chatId, userId, title || '', modelId || null, now, now]
    );

    ctx.body = {
      success: true,
      chatId: chatId,
      message: '新会话已创建'
    };
  } catch (error) {
    console.error('创建新会话错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

// 删除指定消息
router.delete('/message/:messageId', async (ctx) => {
  try {
    const userId = ctx.state.user.userId;
    const { messageId } = ctx.params;
    const db = getDB();

    // 删除该消息（只能删除自己的消息）
    await db.query(
      `DELETE FROM chats WHERE id = ? AND userId = ?`,
      [messageId, userId]
    );

    ctx.body = {
      success: true,
      message: '消息已删除'
    };
  } catch (error) {
    console.error('删除消息错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

// 更新会话标题
router.patch('/session/:chatId', async (ctx) => {
  try {
    const userId = ctx.state.user.userId;
    const { chatId } = ctx.params;
    const { title, isPinned } = ctx.request.body || {};
    const db = getDB();

    // 检查会话是否存在且属于当前用户
    const [sessions] = await db.query(
      `SELECT id FROM sessions WHERE id = ? AND userId = ?`,
      [chatId, userId]
    );

    if (sessions.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '会话不存在' };
      return;
    }

    const now = new Date();
    const updates = [];
    const values = [];

    // 更新标题（如果提供）
    if (title !== undefined && title !== null) {
      updates.push('title = ?');
      values.push(title.trim());
    }

    // 更新置顶状态（如果提供）
    if (isPinned !== undefined && isPinned !== null) {
      updates.push('isPinned = ?');
      values.push(isPinned ? 1 : 0);
    }

    if (updates.length === 0) {
      ctx.status = 400;
      ctx.body = { error: '没有要更新的字段' };
      return;
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(chatId, userId);

    // 更新会话
    await db.query(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      values
    );

    ctx.body = {
      success: true,
      message: '会话已更新'
    };
  } catch (error) {
    console.error('更新会话错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

// 删除指定会话（会级联删除该会话下的所有消息）
router.delete('/session/:chatId', async (ctx) => {
  try {
    const userId = ctx.state.user.userId;
    const { chatId } = ctx.params;
    const db = getDB();

    // 检查会话是否存在且属于当前用户
    const [sessions] = await db.query(
      `SELECT id FROM sessions WHERE id = ? AND userId = ?`,
      [chatId, userId]
    );

    if (sessions.length === 0) {
      ctx.status = 404;
      ctx.body = { error: '会话不存在' };
      return;
    }

    // 删除会话（外键约束会自动级联删除该会话下的所有消息）
    await db.query(
      `DELETE FROM sessions WHERE id = ? AND userId = ?`,
      [chatId, userId]
    );

    ctx.body = {
      success: true,
      message: '会话已删除'
    };
  } catch (error) {
    console.error('删除会话错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

// 获取可用的品牌和模型列表（用于前端选择）
router.get('/models/available', async (ctx) => {
  try {
    const db = getDB();
    
    // 获取所有启用的品牌
    const [brands] = await db.query(
      `SELECT id, name FROM brands WHERE status = 'active' ORDER BY name`
    );

    // 获取所有启用的模型
    const [models] = await db.query(
      `SELECT m.id, m.brandId, m.name, m.serviceName, m.description, b.name as brandName
       FROM models m
       LEFT JOIN brands b ON m.brandId = b.id
       WHERE m.status = 'active'
       ORDER BY b.name, m.name`
    );

    // 按品牌分组模型
    const brandModelMap = {};
    brands.forEach(brand => {
      brandModelMap[brand.id] = {
        id: brand.id,
        name: brand.name,
        models: []
      };
    });

    models.forEach(model => {
      if (brandModelMap[model.brandId]) {
        brandModelMap[model.brandId].models.push({
          id: model.id,
          name: model.name,
          serviceName: model.serviceName, // serviceName现在是必填字段
          description: model.description || ''
        });
      }
    });

    ctx.body = {
      brands: Object.values(brandModelMap)
    };
  } catch (error) {
    console.error('获取可用模型列表错误:', error);
    ctx.status = 500;
    ctx.body = { error: '获取模型列表失败' };
  }
});



export default router;
