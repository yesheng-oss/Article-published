import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Plus, Settings, ShieldCheck } from 'lucide-react'
import { SyncDialog } from '@/components/sync-dialog'
import type { Platform as DialogPlatform } from '@/components/sync-dialog'
import { createLogger } from '../../lib/logger'
import { useSyncStore } from '../stores/sync'
import { SettingsDrawer } from '../components/SettingsDrawer'

const logger = createLogger('Home')

export function HomeNew() {
  const navigate = useNavigate()
  const {
    status,
    article,
    selectedPlatforms,
    results,
    error,
    platformProgress,
    loadPlatforms,
    loadArticle,
    recoverSyncState,
    togglePlatform,
    selectAll,
    deselectAll,
    startSync,
    retryFailed,
    reset,
    checkRateLimit,
  } = useSyncStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [allPlatforms, setAllPlatforms] = useState<DialogPlatform[]>([])
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      await recoverSyncState()
      await loadAllPlatforms()
      await loadArticle()
    }
    init().catch(error => logger.error('Failed to initialize popup:', error))
  }, [])

  const loadAllPlatforms = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_ALL_AUTH',
        payload: { forceRefresh: false },
      })
      const mapped: DialogPlatform[] = (response.platforms || []).map((platform: any) => ({
        id: platform.id,
        name: platform.name,
        icon: platform.icon,
        isAuthenticated: platform.isAuthenticated,
        username: platform.username,
        homepage: platform.homepage,
      }))
      setAllPlatforms(mapped)
      await loadPlatforms()
    } catch (error) {
      logger.error('Failed to load platforms:', error)
    }
  }

  const handleEditArticle = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return
    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_EDITOR',
      platforms: allPlatforms,
      selectedPlatforms,
    })
    window.close()
  }

  const handleStartSync = async () => {
    const warning = await checkRateLimit()
    if (warning) {
      setRateLimitWarning(warning)
      setTimeout(() => setRateLimitWarning(null), 8000)
    }
    startSync()
  }

  const connectedCount = allPlatforms.filter(platform => platform.isAuthenticated).length

  return (
    <div className="flex h-[540px] flex-col overflow-hidden bg-[#08130f] text-stone-50">
      <header className="relative border-b border-white/10 px-4 py-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#24d18d33,transparent_45%),linear-gradient(135deg,#0b1d17,#17251d_55%,#2a1d0c)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#35d69b] text-base font-black text-[#06251c] shadow-lg shadow-emerald-900/40">
              叶
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">小叶发布器</h1>
              <p className="text-xs text-emerald-100/70">AI 草稿发布控制台</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-full border border-white/10 bg-white/10 p-2 text-emerald-100 transition hover:bg-white/20"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-stone-400">平台</p>
            <p className="mt-1 text-lg font-semibold">{connectedCount}/{allPlatforms.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-stone-400">文章</p>
            <p className="mt-1 truncate text-sm font-semibold">{article ? '已识别' : '等待中'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-stone-400">模式</p>
            <p className="mt-1 text-sm font-semibold">仅存草稿</p>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1712] px-4 py-2">
        <button
          onClick={() => navigate('/add-cms')}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-emerald-950"
        >
          <Plus className="h-3.5 w-3.5" />
          添加平台
        </button>
        <button
          onClick={() => navigate('/history')}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-stone-200"
        >
          <Clock className="h-3.5 w-3.5" />
          历史记录
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-200/80">
          <ShieldCheck className="h-3.5 w-3.5" />
          最终发布由你确认
        </span>
      </div>

      <SyncDialog
        article={article}
        platforms={allPlatforms}
        status={status}
        selectedPlatforms={selectedPlatforms}
        results={results}
        platformProgress={platformProgress}
        error={error}
        onTogglePlatform={togglePlatform}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onStartSync={handleStartSync}
        onRetryFailed={retryFailed}
        onReset={reset}
        onCancel={reset}
        onEditArticle={handleEditArticle}
        className="min-h-0 flex-1 bg-stone-50 text-stone-950"
      />

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {rateLimitWarning && (
        <div className="fixed left-3 right-3 top-3 z-50 rounded-2xl border border-amber-300/60 bg-amber-100 p-3 text-sm text-amber-950 shadow-xl">
          {rateLimitWarning}
        </div>
      )}
    </div>
  )
}
