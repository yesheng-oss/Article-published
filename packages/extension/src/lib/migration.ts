/**
 * 数据迁移模块
 * 从旧版本 (v1.x) 迁移到新版本 (v2.x)
 */
import { createLogger } from './logger'

const logger = createLogger('Migration')

const MIGRATION_KEY = 'v2_migration_done'

interface OldAccount {
  uid: string
  type: 'wordpress' | 'typecho'
  params: {
    wpUrl: string
    wpUser: string
    wpPwd: string
    meta?: {
      blogName?: string
    }
  }
  title?: string
}

interface NewCMSAccount {
  id: string
  type: 'wordpress' | 'typecho' | 'metaweblog'
  name: string
  url: string
  username: string
  isConnected: boolean
}

/**
 * 检查并执行迁移
 * 在 popup 页面加载时调用（因为需要访问 localStorage）
 */
export async function checkAndMigrate(): Promise<void> {
  try {
    // 检查是否已迁移
    const storage = await chrome.storage.local.get(MIGRATION_KEY)
    if (storage[MIGRATION_KEY]) {
      logger.debug('Migration already done, skipping')
      return
    }

    // 检查 localStorage 中的旧数据
    const oldAccountsStr = localStorage.getItem('accounts')
    if (!oldAccountsStr) {
      logger.debug('No old accounts found in localStorage')
      await markMigrationDone()
      return
    }

    const oldAccounts: OldAccount[] = JSON.parse(oldAccountsStr)
    if (!oldAccounts.length) {
      logger.debug('Old accounts array is empty')
      await markMigrationDone()
      return
    }

    logger.info(`Found ${oldAccounts.length} old accounts to migrate`)

    // 获取现有的新版账户
    const existingStorage = await chrome.storage.local.get('cmsAccounts')
    const existingAccounts: NewCMSAccount[] = existingStorage.cmsAccounts || []

    // 转换并合并
    const migratedAccounts: NewCMSAccount[] = []
    const passwordUpdates: Record<string, string> = {}

    for (const oldAccount of oldAccounts) {
      // 检查是否已存在（通过 URL 判断）
      const exists = existingAccounts.some(
        a => a.url === oldAccount.params.wpUrl
      )
      if (exists) {
        logger.debug(`Account ${oldAccount.params.wpUrl} already exists, skipping`)
        continue
      }

      const id = `cms_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      const newAccount: NewCMSAccount = {
        id,
        type: oldAccount.type,
        name: oldAccount.title || oldAccount.params.meta?.blogName || oldAccount.params.wpUrl,
        url: oldAccount.params.wpUrl,
        username: oldAccount.params.wpUser,
        isConnected: true, // 假设之前能用就是连接的
      }

      migratedAccounts.push(newAccount)
      passwordUpdates[`cms_pwd_${id}`] = oldAccount.params.wpPwd

      logger.info(`Migrating account: ${newAccount.name} (${newAccount.type})`)
    }

    if (migratedAccounts.length === 0) {
      logger.info('No new accounts to migrate')
      await markMigrationDone()
      return
    }

    // 保存迁移后的数据
    const allAccounts = [...existingAccounts, ...migratedAccounts]
    await chrome.storage.local.set({
      cmsAccounts: allAccounts,
      ...passwordUpdates,
    })

    logger.info(`Successfully migrated ${migratedAccounts.length} accounts`)

    // 标记迁移完成
    await markMigrationDone()

    // 可选：清理旧数据（或保留作为备份）
    // localStorage.removeItem('accounts')

  } catch (error) {
    logger.error('Migration failed:', error)
    // 不标记为完成，下次还会尝试
  }
}

async function markMigrationDone(): Promise<void> {
  await chrome.storage.local.set({ [MIGRATION_KEY]: Date.now() })
  logger.debug('Migration marked as done')
}

/**
 * 重置迁移状态（用于调试）
 */
export async function resetMigration(): Promise<void> {
  await chrome.storage.local.remove(MIGRATION_KEY)
  logger.info('Migration status reset')
}
