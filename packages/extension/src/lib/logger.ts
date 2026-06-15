/**
 * 可控的日志系统
 * 根据设置决定是否输出日志
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  enabled: boolean
  level: LogLevel
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// 检测是否为生产环境（Vite 会在构建时替换）
const isProd = import.meta.env.PROD

// 默认配置：生产环境只输出 warn 和 error
let config: LoggerConfig = {
  enabled: true,
  level: isProd ? 'warn' : 'debug',
}

// 从 storage 加载配置
async function loadConfig() {
  try {
    const result = await chrome.storage.local.get('loggerConfig')
    if (result.loggerConfig) {
      config = { ...config, ...result.loggerConfig }
    }
  } catch {
    // 忽略错误，使用默认配置
  }
}

// 初始化时加载配置
loadConfig()

/**
 * 更新日志配置
 */
export async function setLoggerConfig(newConfig: Partial<LoggerConfig>) {
  config = { ...config, ...newConfig }
  await chrome.storage.local.set({ loggerConfig: config })
}

/**
 * 获取当前配置
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...config }
}

/**
 * 创建带前缀的 logger
 */
export function createLogger(prefix: string) {
  const shouldLog = (level: LogLevel): boolean => {
    if (!config.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[config.level]
  }

  return {
    debug: (...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.log(`[${prefix}]`, ...args)
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog('info')) {
        console.log(`[${prefix}]`, ...args)
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(`[${prefix}]`, ...args)
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(`[${prefix}]`, ...args)
      }
    },
  }
}

// 默认 logger
export const logger = createLogger('BrowserPublish')
