/**
 * 发布频率限制
 * 提醒用户不要频繁发布，避免被平台封禁
 */

interface SyncRecord {
  timestamp: number
  platforms: string[]
}

const STORAGE_KEY = 'syncRateLimitHistory'
const WARNING_INTERVAL_MS = 5 * 60 * 1000 // 5 分钟内重复发布会提醒
const HISTORY_RETENTION_MS = 24 * 60 * 60 * 1000 // 保留 24 小时的记录

/**
 * 获取同步历史
 */
async function getSyncHistory(): Promise<SyncRecord[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return result[STORAGE_KEY] || []
  } catch {
    return []
  }
}

/**
 * 保存同步历史
 */
async function saveSyncHistory(history: SyncRecord[]) {
  await chrome.storage.local.set({ [STORAGE_KEY]: history })
}

/**
 * 清理过期记录
 */
function cleanOldRecords(history: SyncRecord[]): SyncRecord[] {
  const cutoff = Date.now() - HISTORY_RETENTION_MS
  return history.filter(record => record.timestamp > cutoff)
}

/**
 * 记录一次同步
 */
export async function recordSync(platforms: string[]) {
  const history = await getSyncHistory()
  const cleaned = cleanOldRecords(history)

  cleaned.push({
    timestamp: Date.now(),
    platforms,
  })

  await saveSyncHistory(cleaned)
}

/**
 * 检查是否需要频率警告
 * @returns 警告信息，如果不需要警告则返回 null
 */
export async function checkSyncFrequency(platforms: string[]): Promise<string | null> {
  const history = await getSyncHistory()
  const now = Date.now()

  // 检查最近的同步记录
  const recentSyncs = history.filter(
    record => now - record.timestamp < WARNING_INTERVAL_MS
  )

  if (recentSyncs.length === 0) {
    return null
  }

  // 检查是否有相同平台的最近同步
  const recentPlatforms = new Set<string>()
  recentSyncs.forEach(record => {
    record.platforms.forEach(p => recentPlatforms.add(p))
  })

  const overlappingPlatforms = platforms.filter(p => recentPlatforms.has(p))

  if (overlappingPlatforms.length > 0) {
    const lastSync = recentSyncs[recentSyncs.length - 1]
    const minutesAgo = Math.floor((now - lastSync.timestamp) / 60000)

    return `您在 ${minutesAgo || '不到 1'} 分钟前刚同步过，频繁发布可能导致平台限制。确定要继续吗？`
  }

  return null
}

/**
 * 获取今日同步统计
 */
export async function getTodaySyncStats(): Promise<{ count: number; platforms: Record<string, number> }> {
  const history = await getSyncHistory()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todaySyncs = history.filter(record => record.timestamp >= todayStart.getTime())

  const platformCounts: Record<string, number> = {}
  todaySyncs.forEach(record => {
    record.platforms.forEach(p => {
      platformCounts[p] = (platformCounts[p] || 0) + 1
    })
  })

  return {
    count: todaySyncs.length,
    platforms: platformCounts,
  }
}
