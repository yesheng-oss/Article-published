/**
 * DOM 预处理页面
 *
 * 当没有可用的 http/https tab 时，Service Worker 创建此页面的临时 tab 做 DOM 预处理。
 * 处理完后 tab 自动关闭。
 */
import { preprocessForPlatform, preprocessContentDOM, type PreprocessResult } from '../lib/content-processor'
import { htmlToMarkdownNative, type PreprocessConfig } from '@wechatsync/core'

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PREPROCESS_FOR_PLATFORMS') {
    const { rawHtml, platforms, configs } = message.payload as {
      rawHtml: string
      platforms: string[]
      configs: Record<string, PreprocessConfig>
    }

    const platformContents: Record<string, PreprocessResult> = {}

    for (const platformId of platforms) {
      const config = configs[platformId]
      if (config) {
        platformContents[platformId] = preprocessForPlatform(rawHtml, config)
      } else {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = rawHtml
        preprocessContentDOM(tempDiv)
        const html = tempDiv.innerHTML
        platformContents[platformId] = {
          html,
          markdown: htmlToMarkdownNative(html),
        }
      }
    }

    sendResponse({ platformContents })
  }
  return false
})
