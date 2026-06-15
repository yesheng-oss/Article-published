import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { SyncDialog } from '@/components/sync-dialog'
import type { Platform, Article, SyncResult, PlatformProgress, DialogStatus } from '@/components/sync-dialog/types'

const SELECTED_PLATFORMS_KEY = 'selectedPlatforms'

function saveSelectedPlatforms(ids: string[]) {
  chrome.storage.local.set({ [SELECTED_PLATFORMS_KEY]: ids }).catch(() => {})
}

/**
 * Standalone sync dialog page, rendered inside an iframe.
 * Communicates with the parent content script via postMessage.
 */
export function SyncDialogPage() {
  const [article, setArticle] = useState<Article | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [status, setStatus] = useState<DialogStatus>('loading')
  const [results, setResults] = useState<SyncResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [platformProgress, setPlatformProgress] = useState<Map<string, PlatformProgress>>(new Map())
  const [currentSyncId, setCurrentSyncId] = useState<string | null>(null)
  const syncIdRef = useRef<string | null>(null)

  useEffect(() => { syncIdRef.current = currentSyncId }, [currentSyncId])

  // Listen to messages from parent
  useEffect(() => {
    const handle = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        // Filter by syncId
        if (data.syncId && syncIdRef.current && data.syncId !== syncIdRef.current) return

        if (data.type === 'INIT_DATA') {
          setArticle(data.article || null)
          setPlatforms(data.platforms || [])
          if (data.selectedPlatformIds?.length) {
            setSelectedPlatforms(data.selectedPlatformIds)
          } else {
            // Load from storage — respect saved state, don't default to all
            chrome.storage.local.get(SELECTED_PLATFORMS_KEY).then(r => {
              const stored = r[SELECTED_PLATFORMS_KEY] as string[] | undefined
              const authedIds = (data.platforms || [])
                .filter((p: Platform) => p.isAuthenticated)
                .map((p: Platform) => p.id)
              const authedSet = new Set(authedIds)
              const selected = stored?.filter(id => authedSet.has(id)) || []
              setSelectedPlatforms(selected)
            }).catch(() => {
              setSelectedPlatforms([])
            })
          }
          setStatus('idle')
        } else if (data.type === 'SYNC_PROGRESS') {
          if (data.result) {
            setResults(prev => {
              const next = [...prev, data.result]
              return next
            })
          }
        } else if (data.type === 'SYNC_DETAIL_PROGRESS') {
          const p = data.progress
          if (p?.platform) {
            setPlatformProgress(prev => {
              const next = new Map(prev)
              next.set(p.platform, p)
              return next
            })
          }
        } else if (data.type === 'SYNC_COMPLETE') {
          setStatus('completed')
        } else if (data.type === 'SYNC_ERROR') {
          setError(data.error)
          setStatus('idle')
        }
      } catch {
        // ignore
      }
    }

    window.addEventListener('message', handle)
    // Notify parent we're ready
    window.parent.postMessage(JSON.stringify({ type: 'SYNC_DIALOG_READY' }), '*')
    return () => window.removeEventListener('message', handle)
  }, [])

  // Auto-detect completion
  useEffect(() => {
    if (status === 'syncing' && results.length > 0 && results.length >= selectedPlatforms.length) {
      setStatus('completed')
    }
  }, [results.length, selectedPlatforms.length, status])

  const postToParent = useCallback((msg: any) => {
    window.parent.postMessage(JSON.stringify(msg), '*')
  }, [])

  // ── SyncDialog handlers ──

  const handleToggle = (id: string) => {
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
    const ids = platforms.filter(p => p.isAuthenticated).map(p => p.id)
    setSelectedPlatforms(ids)
    saveSelectedPlatforms(ids)
  }

  const handleDeselectAll = () => {
    setSelectedPlatforms([])
    saveSelectedPlatforms([])
  }

  const handleStartSync = () => {
    if (!article || selectedPlatforms.length === 0) return
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setCurrentSyncId(syncId)
    setStatus('syncing')
    setResults([])
    setError(null)
    setPlatformProgress(new Map())

    postToParent({
      type: 'START_SYNC',
      article,
      platforms: selectedPlatforms,
      syncId,
    })
  }

  const handleRetryFailed = () => {
    const failed = results.filter(r => !r.success).map(r => r.platform)
    if (failed.length === 0 || !article) return
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setCurrentSyncId(syncId)
    setStatus('syncing')
    setResults(prev => prev.filter(r => r.success))
    setPlatformProgress(new Map())

    postToParent({
      type: 'START_SYNC',
      article,
      platforms: failed,
      syncId,
    })
  }

  const handleReset = () => {
    setStatus('idle')
    setResults([])
    setError(null)
    setPlatformProgress(new Map())
    setCurrentSyncId(null)
  }

  const handleClose = () => {
    postToParent({ type: 'CLOSE_SYNC_DIALOG' })
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl">
      {/* Dialog header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <span className="font-semibold text-gray-900">文章同步</span>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <SyncDialog
        article={article}
        platforms={platforms}
        status={status}
        selectedPlatforms={selectedPlatforms}
        results={results}
        platformProgress={platformProgress}
        error={error}
        onTogglePlatform={handleToggle}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onStartSync={handleStartSync}
        onRetryFailed={handleRetryFailed}
        onReset={handleReset}
        onCancel={handleReset}
        onClose={handleClose}
        className="flex-1 min-h-0"
      />
    </div>
  )
}
