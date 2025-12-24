// AI服务函数式封装，用于对接不同的AI API

/**
 * 讯飞Spark AI服务 - 流式生成响应
 * @param {string} userMessage - 用户消息
 * @param {string} modelId - 模型ID
 * @param {Object} config - 配置对象 { apiKey }
 * @param {Function} onChunk - 数据块回调函数
 * @param {Function} shouldAbort - 是否中断检查函数
 * @returns {Promise<string>} 完整响应
 */
export async function generateSparkStream(userMessage, modelId, config, onChunk, shouldAbort) {
  let fullResponse = '';
  
  try {
    const requestBody = {
      model: modelId || 'spark-x',
      stream: true,
      messages: [{ role: 'user', content: userMessage }]
    };

    console.log('发送Spark API请求:', {
      url: 'https://spark-api-open.xf-yun.com/v2/chat/completions',
      model: requestBody.model,
      messageLength: userMessage.length
    });

    const res = await fetch('https://spark-api-open.xf-yun.com/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      // 尝试读取错误响应体
      let errorMessage = `${res.status} ${res.statusText}`;
      try {
        const errorBody = await res.text();
        if (errorBody) {
          errorMessage += `: ${errorBody}`;
          console.error('Spark API错误响应:', errorBody);
        }
      } catch (e) {
        // 忽略读取错误体的错误
      }
      throw new Error(`AI API错误: ${errorMessage}`);
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

      // 直接将原始数据块转发给客户端，不解析
      const rawChunk = decoder.decode(value, { stream: true });
      
      // 立即转发原始数据
      onChunk(rawChunk);
      
      // 同时解析数据以累积完整响应（用于保存到数据库）
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

/**
 * AI服务生成函数 - 根据服务类型调用对应的生成函数
 * @param {string} serviceType - 服务类型 ('spark', 'openai', 'claude' 等)
 * @param {string} userMessage - 用户消息
 * @param {string} modelId - 模型ID
 * @param {Object} config - 配置对象
 * @param {Function} onChunk - 数据块回调函数
 * @param {Function} shouldAbort - 是否中断检查函数
 * @returns {Promise<string>} 完整响应
 */
export async function generateAIStream(serviceType, userMessage, modelId, config, onChunk, shouldAbort) {
  switch (serviceType) {
    case 'spark':
      return await generateSparkStream(userMessage, modelId, config, onChunk, shouldAbort);
    // 后续可以添加其他AI服务
    // case 'openai':
    //   return await generateOpenAIStream(userMessage, modelId, config, onChunk, shouldAbort);
    // case 'claude':
    //   return await generateClaudeStream(userMessage, modelId, config, onChunk, shouldAbort);
    default:
      throw new Error(`不支持的AI服务类型: ${serviceType}`);
  }
}
