import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// MySQL 连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
let pool = null;

export async function initDB() {
  try {
    // 先连接到 MySQL 服务器（不指定数据库）来创建数据库
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    // 创建数据库（如果不存在）
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConnection.end();

    // 创建连接池
    pool = mysql.createPool(dbConfig);

    // 删除所有现有表（如果存在）
    // try {
    //   await dropAllTables();
    // } catch (error) {
    //   console.log('删除表时出错（可能是首次运行）:', error.message);
    // }

    // 初始化表结构
    await createTables();

    // 检查并创建默认管理员账号
    await createDefaultAdmin();

    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

// 删除所有表
async function dropAllTables() {
  const connection = await pool.getConnection();
  
  try {
    // 禁用外键检查，以便删除所有表
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 获取所有表名
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    
    // 删除所有表
    for (const table of tables) {
      try {
        await connection.query(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
        console.log(`已删除表: ${table.TABLE_NAME}`);
      } catch (error) {
        console.error(`删除表 ${table.TABLE_NAME} 时出错:`, error.message);
      }
    }
    
    // 重新启用外键检查
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('所有表已删除');
  } catch (error) {
    console.error('删除表时出错:', error);
    // 确保重新启用外键检查
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      // 忽略错误
    }
    throw error;
  } finally {
    connection.release();
  }
}

// 创建表结构
async function createTables() {
  const connection = await pool.getConnection();

  try {
    // 创建 users 表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY COMMENT '用户ID',
        username VARCHAR(255) UNIQUE NOT NULL COMMENT '用户名',
        email VARCHAR(255) DEFAULT '' COMMENT '邮箱',
        password VARCHAR(255) NOT NULL COMMENT '密码（加密后）',
        isAdmin TINYINT(1) DEFAULT 0 COMMENT '是否为管理员（0-否，1-是）',
        role VARCHAR(50) DEFAULT 'user' COMMENT '用户角色（user-普通用户，admin-管理员）',
        status VARCHAR(50) DEFAULT 'active' COMMENT '账号状态（active-启用，disabled-停用）',
        plan VARCHAR(50) DEFAULT 'free' COMMENT '套餐类型',
        ipAddress VARCHAR(255) DEFAULT '' COMMENT 'IP地址',
        deviceType TEXT COMMENT '设备类型',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        lastLoginAt DATETIME COMMENT '最后登录时间',
        INDEX idx_username (username),
        INDEX idx_status (status),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
    `);

    // 创建 sessions 表（会话表）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY COMMENT '会话ID',
        userId VARCHAR(255) NOT NULL COMMENT '用户ID',
        title VARCHAR(255) DEFAULT '' COMMENT '会话标题',
        modelId VARCHAR(255) COMMENT '模型ID',
        isPinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶（0-否，1-是）',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_userId (userId),
        INDEX idx_createdAt (createdAt),
        INDEX idx_isPinned (isPinned),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表'
    `);

    // 为已存在的 sessions 表添加 isPinned 字段（如果不存在）
    try {
      const [pinnedColumns] = await connection.query(`
        SHOW COLUMNS FROM sessions LIKE 'isPinned'
      `);
      if (pinnedColumns.length === 0) {
        await connection.query(`
          ALTER TABLE sessions 
          ADD COLUMN isPinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶（0-否，1-是）'
        `);
        await connection.query(`
          ALTER TABLE sessions 
          ADD INDEX idx_isPinned (isPinned)
        `);
        console.log('已为 sessions 表添加 isPinned 字段');
      }
    } catch (error) {
      console.log('检查 isPinned 字段时出错:', error.message);
    }

    // 创建 chats 表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR(255) PRIMARY KEY COMMENT '消息ID',
        chatId VARCHAR(255) NOT NULL COMMENT '会话ID',
        userId VARCHAR(255) NOT NULL COMMENT '用户ID',
        modelId VARCHAR(255) COMMENT '模型ID',
        role VARCHAR(50) NOT NULL COMMENT '角色（user-用户，assistant-AI助手）',
        content TEXT NOT NULL COMMENT '消息内容',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '消息时间',
        INDEX idx_userId (userId),
        INDEX idx_chatId (chatId),
        INDEX idx_timestamp (timestamp),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chatId) REFERENCES sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天记录表'
    `);

    // 为已存在的 chats 表添加缺失的字段（如果不存在）
    try {
      // 检查并添加 chatId 字段
      const [chatIdColumns] = await connection.query(`
        SHOW COLUMNS FROM chats LIKE 'chatId'
      `);
      if (chatIdColumns.length === 0) {
        // 如果 chatId 字段不存在，先添加字段（允许为 NULL，因为已有数据）
        await connection.query(`
          ALTER TABLE chats 
          ADD COLUMN chatId VARCHAR(255) COMMENT '会话ID'
        `);
        // 为已有数据生成默认 chatId（基于消息ID或时间戳）
        await connection.query(`
          UPDATE chats 
          SET chatId = CONCAT('chat_', UNIX_TIMESTAMP(timestamp), '_', SUBSTRING(id, -9))
          WHERE chatId IS NULL
        `);
        // 然后设置为 NOT NULL
        await connection.query(`
          ALTER TABLE chats 
          MODIFY COLUMN chatId VARCHAR(255) NOT NULL COMMENT '会话ID'
        `);
        // 添加索引
        await connection.query(`
          ALTER TABLE chats 
          ADD INDEX idx_chatId (chatId)
        `);
        console.log('已为 chats 表添加 chatId 字段');
      }

      // 检查并添加 modelId 字段
      const [modelIdColumns] = await connection.query(`
        SHOW COLUMNS FROM chats LIKE 'modelId'
      `);
      if (modelIdColumns.length === 0) {
        await connection.query(`
          ALTER TABLE chats 
          ADD COLUMN modelId VARCHAR(255) COMMENT '模型ID'
        `);
        console.log('已为 chats 表添加 modelId 字段');
      }

      // 检查并添加外键约束（如果不存在）
      try {
        const [foreignKeys] = await connection.query(`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'chats' 
          AND COLUMN_NAME = 'chatId' 
          AND REFERENCED_TABLE_NAME = 'sessions'
        `);
        
        if (foreignKeys.length === 0) {
          // 先检查是否有同名约束（避免重复创建）
          const [existingConstraints] = await connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'chats' 
            AND CONSTRAINT_NAME = 'fk_chats_chatId'
          `);
          
          if (existingConstraints.length === 0) {
            // 添加外键约束
            await connection.query(`
              ALTER TABLE chats 
              ADD CONSTRAINT fk_chats_chatId 
              FOREIGN KEY (chatId) REFERENCES sessions(id) ON DELETE CASCADE
            `);
            console.log('已为 chats 表添加外键约束 fk_chats_chatId');
          }
        } else {
          console.log('外键约束已存在');
        }
      } catch (error) {
        // 如果外键已存在或其他错误，记录但不中断
        console.log('检查外键约束时出错:', error.message);
      }
    } catch (error) {
      // 如果表不存在，忽略错误（表会在上面创建）
      console.log('检查 chats 表字段时出错（可能是表不存在）:', error.message);
    }

    // 创建 brands 表（品牌表）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(255) PRIMARY KEY COMMENT '品牌ID',
        name VARCHAR(255) UNIQUE NOT NULL COMMENT '品牌名称',
        status VARCHAR(50) DEFAULT 'active' COMMENT '状态（active-启用，disabled-停用）',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='品牌表'
    `);

    // 创建 models 表（模型表）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS models (
        id VARCHAR(255) PRIMARY KEY COMMENT '模型ID',
        brandId VARCHAR(255) NOT NULL COMMENT '品牌ID',
        name VARCHAR(255) NOT NULL COMMENT '模型名称',
        serviceName VARCHAR(255) NOT NULL COMMENT '服务名称（全局唯一）',
        description TEXT COMMENT '模型描述',
        status VARCHAR(50) DEFAULT 'active' COMMENT '状态（active-启用，disabled-停用）',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_brandId (brandId),
        INDEX idx_status (status),
        INDEX idx_serviceName (serviceName),
        FOREIGN KEY (brandId) REFERENCES brands(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型表'
    `);

    // 创建 api_keys 表（API密钥管理）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR(255) PRIMARY KEY COMMENT '密钥ID',
        modelId VARCHAR(255) NOT NULL COMMENT '模型ID',
        apiKey TEXT NOT NULL COMMENT 'API密钥',
        status VARCHAR(50) DEFAULT 'active' COMMENT '状态（active-启用，disabled-停用）',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_modelId (modelId),
        INDEX idx_status (status),
        FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API密钥表'
    `);

    // 为已存在的 api_keys 表添加 modelId 字段（如果不存在）
    try {
      const [modelIdColumns] = await connection.query(`
        SHOW COLUMNS FROM api_keys LIKE 'modelId'
      `);
      if (modelIdColumns.length === 0) {
        // 检查是否有 name 或 serviceName 字段需要迁移
        const [columns] = await connection.query(`
          SHOW COLUMNS FROM api_keys
        `);
        const hasServiceName = columns.some(col => col.Field === 'serviceName');
        const hasName = columns.some(col => col.Field === 'name');
        
        if (hasServiceName) {
          // 如果有 serviceName 字段，尝试通过 serviceName 匹配 modelId
          await connection.query(`
            ALTER TABLE api_keys 
            ADD COLUMN modelId VARCHAR(255) COMMENT '模型ID'
          `);
          
          // 尝试通过 serviceName 匹配模型
          await connection.query(`
            UPDATE api_keys ak
            INNER JOIN models m ON ak.serviceName = m.serviceName
            SET ak.modelId = m.id
            WHERE ak.modelId IS NULL
          `);
          
          // 删除无法匹配的旧数据（可选，或者设置为默认值）
          // 这里我们删除无法匹配的数据
          await connection.query(`
            DELETE FROM api_keys WHERE modelId IS NULL
          `);
          
          // 设置为 NOT NULL
          await connection.query(`
            ALTER TABLE api_keys 
            MODIFY COLUMN modelId VARCHAR(255) NOT NULL COMMENT '模型ID'
          `);
          
          // 添加外键约束
          await connection.query(`
            ALTER TABLE api_keys 
            ADD CONSTRAINT fk_api_keys_modelId 
            FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE CASCADE
          `);
          
          // 删除旧的 serviceName 和 name 字段
          if (hasName) {
            await connection.query(`
              ALTER TABLE api_keys DROP COLUMN name
            `);
          }
          await connection.query(`
            ALTER TABLE api_keys DROP COLUMN serviceName
          `);
          
          console.log('已为 api_keys 表添加 modelId 字段并迁移数据');
        } else {
          // 如果没有 serviceName 字段，直接添加 modelId（需要手动设置）
          await connection.query(`
            ALTER TABLE api_keys 
            ADD COLUMN modelId VARCHAR(255) NOT NULL COMMENT '模型ID'
          `);
          
          await connection.query(`
            ALTER TABLE api_keys 
            ADD CONSTRAINT fk_api_keys_modelId 
            FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE CASCADE
          `);
        }
      }
    } catch (error) {
      console.log('检查或添加 modelId 字段时出错:', error.message);
    }

    console.log('数据表创建成功');
  } catch (error) {
    console.error('创建数据表错误:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 创建默认管理员账号
async function createDefaultAdmin() {
  const connection = await pool.getConnection();

  try {
    // 检查是否存在管理员账号
    const [admins] = await connection.query(
      'SELECT id FROM users WHERE isAdmin = 1 OR role = ? LIMIT 1',
      ['admin']
    );

    // 如果不存在管理员账号，创建默认管理员
    if (admins.length === 0) {
      const defaultUsername = 'admin';
      const defaultPassword = '123456'; // 默认密码，建议首次登录后修改
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const adminId = Date.now().toString();
      const now = new Date();

      await connection.query(
        `INSERT INTO users (id, username, email, password, isAdmin, role, status, plan, ipAddress, deviceType, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adminId,
          defaultUsername,
          '',
          hashedPassword,
          1,
          'admin',
          'active',
          'free',
          '',
          '',
          now
        ]
      );

      console.log(`默认管理员账号已创建 - 用户名: ${defaultUsername}, 密码: ${defaultPassword}`);
    }
  } catch (error) {
    console.error('创建默认管理员账号错误:', error);
    // 不抛出错误，避免影响数据库初始化
  } finally {
    connection.release();
  }
}

// 获取数据库连接池
export function getDB() {
  if (!pool) {
    throw new Error('数据库未初始化，请先调用 initDB()');
  }
  return pool;
}

// 执行查询的辅助函数
export async function query(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

// 执行事务的辅助函数
export async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
