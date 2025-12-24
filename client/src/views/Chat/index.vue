<template>
  <div class="chat-container">
    <!-- 左侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="sidebar-logo-text">K</span>
        </div>
        <button class="sidebar-toggle" @click="toggleSidebar" :title="sidebarCollapsed ? '展开' : '收起'">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="sidebarCollapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <button class="nav-button" @click="handleNewSession" v-if="!sidebarCollapsed">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>新建会话</span>
        </button>

        <div class="nav-section-title" v-if="!sidebarCollapsed">
          <svg class="nav-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>历史会话</span>
        </div>

        <!-- 会话列表 -->
        <div class="sessions-list" v-if="!sidebarCollapsed">
          <div v-for="session in sessions" :key="session.id" class="session-item"
            :class="{ active: currentChatId === session.id, pinned: session.isPinned }"
            @click="loadSessionById(session.id)">
            <div class="session-title" @dblclick.stop="handleEditTitle(session)" :title="session.title">
              {{ session.title }}
            </div>
            <div class="session-actions">
              <button class="session-pin" @click.stop="handleTogglePin(session.id, session.isPinned)"
                :title="session.isPinned ? '取消置顶' : '置顶'">
                <svg v-if="session.isPinned" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h10v-2l-2-2z" />
                </svg>
                <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button class="session-edit" @click.stop="handleEditTitle(session)" title="编辑标题">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button class="session-delete" @click.stop="handleDeleteSession(session.id)" title="删除会话">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- 底部 -->
      <div class="sidebar-footer">
        <div v-if="!isAuthenticated" class="sidebar-footer-content">
          <div class="sidebar-footer-text">登录以同步历史会话</div>
          <button class="nav-button">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span v-if="!sidebarCollapsed">查看手机应用</span>
          </button>
          <button @click="showLoginModal = true" class="nav-button">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span v-if="!sidebarCollapsed">登录</span>
          </button>
        </div>
        <div v-else>
          <div v-if="isAdmin" class="admin-button-wrapper">
            <router-link to="/admin" class="admin-button">
              <svg class="admin-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span v-if="!sidebarCollapsed">后台管理</span>
            </router-link>
          </div>
          <div class="user-profile-card" @click="showSettings = true">
            <div class="user-avatar">
              <span class="user-avatar-text">{{ userInitial }}</span>
            </div>
            <div class="user-info" v-if="!sidebarCollapsed">
              <div class="user-name">{{ user?.username || '用户' }}</div>
            </div>
            <svg v-if="!sidebarCollapsed" class="user-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 设置页面 -->
      <div v-if="showSettings" class="settings-overlay">
        <div class="settings-container">
          <div class="settings-header">
            <h2 class="settings-title">设置</h2>
            <button class="settings-close-button" @click="showSettings = false">
              <svg class="settings-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="settings-content">
            <div class="settings-section">
              <h3 class="settings-section-title">外观</h3>
              <div class="settings-item">
                <div class="settings-item-label">主题</div>
                <n-select v-model:value="themeName" :options="themeOptions" @update:value="handleThemeChange"
                  class="settings-select" />
              </div>
            </div>
            <div class="settings-section">
              <h3 class="settings-section-title">账户</h3>
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">用户名</div>
                  <div class="settings-item-value">{{ user?.username || '未设置' }}</div>
                </div>
              </div>
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">邮箱</div>
                  <div class="settings-item-value">{{ user?.email || '未设置' }}</div>
                </div>
              </div>
              <div class="settings-item">
                <n-button type="error" block @click="handleLogout">
                  登出
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 消息区域 -->
      <div v-if="!showSettings" class="messages-container custom-scrollbar" ref="messagesContainer">
        <!-- 如果没有消息，显示欢迎界面 -->
        <div v-if="messages.length === 0" class="welcome-container">
          <!-- 标题 -->
          <div class="welcome-header">
            <div class="welcome-title-wrapper">
              <span class="welcome-emoji">😊</span>
              <h1 class="welcome-title">OK Computer</h1>
            </div>
          </div>

          <!-- 输入框 -->
          <div class="welcome-input-wrapper">
            <div class="welcome-input-box">
              <textarea v-model="inputMessage" placeholder="尽管问..." class="welcome-input textarea-field"
                :disabled="isLoading || isStreaming || !isAuthenticated" rows="1"
                @keydown.enter.exact.prevent="handleSend" @keydown.shift.enter.exact.prevent="inputMessage += '\n'"
                @input="autoResizeTextarea"></textarea>

              <!-- 模型选择触发器 -->
              <div class="model-selector-wrapper" :class="{ disabled: isLoading || isStreaming || !isAuthenticated }">
                <button type="button" class="model-selector-trigger" :class="{ active: showModelMenu }"
                  @click="toggleModelMenu" :disabled="isLoading || isStreaming || !isAuthenticated">
                  <span class="model-selector-text">{{ selectedModelName || '选择模型' }}</span>
                  <svg class="model-selector-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- 模型选择弹窗 -->
                <div class="model-menu" :class="{ active: showModelMenu }">
                  <div class="model-menu-container">
                    <!-- 一级菜单：品牌列表 -->
                    <div class="model-menu-level brand-level">
                      <div v-for="brand in modelOptions" :key="brand.value" class="model-menu-item brand-item"
                        :class="{ 'has-models': brand.models && brand.models.length > 0 }"
                        @mouseenter="showBrandModels(brand.value)" @mouseleave="hideBrandModels">
                        <span class="model-menu-name">{{ brand.label }}</span>
                        <svg v-if="brand.models && brand.models.length > 0" class="model-menu-arrow" fill="none"
                          stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <!-- 二级菜单：模型列表（悬浮显示） -->
                    <div class="model-menu-level model-level" :class="{ active: hoveredBrandId }"
                      v-if="hoveredBrandModels.length > 0" @mouseenter="clearHideTimer" @mouseleave="hideBrandModels">
                      <div v-for="model in hoveredBrandModels" :key="model.value" class="model-menu-item model-item"
                        :class="{ selected: currentModelId === model.value }"
                        @click="selectModel(model.value, model.label, model.serviceName)">
                        <div class="model-item-content">
                          <span class="model-menu-name">{{ model.serviceName }}</span>
                          <span class="model-menu-desc" v-if="model.description">{{ model.description }}</span>
                        </div>
                        <svg v-if="currentModelId === model.value" class="model-menu-check" fill="currentColor"
                          viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button v-if="isStreaming" type="button" @click="handleStop" class="welcome-icon-button stop-button"
                title="停止生成">
                <svg class="welcome-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z" />
                </svg>
              </button>
              <button v-else @click.prevent="handleSend"
                :disabled="!inputMessage.trim() || isLoading || isStreaming || !isAuthenticated"
                class="welcome-icon-button">
                <svg class="welcome-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 标签 -->
          <!-- <div class="welcome-tags">
            <button class="welcome-tag welcome-tag-active">
              <svg class="welcome-tag-icon" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              推荐
            </button>
            <button class="welcome-tag">
              <svg class="welcome-tag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              网页应用
            </button>
            <button class="welcome-tag">
              <svg class="welcome-tag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              移动应用
            </button>
            <button class="welcome-tag">
              <svg class="welcome-tag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              数据分析
            </button>
            <button class="welcome-tag">
              <svg class="welcome-tag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              灵感
            </button>
          </div> -->

          <!-- 推荐提示 -->
          <!-- <div class="welcome-suggestions">
            <button class="welcome-suggestion">
              <div class="welcome-suggestion-content">
                <svg class="welcome-suggestion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span class="welcome-suggestion-text">西高地小狗主题站:写真、百科、商城</span>
              </div>
              <svg class="welcome-suggestion-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button class="welcome-suggestion">
              <div class="welcome-suggestion-content">
                <svg class="welcome-suggestion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span class="welcome-suggestion-text">星巴克25财年Q3电话会数据详析</span>
              </div>
              <svg class="welcome-suggestion-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button class="welcome-suggestion">
              <div class="welcome-suggestion-content">
                <svg class="welcome-suggestion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="welcome-suggestion-text">生成4人国庆7天内蒙追秋自驾行程</span>
              </div>
              <svg class="welcome-suggestion-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div> -->
        </div>

        <!-- 消息列表 -->
        <div v-else class="messages-list">
          <div v-for="message in messages" :key="message.id"
            :class="['message-wrapper', message.role === 'user' ? 'message-user' : 'message-assistant']">
            <div
              :class="['message-bubble', message.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant']">
              <div class="message-content">{{ message.content }}</div>
              <div v-if="message.isStreaming" class="message-cursor"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入框（有消息时显示） -->
      <div v-if="messages.length > 0" class="input-container">
        <form @submit.prevent="handleSend" class="input-form">
          <div class="input-wrapper">
            <div class="input-box">
              <textarea v-model="inputMessage" placeholder="尽管问..." class="input-field textarea-field"
                :disabled="isLoading || isStreaming" rows="1" @keydown.enter.exact.prevent="handleSend"
                @keydown.shift.enter.exact.prevent="inputMessage += '\n'" @input="autoResizeTextarea"></textarea>
              <div class="input-actions">
                <!-- 模型选择触发器 -->
                <div class="model-selector-wrapper" :class="{ disabled: isLoading || isStreaming || !isAuthenticated }">
                  <button type="button" class="model-selector-trigger" :class="{ active: showModelMenu }"
                    @click="toggleModelMenu" :disabled="isLoading || isStreaming || !isAuthenticated">
                    <span class="model-selector-text">{{ selectedModelName || '选择模型' }}</span>
                    <svg class="model-selector-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <!-- 模型选择弹窗 -->
                  <div class="model-menu" :class="{ active: showModelMenu }">
                    <div class="model-menu-container">
                      <!-- 一级菜单：品牌列表 -->
                      <div class="model-menu-level brand-level">
                        <div v-for="brand in modelOptions" :key="brand.value" class="model-menu-item brand-item"
                          :class="{ 'has-models': brand.models && brand.models.length > 0 }"
                          @mouseenter="showBrandModels(brand.value)" @mouseleave="hideBrandModels">
                          <span class="model-menu-name">{{ brand.label }}</span>
                          <svg v-if="brand.models && brand.models.length > 0" class="model-menu-arrow" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      <!-- 二级菜单：模型列表（悬浮显示） -->
                      <div class="model-menu-level model-level" :class="{ active: hoveredBrandId }"
                        v-if="hoveredBrandModels.length > 0" @mouseenter="clearHideTimer" @mouseleave="hideBrandModels">
                        <div v-for="model in hoveredBrandModels" :key="model.value" class="model-menu-item model-item"
                          :class="{ selected: currentModelId === model.value }"
                          @click="selectModel(model.value, model.label, model.serviceName)">
                          <div class="model-item-content">
                            <span class="model-menu-name">{{ model.serviceName }}</span>
                            <span class="model-menu-desc" v-if="model.description">{{ model.description }}</span>
                          </div>
                          <svg v-if="currentModelId === model.value" class="model-menu-check" fill="currentColor"
                            viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button v-if="isStreaming" type="button" @click="handleStop" class="input-button stop-button"
                  title="停止生成">
                  <svg class="input-icon" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
                <button v-else type="submit" :disabled="!inputMessage.trim() || isLoading" class="input-button"
                  title="发送">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- 底部提示 -->
      <div class="footer-note">
        <p class="footer-note-text">内容由AI生成,请仔细甄别</p>
      </div>
    </main>

    <!-- 登录/注册弹窗 -->
    <n-modal v-model:show="showLoginModal" preset="card" title="登录 / 注册" style="width: 400px">
      <n-tabs v-model:value="loginTab" type="line">
        <n-tab-pane name="login" tab="登录">
          <n-form ref="loginFormRef" :model="loginForm" :rules="loginRules">
            <n-form-item path="username" label="用户名">
              <n-input v-model:value="loginForm.username" placeholder="请输入用户名" />
            </n-form-item>
            <n-form-item path="password" label="密码">
              <n-input v-model:value="loginForm.password" type="password" placeholder="请输入密码"
                @keyup.enter="handleLogin" />
            </n-form-item>
          </n-form>
          <n-button type="primary" block :loading="loginLoading" @click="handleLogin">
            登录
          </n-button>
        </n-tab-pane>
        <n-tab-pane name="register" tab="注册">
          <n-form ref="registerFormRef" :model="registerForm" :rules="registerRules">
            <n-form-item path="username" label="用户名">
              <n-input v-model:value="registerForm.username" placeholder="请输入用户名" />
            </n-form-item>
            <n-form-item path="email" label="邮箱（可选）">
              <n-input v-model:value="registerForm.email" placeholder="请输入邮箱" />
            </n-form-item>
            <n-form-item path="password" label="密码">
              <n-input v-model:value="registerForm.password" type="password" placeholder="请输入密码"
                @keyup.enter="handleRegister" />
            </n-form-item>
          </n-form>
          <n-button type="primary" block :loading="registerLoading" @click="handleRegister">
            注册
          </n-button>
        </n-tab-pane>
      </n-tabs>
    </n-modal>

    <!-- 编辑会话标题弹窗 -->
    <n-modal v-model:show="showEditTitleModal" preset="card" title="编辑会话标题" style="width: 400px">
      <n-input v-model:value="editingTitle" type="textarea" placeholder="请输入会话标题" :rows="3" maxlength="50" show-count
        :autosize="{ minRows: 2, maxRows: 4 }" />
      <template #action>
        <n-space>
          <n-button @click="showEditTitleModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveTitle">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useChat } from '@/composables/useChat'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import './index.css'

