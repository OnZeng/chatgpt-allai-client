import { ref, computed, watch } from 'vue'
import { darkTheme, lightTheme } from 'naive-ui'

const themeName = ref(localStorage.getItem('theme') || 'system')

// 检测系统主题
const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export const useTheme = () => {
  const actualTheme = computed(() => {
    if (themeName.value === 'system') {
      return getSystemTheme()
    }
    return themeName.value
  })

  const theme = computed(() => {
    return actualTheme.value === 'dark' ? darkTheme : lightTheme
  })

  const isDark = computed(() => actualTheme.value === 'dark')

  const toggleTheme = () => {
    if (themeName.value === 'dark') {
      themeName.value = 'light'
    } else if (themeName.value === 'light') {
      themeName.value = 'system'
    } else {
      themeName.value = 'dark'
    }
    localStorage.setItem('theme', themeName.value)
    updateDocumentClass()
  }

  const setTheme = (name) => {
    if (name === 'dark' || name === 'light' || name === 'system') {
      themeName.value = name
      localStorage.setItem('theme', themeName.value)
      updateDocumentClass()
    }
  }

  const updateDocumentClass = () => {
    const theme = actualTheme.value
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  // 监听系统主题变化
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (themeName.value === 'system') {
        updateDocumentClass()
      }
    }
    
    // 兼容不同浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange)
    }
  }

  // 初始化时更新文档类
  updateDocumentClass()

  return {
    theme,
    themeName,
    actualTheme,
    isDark,
    toggleTheme,
    setTheme
  }
}






