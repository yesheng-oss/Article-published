/**
 * 错误消息处理工具
 *
 * 将技术错误转换为用户友好的提示信息，并提供可行的解决建议
 */

/**
 * 错误类型
 */
export type ErrorType =
  | 'auth'           // 登录/认证问题
  | 'network'        // 网络连接问题
  | 'rate_limit'     // 频率限制
  | 'permission'     // 权限不足
  | 'content'        // 内容问题
  | 'platform'       // 平台限制/维护
  | 'config'         // 配置问题
  | 'unknown'        // 未知错误

/**
 * 用户友好的错误信息
 */
export interface FriendlyError {
  type: ErrorType
  message: string      // 主要错误信息
  suggestion?: string  // 建议操作
  isRetryable: boolean // 是否可重试
}

/**
 * HTTP 状态码 → 用户友好消息
 */
const HTTP_STATUS_MESSAGES: Record<number, FriendlyError> = {
  400: {
    type: 'content',
    message: '请求内容有误',
    suggestion: '请检查文章格式是否正确',
    isRetryable: false,
  },
  401: {
    type: 'auth',
    message: '登录已过期',
    suggestion: '请在浏览器中重新登录该平台',
    isRetryable: false,
  },
  403: {
    type: 'permission',
    message: '没有发布权限',
    suggestion: '请检查账号是否有发布权限，或尝试重新登录',
    isRetryable: false,
  },
  404: {
    type: 'config',
    message: '接口不存在',
    suggestion: '平台可能已更新，请检查插件是否需要更新',
    isRetryable: false,
  },
  429: {
    type: 'rate_limit',
    message: '发布太频繁',
    suggestion: '请稍后再试（建议间隔 5 分钟）',
    isRetryable: true,
  },
  500: {
    type: 'platform',
    message: '平台服务器错误',
    suggestion: '平台可能正在维护，请稍后再试',
    isRetryable: true,
  },
  502: {
    type: 'platform',
    message: '平台服务暂时不可用',
    suggestion: '请稍后再试',
    isRetryable: true,
  },
  503: {
    type: 'platform',
    message: '平台正在维护',
    suggestion: '请稍后再试',
    isRetryable: true,
  },
  504: {
    type: 'network',
    message: '请求超时',
    suggestion: '网络较慢，请稍后重试',
    isRetryable: true,
  },
}

/**
 * 常见错误关键词 → 用户友好消息
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp
  error: FriendlyError
}> = [
  // 登录/认证相关
  {
    pattern: /未登录|not\s*log(ged)?\s*in|login\s*required|unauthorized|need.*login|请先登录/i,
    error: {
      type: 'auth',
      message: '未登录或登录已过期',
      suggestion: '请在浏览器中登录该平台后再试',
      isRetryable: false,
    },
  },
  {
    pattern: /token.*expired?|session.*expired?|cookie.*expired?|认证.*过期/i,
    error: {
      type: 'auth',
      message: '登录状态已过期',
      suggestion: '请重新登录该平台',
      isRetryable: false,
    },
  },
  // 网络相关
  {
    pattern: /network\s*error|fetch\s*failed|connection\s*refused|ECONNREFUSED|ERR_NETWORK|网络.*错误/i,
    error: {
      type: 'network',
      message: '网络连接失败',
      suggestion: '请检查网络连接后重试',
      isRetryable: true,
    },
  },
  {
    pattern: /timeout|timed?\s*out|ETIMEDOUT|超时/i,
    error: {
      type: 'network',
      message: '请求超时',
      suggestion: '网络较慢，请稍后重试',
      isRetryable: true,
    },
  },
  // 频率限制
  {
    pattern: /rate\s*limit|too\s*many\s*requests|频繁|频率.*限制/i,
    error: {
      type: 'rate_limit',
      message: '操作太频繁',
      suggestion: '请等待几分钟后再试',
      isRetryable: true,
    },
  },
  // 内容相关
  {
    pattern: /sensitive|违规|敏感|审核|content.*blocked|forbidden.*word/i,
    error: {
      type: 'content',
      message: '内容可能包含敏感词',
      suggestion: '请检查文章内容是否符合平台规范',
      isRetryable: false,
    },
  },
  {
    pattern: /title.*empty|标题.*空|missing.*title/i,
    error: {
      type: 'content',
      message: '文章标题不能为空',
      suggestion: '请添加文章标题',
      isRetryable: false,
    },
  },
  {
    pattern: /content.*empty|内容.*空|no.*content/i,
    error: {
      type: 'content',
      message: '文章内容为空',
      suggestion: '请确保文章有正文内容',
      isRetryable: false,
    },
  },
  {
    pattern: /too\s*long|超过.*限制|exceed.*limit|content.*too.*large/i,
    error: {
      type: 'content',
      message: '内容超过长度限制',
      suggestion: '请精简文章内容或分多篇发布',
      isRetryable: false,
    },
  },
  // 平台相关
  {
    pattern: /maintain|维护|upgrade|升级中|temporarily.*unavailable/i,
    error: {
      type: 'platform',
      message: '平台正在维护',
      suggestion: '请稍后再试',
      isRetryable: true,
    },
  },
  {
    pattern: /account.*frozen|账号.*冻结|账号.*异常|account.*abnormal/i,
    error: {
      type: 'platform',
      message: '账号状态异常',
      suggestion: '请登录平台检查账号状态',
      isRetryable: false,
    },
  },
  // 权限相关
  {
    pattern: /no.*permission|permission.*denied|权限.*不足|没有.*权限/i,
    error: {
      type: 'permission',
      message: '没有操作权限',
      suggestion: '请确认账号有发布权限',
      isRetryable: false,
    },
  },
  // CMS 相关
  {
    pattern: /xml.*rpc|xmlrpc.*disabled/i,
    error: {
      type: 'config',
      message: 'XML-RPC 接口未启用',
      suggestion: '请在 WordPress 后台启用 XML-RPC',
      isRetryable: false,
    },
  },
  {
    pattern: /密码.*错误|password.*incorrect|authentication.*failed/i,
    error: {
      type: 'auth',
      message: '用户名或密码错误',
      suggestion: '请检查 CMS 账户配置',
      isRetryable: false,
    },
  },
]

/**
 * 解析 HTTP 状态码错误
 */