const message = useMessage()
const {
  messages,
  isLoading,
  isStreaming,
  currentChatId,
  sendMessage,
  stopStreaming,
  loadHistory,
  createNewSession,
  loadSessions,
  loadSessionHistoryById,
  deleteMessage,
  updateSessionTitle,
  toggleSessionPin,
  deleteSession
} = useChat()
const { login, register, logout, isAuthenticated, user, isAdmin, token } = useAuth()
const { themeName, setTheme } = useTheme()
const inputMessage = ref('')
const messagesContainer = ref(null)
const showSettings = ref(false)
const selectedModel = ref(null)
const modelOptions = ref([])
const currentModelId = ref(null)
const selectedModelName = ref('')
const showModelMenu = ref(false)
const hoveredBrandId = ref(null)
const hoveredBrandModels = ref([])
const sessions = ref([])
const showSessions = ref(false)
const showEditTitleModal = ref(false)
const editingSession = ref(null)
const editingTitle = ref('')
const sidebarCollapsed = ref(false)

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 主题相关
const themeOptions = [
  { label: '跟随系统', value: 'system' },
  { label: '深色', value: 'dark' },
  { label: '浅色', value: 'light' }
]

// 用户头像首字母
const userInitial = computed(() => {
  if (user.value?.username) {
    return user.value.username.charAt(0).toUpperCase()
  }
  return 'U'
})

