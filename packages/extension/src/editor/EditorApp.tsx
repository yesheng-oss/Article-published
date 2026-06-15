import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SyncDialog } from '@/components/sync-dialog'
import type { Platform, SyncResult, PlatformProgress } from '@/components/sync-dialog/types'
import { createLogger } from '../lib/logger'

const logger = createLogger('Editor')

interface Article {
  title: string
  content: string
  cover?: string
  url?: string
  extractor?: string
}

type SyncStatus = 'idle' | 'syncing' | 'completed'

const SELECTED_PLATFORMS_KEY = 'selectedPlatforms'

function saveSelectedPlatforms(platformIds: string[]) {
  chrome.storage.local.set({ [SELECTED_PLATFORMS_KEY]: platformIds }).catch((e) => {
    logger.error('Failed to save selected platforms:', e)
  })
}

export function EditorApp() {
  const [article, setArticle] = useState<Article | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [results, setResults] = useState<SyncResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)
  const [platformProgress, setPlatformProgress] = useState<Map<string, PlatformProgress>>(new Map())
  const [currentSyncId, setCurrentSyncId] = useState<string | null>(null)
  const currentSyncIdRef = useRef<string | null>(null)
  const [showSyncDialog, setShowSyncDialog] = useState(false)

  useEffect(() => {
    currentSyncIdRef.current = currentSyncId
  }, [currentSyncId])

  const titleRef = useRef<HTMLHeadingElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Receive messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        if (data.syncId) {
          if (!currentSyncIdRef.current) {
            setCurrentSyncId(data.syncId)
          } else if (data.syncId !== currentSyncIdRef.current) {
            logger.debug('Ignoring message with different syncId:', data.syncId, 'current:', currentSyncIdRef.current)
            return
          }
        }

        logger.debug('Received message:', data)

        if (data.type === 'ARTICLE_DATA') {
          setArticle(data.article)
          if (contentRef.current && data.article.content) {
            contentRef.current.innerHTML = data.article.content
          }
        } else if (data.type === 'PLATFORMS_DATA') {
          setPlatforms(data.platforms)
          if (data.selectedPlatformIds && data.selectedPlatformIds.length > 0) {
            setSelectedPlatforms(data.selectedPlatformIds)
            saveSelectedPlatforms(data.selectedPlatformIds)
          } else {
            chrome.storage.local.get(SELECTED_PLATFORMS_KEY).then((result) => {
              const storedPlatforms = result[SELECTED_PLATFORMS_KEY] as string[] | undefined
              const authenticated = data.platforms.filter((p: Platform) => p.isAuthenticated)
              const authenticatedIds = authenticated.map((p: Platform) => p.id)
              const authenticatedSet = new Set(authenticatedIds)

              const selected = storedPlatforms
                ? storedPlatforms.filter(id => authenticatedSet.has(id))
                : []
              setSelectedPlatforms(selected)
            }).catch((e) => {
              logger.error('Failed to load selected platforms:', e)
              setSelectedPlatforms([])
            })
          }
        } else if (data.type === 'SYNC_PROGRESS') {
          if (data.result) {
            setResults(prev => {
              const next = [...prev, data.result]
              // Auto-transition to completed when all platforms are done
              // (handles case where editor stays open throughout sync)
              return next
            })
          }
        } else if (data.type === 'SYNC_DETAIL_PROGRESS') {
          const progress = data.progress
          if (progress?.platform) {
            setPlatformProgress(prev => {
              const next = new Map(prev)
              next.set(progress.platform, progress)
              return next
            })
          }
        } else if (data.type === 'SYNC_COMPLETE') {
          setStatus('completed')
          if (data.rateLimitWarning) {
            setRateLimitWarning(data.rateLimitWarning)
            setTimeout(() => setRateLimitWarning(null), 8000)
          }
        } else if (data.type === 'SYNC_ERROR') {
          setError(data.error)
          setStatus('idle')
        }
      } catch (e) {
        logger.error('Failed to parse message:', e)
      }
    }

    window.addEventListener('message', handleMessage)
    window.parent.postMessage(JSON.stringify({ type: 'EDITOR_READY' }), '*')
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Auto-detect completion from results
  useEffect(() => {
    if (status === 'syncing' && results.length > 0 && results.length >= selectedPlatforms.length) {
      setStatus('completed')
    }
  }, [results.length, selectedPlatforms.length, status])

  const handleClose = useCallback(() => {
    window.parent.postMessage(JSON.stringify({ type: 'CLOSE_EDITOR' }), '*')
  }, [])

  // Get edited article content
  const getEditedArticle = useCallback(() => {
    if (!article) return null
    return {
      ...article,
      title: titleRef.current?.innerText || article.title,
      content: contentRef.current?.innerHTML || article.content,
    }
  }, [article])

  // ── SyncDialog action handlers ──

  const handleTogglePlatform = (id: string) => {
    setSelectedPlatforms(prev => {
      const set = new Set(prev)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      const next = Array.from(set)
      saveSelectedPlatforms(next)
      return next
    })
  }

  const handleSelectAll = () => {
    const allIds = platforms.filter(p => p.isAuthenticated).map(p => p.id)
    setSelectedPlatforms(allIds)
    saveSelectedPlatforms(allIds)
  }

  const handleDeselectAll = () => {
    setSelectedPlatforms([])
    saveSelectedPlatforms([])
  }

  const handleStartSync = () => {
    const editedArticle = getEditedArticle()
    if (!editedArticle || selectedPlatforms.length === 0) return

    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setCurrentSyncId(syncId)
    setStatus('syncing')
    setResults([])
    setError(null)
    setPlatformProgress(new Map())

    window.parent.postMessage(JSON.stringify({
      type: 'START_SYNC',
      article: editedArticle,
      platforms: selectedPlatforms,
      syncId,
    }), '*')
  }

  const handleRetryFailed = () => {
    const failedPlatforms = results.filter(r => !r.success).map(r => r.platform)
    if (failedPlatforms.length === 0) return

    const editedArticle = getEditedArticle()
    if (!editedArticle) return

    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setCurrentSyncId(syncId)
    setStatus('syncing')
    setResults(prev => prev.filter(r => r.success))
    setPlatformProgress(new Map())

    window.parent.postMessage(JSON.stringify({
      type: 'START_SYNC',
      article: editedArticle,
      platforms: failedPlatforms,
      syncId,
    }), '*')
  }

  const handleReset = () => {
    setStatus('idle')
    setResults([])
    setError(null)
    setPlatformProgress(new Map())
    setCurrentSyncId(null)
    setShowSyncDialog(false)
  }

  if (!article) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-500">加载文章中...</p>
        </div>
      </div>
    )
  }

  const authenticatedCount = platforms.filter(p => p.isAuthenticated).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={chrome.runtime.getURL('assets/icon-48.png')} alt="Logo" className="w-6 h-6" />
            <span className="font-medium text-gray-700">同步助手 - 点击内容可直接修改</span>
            {article?.extractor && (
              <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-500 rounded opacity-0 hover:opacity-100 transition-opacity" title="Content extractor used">
                {article.extractor}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSyncDialog(true)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                authenticatedCount > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
              disabled={authenticatedCount === 0}
            >
              同步{selectedPlatforms.length > 0 ? ` (${selectedPlatforms.length})` : ''}
            </button>

            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="关闭"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Rate limit warning */}
      {rateLimitWarning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg flex items-center gap-2 max-w-md">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <p className="text-sm text-yellow-800 flex-1">{rateLimitWarning}</p>
            <button
              onClick={() => setRateLimitWarning(null)}
              className="text-yellow-600 hover:text-yellow-800 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Article content area */}
      <main className="pt-16 pb-16">
        <article className="w-full max-w-4xl mx-auto bg-white shadow-sm px-12 py-10" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          {article.cover && (
            <img
              src={article.cover}
              alt=""
              className="w-full max-h-80 object-cover mb-8"
            />
          )}

          <h1
            ref={titleRef}
            contentEditable
            suppressContentEditableWarning
            className="text-3xl font-bold text-gray-900 mb-8 outline-none border border-transparent hover:border-gray-200 focus:border-blue-300 focus:bg-blue-50 rounded px-2 -mx-2 leading-tight transition-colors"
          >
            {article.title}
          </h1>

          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none border border-transparent hover:border-gray-200 focus:border-blue-300 focus:bg-blue-50/50 rounded transition-colors article-content"
            style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          <style>{`
            .article-content p { margin-bottom: 1em; }
            .article-content h1 { font-size: 2em; font-weight: bold; margin: 1em 0 0.5em; }
            .article-content h2 { font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em; }
            .article-content h3 { font-size: 1.25em; font-weight: 600; margin: 0.8em 0 0.4em; }
            .article-content img { max-width: 100%; height: auto; margin: 1em 0; display: block; }
            .article-content pre { background: #f5f5f5; padding: 1em; border-radius: 6px; overflow-x: auto; margin: 1em 0; font-size: 14px; }
            .article-content code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
            .article-content pre code { background: none; padding: 0; }
            .article-content blockquote { border-left: 4px solid #ddd; padding-left: 1em; margin: 1em 0; color: #666; font-style: italic; }
            .article-content ul { list-style: disc; padding-left: 2em; margin: 1em 0; }
            .article-content ol { list-style: decimal; padding-left: 2em; margin: 1em 0; }
            .article-content li { margin-bottom: 0.5em; }
            .article-content a { color: #2563eb; text-decoration: underline; }
            .article-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            .article-content th, .article-content td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            .article-content th { background: #f5f5f5; font-weight: 600; }
            .article-content hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
            .article-content strong { font-weight: 600; }
            .article-content em { font-style: italic; }
          `}</style>
        </article>
      </main>

      {/* Sync Dialog overlay */}
      {showSyncDialog && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              if (status === 'idle') setShowSyncDialog(false)
            }}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-2xl w-[400px] max-h-[520px] overflow-hidden">
            {/* Dialog header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-gray-900">文章同步</span>
              <button
                onClick={() => {
                  if (status !== 'syncing') {
                    handleReset()
                  }
                }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <SyncDialog
              article={article}
              platforms={platforms}
              status={status === 'idle' ? 'idle' : status === 'syncing' ? 'syncing' : 'completed'}
              selectedPlatforms={selectedPlatforms}
              results={results}
              platformProgress={platformProgress}
              error={error}
              onTogglePlatform={handleTogglePlatform}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onStartSync={handleStartSync}
              onRetryFailed={handleRetryFailed}
              onReset={handleReset}
              onCancel={handleReset}
              className="max-h-[460px]"
            />
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && !showSyncDialog && (
        <div className="fixed bottom-4 left-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm z-50">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-500 hover:underline text-sm"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  )
}
