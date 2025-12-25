import { ref } from 'vue'
import { useAuth } from './useAuth'

const messages = ref([])
const isLoading = ref(false)
const isStreaming = ref(false)
const currentChatId = ref(null)
let currentAbortController = null

export const useChat = () => {
  const { token } = useAuth()

  const sendMessage = async (content, modelId = null) => {
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

    // 打字机效果变量（在try块之前声明，确保在catch块中可以访问）
    let charQueue = []
    let isTyping = false
    let typingTimer = null

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify({ message: content, modelId, chatId: currentChatId.value }),
        signal: currentAbortController.signal
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // 找到消息在数组中的索引
      const messageIndex = messages.value.findIndex(msg => msg.id === assistantMessageId)
      if (messageIndex === -1) {
        throw new Error('找不到消息索引')
      }

      const message = messages.value[messageIndex]
      
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
              if (json.type === 'chatId' && json.chatId) {
                // 更新当前会话ID
                currentChatId.value = json.chatId
                // 触发会话列表刷新（通过事件）
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('chatSessionUpdated', { detail: { chatId: json.chatId } }))
                }
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

      // 消息发送完成，触发会话列表刷新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chatMessageSent', { detail: { chatId: currentChatId.value } }))
      }

      return { success: true }
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
        if (typingTimer) {
          clearTimeout(typingTimer)
          typingTimer = null
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
      // 默认加载所有会话的消息（不传chatId参数）
      const response = await fetch(`${API_BASE}/chat/history`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      const result = await response.json()

      // 如果返回的是分组的数据（chats对象），合并所有会话的消息
      if (result.chats && typeof result.chats === 'object' && !Array.isArray(result.chats)) {
        const allMessages = []
        Object.values(result.chats).forEach(sessionMessages => {
          if (Array.isArray(sessionMessages)) {
            sessionMessages.forEach(msg => {
              allMessages.push({
                id: msg.id,
                chatId: msg.chatId,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                isStreaming: false
              })
            })
          }
        })
        // 按时间戳排序
        allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        messages.value = allMessages
      } else if (result.chats && Array.isArray(result.chats)) {
        // 如果返回的是数组格式
        const allMessages = result.chats.map(msg => ({
          id: msg.id,
          chatId: msg.chatId,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          isStreaming: false
        }))
        allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        messages.value = allMessages
      } else {
        messages.value = []
      }

      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message || '加载历史记录失败' }
    }
  }

  const clearMessages = () => {
    messages.value = []
    currentChatId.value = null
  }

  // 创建新会话（清空当前消息，不调用后端，只有发送消息时才真正创建会话）
  const createNewSession = async () => {
    // 清空当前消息和会话ID，不调用后端
    // 只有当用户发送第一条消息时，后端才会真正创建新会话
      messages.value = []
      currentChatId.value = null
      
    return { success: true }
  }

  // 加载会话列表
  const loadSessions = async () => {
    if (!token.value) {
      return { success: false, error: '请先登录' }
    }

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE}/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message || '加载会话列表失败' }
    }
  }

  // 加载指定会话的历史记录
  const loadSessionHistoryById = async (chatId) => {
    if (!token.value) {
      return { success: false, error: '请先登录' }
    }

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE}/chat/history?chatId=${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      const result = await response.json()

      if (result.messages && result.messages.length > 0) {
        const sessionMessages = result.messages.map(msg => ({
          id: msg.id,
          chatId: msg.chatId,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          isStreaming: false
        }))

        // 按时间戳排序
        sessionMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        
        // 更新消息列表
        messages.value = sessionMessages
      } else {
        messages.value = []
      }

      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message || '加载历史记录失败' }
    }
  }

  // 删除消息
  const deleteMessage = async (messageId) => {
    if (!token.value) {
      return { success: false, error: '请先登录' }
    }

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE}/chat/message/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || '删除消息失败' }
    }
  }

  // 更新会话标题
  const updateSessionTitle = async (chatId, title) => {
    if (!token.value) {
      return { success: false, error: '请先登录' }
    }

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE}/chat/session/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify({ title })
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || '更新会话标题失败' }
    }
  }

  // 切换会话置顶状态
  const toggleSessionPin = async (chatId, isPinned) => {
    if (!token.value) {
      return { success: false, error: '请先登录' }
    }

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE}/chat/session/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify({ isPinned })
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || '切换置顶状态失败' }
    }
  }

  // 删除会话
  const deleteSession = async (chatId) => {
    if (!token.value) {
      return { success: false, error: '请先登录' }
    }

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE}/chat/session/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || '删除会话失败' }
    }
  }

  return {
    messages,
    isLoading,
    isStreaming,
    currentChatId,
    sendMessage,
    stopStreaming,
    loadHistory,
    clearMessages,
    createNewSession,
    loadSessions,
    loadSessionHistoryById,
    deleteMessage,
    updateSessionTitle,
    toggleSessionPin,
    deleteSession
  }
}
