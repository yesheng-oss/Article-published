/**
 * 头条媒体平台 Content Script
 * 监听 background 请求，在页面上下文执行 fetch
 */
import { createLogger } from '../lib/logger'

const logger = createLogger('ToutiaoCS')

// 监听来自 background 的 fetch 请求
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TOUTIAO_PAGE_FETCH') {
    const { url, options } = message.payload
    logger.debug('Received fetch request:', url)

    // 直接在 content script 中使用 fetch
    // 注意：content script 的 fetch 不会自动注入 msToken/a_bogus
    // 需要通过 background 使用 chrome.scripting.executeScript 在 MAIN world 执行
    fetch(url, {
      ...options,
      credentials: 'include',
    })
      .then(async (response) => {
        const text = await response.text()
        let data
        try {
          data = JSON.parse(text)
        } catch {
          data = text
        }
        logger.debug('Fetch response:', data)
        sendResponse({ success: true, data })
      })
      .catch((err) => {
        logger.error('Fetch error:', err)
        sendResponse({ success: false, error: err.message })
      })

    return true // 异步响应
  }
})

logger.debug('Toutiao content script loaded')
