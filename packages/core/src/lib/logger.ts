/**
 * 通用日志接口 - 不依赖浏览器 API
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export interface LoggerConfig {
  enabled: boolean
  level: LogLevel
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// 检测生产环境 (支持 Vite 和 Node.js)
const isProd = typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD
  || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production')

// 默认配置：生产环境只输出 warn 和 error
let globalConfig: LoggerConfig = {
  enabled: true,
  level: isProd ? 'warn' : 'debug',
}

/**
 * 设置全局日志配置
 */
export function setLoggerConfig(config: Partial<LoggerConfig>) {
  globalConfig = { ...globalConfig, ...config }
}

/**
 * 获取当前配置
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...globalConfig }
}

/**
 * 创建带前缀的 logger
 */
export function createLogger(prefix: string): Logger {
  const shouldLog = (level: LogLevel): boolean => {
    if (!globalConfig.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[globalConfig.level]
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
