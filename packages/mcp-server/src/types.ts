/**
 * MCP Server 与 Extension 通讯的消息类型
 */

// 请求消息
export interface RequestMessage {
  id: string
  method: string
  token?: string  // 安全验证 token
  params?: Record<string, unknown>
}

// 响应消息
export interface ResponseMessage {
  id: string
  result?: unknown
  error?: {
    code: number
    message: string
  }
}

// 平台信息
export interface PlatformInfo {
  id: string
  name: string
  icon: string
  homepage: string
  isAuthenticated: boolean
  username?: string
  avatar?: string
  error?: string
}

// 文章数据
export interface Article {
  title: string
  content: string  // HTML content
  markdown?: string
  cover?: string
  tags?: string[]
  category?: string
}

// 同步结果
export interface SyncResult {
  platform: string
  success: boolean
  postId?: string
  postUrl?: string
  draftOnly?: boolean
  error?: string
  timestamp: number
}

// Extension 支持的方法
export type ExtensionMethod =
  | 'listPlatforms'
  | 'checkAuth'
  | 'syncArticle'
  | 'extractArticle'
