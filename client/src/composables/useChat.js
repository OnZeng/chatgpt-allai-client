import { ref } from 'vue'
import { useAuth } from './useAuth'

const messages = ref([])
const isLoading = ref(false)
const isStreaming = ref(false)
let currentAbortController = null

export const useChat = () => {
  const { token } = useAuth()

  const sendMessage = async (content) => {
    if (!token.value) {
      return { success: false, error: '请先登录' }
    }

    // 取消之前的请求
    if (currentAbortController) {
      currentAbortController.abort()
    }

    // 创建新的AbortController
    currentAbortController = new AbortController()

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    messages.value.push(userMessage)

    // 添加占位符消息用于流式响应
    const assistantMessageId = Date.now() + 1
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    }
    messages.value.push(assistantMessage)

    isLoading.value = true
    isStreaming.value = true

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify({ message: content }),
        signal: currentAbortController.signal
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let chatId = null

      // 找到消息在数组中的索引
      const messageIndex = messages.value.findIndex(msg => msg.id === assistantMessageId)
      if (messageIndex === -1) {
        throw new Error('找不到消息索引')
      }

      const message = messages.value[messageIndex]
      
      // 打字机效果：字符队列和显示函数
      let charQueue = []
      let isTyping = false
      let typingTimer = null
      
      const typeNextChar = () => {
        if (charQueue.length === 0) {
          isTyping = false
          return
        }
        
        const char = charQueue.shift()
        message.content += char
        isTyping = true
        
        // 根据字符类型调整延迟：中文和标点稍慢，英文和数字稍快
        const delay = /[\u4e00-\u9fa5，。！？；：、]/.test(char) ? 50 : 30
        
        typingTimer = setTimeout(() => {
          typeNextChar()
        }, delay)
      }
      
      const addCharsToQueue = (chars) => {
        if (typeof chars === 'string') {
          charQueue.push(...Array.from(chars))
        } else {
          charQueue.push(chars)
        }
        
        if (!isTyping) {
          typeNextChar()
        }
      }

      while (true) {
        let readResult
        try {
          readResult = await reader.read()
        } catch (err) {
          // 如果读取被中断，停止打字效果
          if (typingTimer) {
            clearTimeout(typingTimer)
            typingTimer = null
          }
          if (err.name === 'AbortError' || err.name === 'TypeError') {
            break
          }
          throw err
        }

        const { done, value } = readResult

        if (done) {
          // 等待队列中的所有字符显示完成
          while (charQueue.length > 0 || isTyping) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          if (typingTimer) {
            clearTimeout(typingTimer)
            typingTimer = null
          }
          // 标记流式响应完成
          message.isStreaming = false
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            // 首先检查是否是chatId消息（后端发送的特殊消息）
            try {
              const json = JSON.parse(data)
              if (json.type === 'chatId') {
                chatId = json.data
                continue
              }
            } catch (e) {
              // 不是JSON格式，继续处理
            }

            // 处理AI API的原始SSE数据
            if (data === '[DONE]') {
              // 流式响应完成，等待打字效果完成
              while (charQueue.length > 0 || isTyping) {
                await new Promise(resolve => setTimeout(resolve, 100))
              }
              if (typingTimer) {
                clearTimeout(typingTimer)
                typingTimer = null
              }
              message.isStreaming = false
              break
            }

            try {
              const json = JSON.parse(data)
              const content = json.choices?.[0]?.delta?.content || ''
              
              // 将内容添加到队列中，实现打字机效果
              if (content) {
                addCharsToQueue(content)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      isLoading.value = false
      isStreaming.value = false
      currentAbortController = null

      return { success: true, data: { chatId } }
    } catch (error) {
      // 清理打字机定时器
      if (typingTimer) {
        clearTimeout(typingTimer)
        typingTimer = null
      }
      
      isLoading.value = false
      isStreaming.value = false
      currentAbortController = null

      // 如果是取消请求，不显示错误
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        const messageIndex = messages.value.findIndex(msg => msg.id === assistantMessageId)
        if (messageIndex !== -1) {
          const message = messages.value[messageIndex]
          message.isStreaming = false
          if (!message.content || message.content.trim() === '') {
            message.content = '[已取消]'
          } else if (!message.content.includes('[已停止生成]')) {
            message.content += '\n\n[已停止生成]'
          }
        }
        return { success: false, error: '请求已取消' }
      }

      // 更新错误消息
      const messageIndex = messages.value.findIndex(msg => msg.id === assistantMessageId)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        // 停止打字效果（如果还在运行）
        if (message._typingTimer) {
          clearTimeout(message._typingTimer)
          message._typingTimer = null
        }
        message.isStreaming = false
        message.content = error.message || '抱歉，发生了错误。'
      }

      return { success: false, error: error.message || '发送消息失败' }
    }
  }

  const stopStreaming = () => {
    if (currentAbortController) {
      currentAbortController.abort()
      currentAbortController = null
      isStreaming.value = false
      isLoading.value = false
      
      // 找到正在流式传输的消息并标记为停止
      const streamingMessage = messages.value.find(msg => msg.isStreaming)
      if (streamingMessage) {
        streamingMessage.isStreaming = false
        if (!streamingMessage.content.includes('[已停止生成]')) {
          streamingMessage.content += '\n\n[已停止生成]'
        }
      }
    }
  }

  const loadHistory = async () => {
    if (!token.value) {
      return { success: false, error: '请先登录' }
    }

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE}/chat/history`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      const result = await response.json()

      if (result.chats) {
        // 将所有聊天记录扁平化并按时间排序
        const allMessages = []
        result.chats.forEach(chatGroup => {
          chatGroup.forEach(msg => {
            allMessages.push({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              isStreaming: false
            })
          })
        })

        // 按时间戳排序
        allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        
        // 更新消息列表
        messages.value = allMessages
      }

      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message || '加载历史记录失败' }
    }
  }

  const clearMessages = () => {
    messages.value = []
  }

  return {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    stopStreaming,
    loadHistory,
    clearMessages
  }
}