// 登录弹窗相关
const showLoginModal = ref(false)
const loginTab = ref('login')
const loginLoading = ref(false)
const registerLoading = ref(false)
const loginFormRef = ref(null)
const registerFormRef = ref(null)

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: ''
})

const loginRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur'
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur'
  }
}

const registerRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur'
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur'
  }
}

// 滚动到底部的函数
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 检查登录状态，未登录则弹出登录弹窗
const checkAuth = () => {
  if (!isAuthenticated.value) {
    showLoginModal.value = true
    return false
  }
  return true
}

// 加载可用模型列表
const loadAvailableModels = async () => {
  if (!isAuthenticated.value) {
    return
  }

  try {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'
    const response = await fetch(`${API_BASE}/chat/models/available`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.brands) {
        // 保存品牌和模型数据
        modelOptions.value = result.brands.map(brand => ({
          label: brand.name,
          value: brand.id,
          models: brand.models.map(model => ({
            label: model.name,
            serviceName: model.serviceName, // serviceName现在是必填字段
            value: model.id,
            description: model.description || ''
          }))
        }))

        // 默认选择第一个模型
        selectFirstModel()
      }
    }
  } catch (error) {
    console.error('加载模型列表失败:', error)
  }
}

// 选择第一个模型（默认选择）
const selectFirstModel = () => {
  // 找到第一个有模型的品牌
  const firstBrandWithModels = modelOptions.value.find(brand => brand.models && brand.models.length > 0)
  if (firstBrandWithModels && firstBrandWithModels.models.length > 0) {
    const firstModel = firstBrandWithModels.models[0]
    currentModelId.value = firstModel.value
    selectedModelName.value = firstModel.serviceName || firstModel.label
  }
}

