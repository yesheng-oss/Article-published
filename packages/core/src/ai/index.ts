/**
 * AI 处理器接口
 * 后续实现真正的 AI 处理器时需实现此接口
 */
export interface AIProcessor {
  /**
   * 优化文章标题
   * @param title 原标题
   * @param platform 目标平台
   * @returns 优化后的标题选项
   */
  optimizeTitle(title: string, platform: string): Promise<string[]>

  /**
   * 生成文章摘要
   * @param content 文章内容 (HTML)
   * @param maxLength 最大长度
   */
  generateSummary(content: string, maxLength?: number): Promise<string>

  /**
   * 推荐标签
   * @param content 文章内容
   * @param platform 目标平台
   */
  suggestTags(content: string, platform: string): Promise<string[]>

  /**
   * 跨平台内容适配
   * @param content 原内容
   * @param sourcePlatform 来源平台
   * @param targetPlatform 目标平台
   */
  adaptContent(
    content: string,
    sourcePlatform: string,
    targetPlatform: string
  ): Promise<string>
}

/**
 * 空实现 AI 处理器
 * 直接返回原值，不做任何处理
 */
export class NoopAIProcessor implements AIProcessor {
  async optimizeTitle(title: string): Promise<string[]> {
    return [title]
  }

  async generateSummary(content: string, maxLength = 200): Promise<string> {
    // 简单截取纯文本
    const text = content.replace(/<[^>]+>/g, '').trim()
    if (text.length <= maxLength) {
      return text
    }
    return text.slice(0, maxLength - 3) + '...'
  }

  async suggestTags(): Promise<string[]> {
    return []
  }

  async adaptContent(content: string): Promise<string> {
    return content
  }
}

/**
 * AI 处理器工厂
 */
export type AIProcessorFactory = () => AIProcessor

/**
 * 默认 AI 处理器实例
 */
export const defaultAIProcessor = new NoopAIProcessor()

/**
 * AI 处理器配置
 * 后续可扩展支持不同的 AI Provider
 */
export interface AIConfig {
  provider?: 'openai' | 'claude' | 'local' | 'none'
  apiKey?: string
  baseUrl?: string
  model?: string
}

/**
 * 创建 AI 处理器
 * 当前仅返回 NoopAIProcessor，后续可扩展
 */
export function createAIProcessor(_config?: AIConfig): AIProcessor {
  // TODO: 后续根据 config.provider 创建对应的处理器
  // if (config?.provider === 'openai') {
  //   return new OpenAIProcessor(config)
  // }
  // if (config?.provider === 'claude') {
  //   return new ClaudeProcessor(config)
  // }

  return new NoopAIProcessor()
}
