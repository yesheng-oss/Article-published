import { useState, useEffect } from 'react'
import { X, Star, Share2 } from 'lucide-react'

const STORAGE_KEY = 'share_prompt_dismissed'
const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/%E6%96%87%E7%AB%A0%E5%90%8C%E6%AD%A5%E5%8A%A9%E6%89%8B/hchobocdmclopcbnibdnoafilagadion/reviews'
const SHARE_TEXT = '推荐一个开源免费的多平台文章同步工具，一键同步到知乎、掘金、头条、小红书等29+平台 https://www.wechatsync.com'

// 显示分享提示的里程碑次数
const MILESTONES = [5, 20, 50]
const RECURRING_INTERVAL = 100 // 50次之后每100次提示一次

/**
 * 同步成功后显示的分享/好评引导
 * 在第 5、20、50 次同步后显示，之后每 100 次显示一次
 * 关闭后记录当前次数，下次达到新里程碑时再显示
 */
export function SharePrompt() {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkShouldShow().then(setVisible).catch(() => {})
  }, [])

  if (!visible) return null

  const handleDismiss = async () => {
    setVisible(false)
    // 记录关闭时的同步次数，下次达到新里程碑时再显示
    const storage = await chrome.storage.local.get('total_syncs')
    await chrome.storage.local.set({ [STORAGE_KEY]: storage.total_syncs || 0 })
  }

  const handleShare = () => {
    // Use textarea fallback for clipboard (works in extension popup)
    const textarea = document.createElement('textarea')
    textarea.value = SHARE_TEXT
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-3 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 p-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity text-violet-400"
      >
        <X className="w-3 h-3" />
      </button>
      <p className="text-xs font-medium text-violet-800 dark:text-violet-300 mb-2 pr-4">
        觉得好用吗？你的支持是最大的动力
      </p>
      <div className="flex gap-2">
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors"
        >
          <Star className="w-3 h-3" />
          去好评
        </a>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors"
        >
          <Share2 className="w-3 h-3" />
          {copied ? '已复制' : '分享给朋友'}
        </button>
      </div>
    </div>
  )
}

async function checkShouldShow(): Promise<boolean> {
  const storage = await chrome.storage.local.get([STORAGE_KEY, 'total_syncs'])
  const totalSyncs = storage.total_syncs || 0
  const dismissedAt = storage[STORAGE_KEY] || 0 // 上次关闭时的同步次数

  // 找到当前应该触发的里程碑
  let nextMilestone = 0
  for (const m of MILESTONES) {
    if (totalSyncs >= m) nextMilestone = m
  }
  // 50次之后，每100次触发
  if (totalSyncs >= MILESTONES[MILESTONES.length - 1]) {
    const base = MILESTONES[MILESTONES.length - 1]
    const extra = Math.floor((totalSyncs - base) / RECURRING_INTERVAL) * RECURRING_INTERVAL
    nextMilestone = base + extra
  }

  // 没达到任何里程碑
  if (nextMilestone === 0) return false

  // 上次关闭时已经是这个里程碑或更高，不再显示
  if (dismissedAt >= nextMilestone) return false

  return true
}