// 切换模型菜单显示/隐藏
const toggleModelMenu = () => {
  if (isLoading.value || isStreaming.value || !isAuthenticated.value) {
    return
  }
  showModelMenu.value = !showModelMenu.value
  if (!showModelMenu.value) {
    hoveredBrandId.value = null
    hoveredBrandModels.value = []
  }
}

// 显示品牌的模型列表（悬停）
const showBrandModels = (brandId) => {
  const brand = modelOptions.value.find(b => b.value === brandId)
  if (brand && brand.models && brand.models.length > 0) {
    hoveredBrandId.value = brandId
    hoveredBrandModels.value = brand.models
  } else {
    // 如果没有模型，关闭二级菜单
    hoveredBrandId.value = null
    hoveredBrandModels.value = []
  }
}

// 隐藏品牌的模型列表（离开悬停）
let hideTimer = null
const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

const hideBrandModels = () => {
  // 清除之前的定时器
  clearHideTimer()
  // 延迟隐藏，以便用户可以从品牌项移动到模型项
  hideTimer = setTimeout(() => {
    const menuElement = document.querySelector('.model-menu')
    const brandItem = document.querySelector('.brand-item:hover')
    const modelLevel = document.querySelector('.model-level:hover')

    // 如果鼠标不在菜单区域内，才隐藏
    if (!menuElement?.matches(':hover') && !brandItem && !modelLevel) {
      hoveredBrandId.value = null
      hoveredBrandModels.value = []
    }
  }, 150)
}

