import { Check, FileText, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Article } from './types'

interface ArticleCardProps {
  article: Article | null
  onEdit?: () => void
  compact?: boolean
}

export function ArticleCard({ article, onEdit, compact }: ArticleCardProps) {
  if (!article) {
    return (
      <div className="rounded-lg p-3 bg-muted/50">
        <div className="py-3 space-y-2">
          <div className="flex items-center justify-center text-muted-foreground">
            <FileText className="w-5 h-5 mr-2" />
            <span className="text-sm">当前页面未检测到文章</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            请在文章页面使用
          </p>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="rounded-lg p-3 bg-muted/40 border">
        <div className="flex gap-3">
          {article.cover && (
            <img
              src={article.cover}
              alt=""
              className="w-14 h-14 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-sm line-clamp-2">{article.title}</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
      <div className="flex items-center gap-1.5 mb-2">
        <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
        <span className="text-xs font-medium text-green-700 dark:text-green-400">
          已识别文章，选择平台后同步
        </span>
      </div>
      <div className="flex gap-3">
        {article.cover && (
          <img
            src={article.cover}
            alt=""
            className="w-16 h-16 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-sm line-clamp-2">{article.title}</h2>
          {article.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {article.summary}
            </p>
          )}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors self-start"
            title="同步前预览和调整内容"
          >
            <Pencil className="w-3 h-3" />
            <span>调整</span>
          </button>
        )}
      </div>
    </div>
  )
}
