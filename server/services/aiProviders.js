// AI提供商抽象层
import { getDB } from '../db.js';

/**
 * 获取AI提供商配置
 */
async function getAIProviderConfig(modelId) {
  const db = getDB();
  const [models] = await db.query(
    `SELECT m.*, b.name as brandName 
     FROM models m 
     JOIN brands b ON m.brandId = b.id 
     WHERE m.id = ? AND m.status = 'active'`,
    [modelId]
  );

  if (models.length === 0) {
    throw new Error('模型不存在或已停用');
  }

  const model = models[0];
  
  // 根据品牌返回不同的配置
  // 这里可以根据brandName或brandId来区分不同的AI提供商
  return {
    modelId: model.id,
    modelName: model.name,
    brandName: model.brandName,
    // 可以根据品牌配置不同的API地址和认证方式
    apiUrl: getAPIUrl(model.brandName),
    apiKey: getAPIKey(model.brandName),
    // 其他配置...
  };
}

/**
 * 根据品牌获取API地址
 */
function getAPIUrl(brandName) {
  const config = {
    '讯飞': 'https://spark-api-open.xf-yun.com/v2/chat/completions',
    // 可以添加其他AI提供商的地址
    // 'OpenAI': 'https://api.openai.com/v1/chat/completions',
    // 'Claude': 'https://api.anthropic.com/v1/messages',
  };
  return config[brandName] || config['讯飞'];
}

/**
 * 根据品牌获取API密钥
 */
function getAPIKey(brandName) {
  // 这里可以从环境变量或数据库获取
  const config = {
    '讯飞': process.env.XUNFEI_API_KEY || 'ziJCPnBsQjOQfeNeEQsJ:dMgRcXPMNFWzqaJompZU',
    // 'OpenAI': process.env.OPENAI_API_KEY,
    // 'Claude': process.env.CLAUDE_API_KEY,
  };
  return config[brandName] || config['讯飞'];
}

/**
 * 调用AI API（流式）
 */
export async function callAIStream(modelId, messages, onChunk, shouldAbort) {
  const config = await getAIProviderConfig(modelId);
  
  // 根据品牌调用不同的API实现
  if (config.brandName === '讯飞') {
    return await callXunfeiAPI(config, messages, onChunk, shouldAbort);
  }
  // 可以添加其他AI提供商的实现
  // else if (config.brandName === 'OpenAI') {
  //   return await callOpenAIAPI(config, messages, onChunk, shouldAbort);
  // }
  
  throw new Error(`不支持的AI提供商: ${config.brandName}`);
}

/**
 * 调用讯飞API
 */
async function callXunfeiAPI(config, messages, onChunk, shouldAbort) {
  let fullResponse = '';

  try {
    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        stream: true,
        messages: messages
      })
    });

    if (!res.ok) {
      throw new Error(`AI API错误: ${res.status} ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      if (shouldAbort && shouldAbort()) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      
      if (done) break;

      // 直接将原始数据块转发给客户端
      const rawChunk = decoder.decode(value, { stream: true });
      onChunk(rawChunk);
      
      // 同时解析数据以累积完整响应
      buffer += rawChunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return fullResponse;
          }

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            
            if (content) {
              fullResponse += content;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('AI API错误:', error);
    throw error;
  }
}