// 选择模型
const selectModel = (modelId, modelName, serviceName) => {
  currentModelId.value = modelId
  selectedModelName.value = serviceName // serviceName现在是必填字段
  showModelMenu.value = false
  hoveredBrandId.value = null
  hoveredBrandModels.value = []
}

// 自动调整textarea高度
const autoResizeTextarea = (event) => {
  const textarea = event.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
}

// 创建新会话（清空当前消息，准备新会话）
const handleNewSession = async () => {
  const result = await createNewSession()
  if (result.success) {
    message.success('已准备新会话，发送消息后创建')
  } else {
    message.error(result.error || '准备新会话失败')
  }
}

// 刷新会话列表
const refreshSessions = async () => {
  const result = await loadSessions()
  if (result.success && result.data.sessions) {
    sessions.value = result.data.sessions
  }
}

// 加载指定会话的历史记录
const loadSessionById = async (chatId) => {
  currentChatId.value = chatId
  const result = await loadSessionHistoryById(chatId)
  if (result.success) {
    scrollToBottom()
  } else {
    message.error(result.error || '加载历史记录失败')
  }
}

// 删除会话
const handleDeleteSession = async (chatId) => {
  const result = await deleteSession(chatId)
  if (result.success) {
    // 如果删除的是当前会话，清空消息列表
    if (currentChatId.value === chatId) {
      messages.value = []
      currentChatId.value = null
    }
    // 刷新会话列表
    await refreshSessions()
    message.success('会话已删除')
  } else {
    message.error(result.error || '删除会话失败')
  }
}

// 编辑会话标题
const handleEditTitle = (session) => {
  editingSession.value = session
  editingTitle.value = session.title
  showEditTitleModal.value = true
}

// 保存会话标题
const handleSaveTitle = async () => {
  if (!editingSession.value) return

  const result = await updateSessionTitle(editingSession.value.id, editingTitle.value.trim())
  if (result.success) {
    await refreshSessions()
    showEditTitleModal.value = false
    editingSession.value = null
    editingTitle.value = ''
    message.success('会话标题已更新')
  } else {
    message.error(result.error || '更新标题失败')
  }
}

// 切换置顶状态
const handleTogglePin = async (chatId, isPinned) => {
  const result = await toggleSessionPin(chatId, !isPinned)
  if (result.success) {
    await refreshSessions()
    message.success(isPinned ? '已取消置顶' : '已置顶')
  } else {
    message.error(result.error || '操作失败')
  }
}

// 监听会话更新事件，刷新会话列表
const handleSessionUpdate = async () => {
  await refreshSessions()
}

// 监听消息发送完成事件，刷新会话列表
const handleMessageSent = async () => {
  await refreshSessions()
}