function parseHttpStatus(errorMessage: string): FriendlyError | null {
  // 匹配 "HTTP 401" 或 "status: 500" 等格式
  const httpMatch = errorMessage.match(/(?:HTTP|status)[:\s]*(\d{3})/i)
  if (httpMatch) {
    const statusCode = parseInt(httpMatch[1], 10)
    if (HTTP_STATUS_MESSAGES[statusCode]) {
      return HTTP_STATUS_MESSAGES[statusCode]
    }
    // 对于未知的 HTTP 状态码
    if (statusCode >= 500) {
      return {
        type: 'platform',
        message: `平台错误 (${statusCode})`,
        suggestion: '请稍后重试',
        isRetryable: true,
      }
    }
    if (statusCode >= 400) {
      return {
        type: 'unknown',
        message: `请求失败 (${statusCode})`,
        suggestion: '请稍后重试或联系支持',
        isRetryable: false,
      }
    }
  }
  return null
}

/**
 * 将原始错误消息转换为用户友好的错误信息
 */
export function toFriendlyError(error: string | Error | unknown): FriendlyError {
  const errorMessage = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : String(error)

  // 1. 先尝试解析 HTTP 状态码
  const httpError = parseHttpStatus(errorMessage)
  if (httpError) {
    return httpError
  }

  // 2. 匹配常见错误模式
  for (const { pattern, error } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return error
    }
  }

  // 3. 处理空错误
  if (!errorMessage || errorMessage.trim() === '') {
    return {
      type: 'unknown',
      message: '发生未知错误',
      suggestion: '请稍后重试',
      isRetryable: true,
    }
  }

  // 4. 如果错误信息本身就是中文且较短，直接使用
  if (/^[\u4e00-\u9fa5\s，。！？、：]+$/.test(errorMessage) && errorMessage.length < 30) {
    return {
      type: 'unknown',
      message: errorMessage,
      suggestion: '请稍后重试',
      isRetryable: true,
    }
  }

  // 5. 默认返回简化的错误信息
  return {
    type: 'unknown',
    message: '同步失败',
    suggestion: '请稍后重试，如持续失败请反馈',
    isRetryable: true,
  }
}

/**
 * 格式化错误显示文本
 * @param error 原始错误
 * @param showSuggestion 是否显示建议
 */
export function formatErrorMessage(error: string | Error | unknown, showSuggestion = true): string {
  const friendly = toFriendlyError(error)
  if (showSuggestion && friendly.suggestion) {
    return `${friendly.message}，${friendly.suggestion}`
  }
  return friendly.message
}

/**
 * 获取平台特定的错误消息增强
 */
export function getPlatformErrorHint(platformName: string, error: string): string | null {
  const errorLower = error.toLowerCase()

  // 平台特定的登录检查提示
  const loginHints: Record<string, string> = {
    '知乎': '请确保在 zhihu.com 已登录',
    '掘金': '请确保在 juejin.cn 已登录',
    'CSDN': '请确保在 csdn.net 已登录',
    '今日头条': '请确保在 toutiao.com 已登录（需开通头条号）',
    '百家号': '请确保在 baijiahao.baidu.com 已登录',
    'B站': '请确保在 bilibili.com 已登录（需开通专栏）',
    '微博': '请确保在 weibo.com 已登录',
    '雪球': '请确保在 xueqiu.com 已登录',
  }

  // 如果是登录相关错误，返回特定提示
  if (/未登录|401|unauthorized|not.*login|登录.*过期/i.test(errorLower)) {
    return loginHints[platformName] || `请确保已登录${platformName}`
  }

  return null
}

/**
 * 错误是否可重试
 */
export function isRetryableError(error: string | Error | unknown): boolean {
  return toFriendlyError(error).isRetryable
}