// 页面加载时获取历史记录（如果已登录）
onMounted(async () => {
  if (isAuthenticated.value) {
    await loadAvailableModels()
    await refreshSessions()
    // 如果有会话，默认选中最新会话并加载其消息
    if (sessions.value && sessions.value.length > 0) {
      const latestSession = sessions.value[0] // 第一个就是最新的（按updatedAt DESC排序）
      await loadSessionById(latestSession.id)
    } else {
      // 如果没有会话，加载所有历史记录（默认展示全部会话）
      await loadHistory()
    }
    scrollToBottom()
  }

  // 监听会话更新和消息发送事件
  window.addEventListener('chatSessionUpdated', handleSessionUpdate)
  window.addEventListener('chatMessageSent', handleMessageSent)
})

// 监听登录状态变化，加载模型列表
watch(isAuthenticated, async (newVal) => {
  if (newVal) {
    await loadAvailableModels()
  }
})

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  const wrapper = event.target.closest('.model-selector-wrapper')
  if (!wrapper && showModelMenu.value) {
    showModelMenu.value = false
    hoveredBrandId.value = null
    hoveredBrandModels.value = []
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('chatSessionUpdated', handleSessionUpdate)
  window.removeEventListener('chatMessageSent', handleMessageSent)
  document.removeEventListener('click', handleClickOutside)
})

// 发送消息处理
const handleSend = async () => {
  if (!inputMessage.value.trim() || isLoading.value || isStreaming.value) return

  // 检查登录状态
  if (!checkAuth()) {
    message.warning('请先登录')
    return
  }

  // 刷新模型列表，防止模型被禁用导致错误
  await loadAvailableModels()

  const content = inputMessage.value.trim()
  inputMessage.value = ''

  // 重置textarea高度
  nextTick(() => {
    const textarea = document.querySelector('.textarea-field')
    if (textarea) {
      textarea.style.height = 'auto'
    }
  })

  const result = await sendMessage(content, currentModelId.value)
  if (!result.success && result.error !== '请求已取消') {
    message.error(result.error || '发送消息失败')
  }
  scrollToBottom()
}

// 停止生成处理
const handleStop = () => {
  stopStreaming()
  message.info('已停止生成')
}

// 登录处理
const handleLogin = async () => {
  try {
    await loginFormRef.value?.validate()
  } catch (error) {
    return
  }

  loginLoading.value = true
  const result = await login(loginForm.value.username, loginForm.value.password)
  loginLoading.value = false

  if (result.success) {
    message.success('登录成功')
    showLoginModal.value = false
    loginForm.value = { username: '', password: '' }
    // 加载历史记录和模型列表
    const historyResult = await loadHistory()
    if (!historyResult.success && historyResult.error) {
      message.error(historyResult.error)
    }
    await loadAvailableModels()
    scrollToBottom()
  } else {
    message.error(result.error || '登录失败')
  }
}

// 注册处理
const handleRegister = async () => {
  try {
    await registerFormRef.value?.validate()
  } catch (error) {
    return
  }

  registerLoading.value = true
  const result = await register(
    registerForm.value.username,
    registerForm.value.password,
    registerForm.value.email
  )
  registerLoading.value = false

  if (result.success) {
    message.success('注册成功')
    showLoginModal.value = false
    registerForm.value = { username: '', email: '', password: '' }
    // 加载历史记录和模型列表
    const historyResult = await loadHistory()
    if (!historyResult.success && historyResult.error) {
      message.error(historyResult.error)
    }
    await loadAvailableModels()
    scrollToBottom()
  } else {
    message.error(result.error || '注册失败')
  }
}

// 主题切换处理
const handleThemeChange = (value) => {
  setTheme(value)
  const themeLabels = {
    system: '跟随系统',
    dark: '深色',
    light: '浅色'
  }
  message.success(`已切换到${themeLabels[value]}主题`)
}

// 登出处理
const handleLogout = () => {
  logout()
  message.success('已登出')
  messages.value = []
  showSettings.value = false
}

// 自动滚动到底部
watch(() => messages.value.length, () => {
  scrollToBottom()
})

// 监听消息内容变化，自动滚动（用于流式响应）
watch(() => messages.value.map(m => m.content).join(''), () => {
  if (isStreaming.value) {
    scrollToBottom()
  }
}, { flush: 'post' })

// 监听登录状态变化，自动加载历史记录
watch(isAuthenticated, async (newVal) => {
  if (newVal) {
    const result = await loadHistory()
    if (!result.success && result.error) {
      message.error(result.error)
    }
    scrollToBottom()
  } else {
    messages.value = []
  }
})
</script>
