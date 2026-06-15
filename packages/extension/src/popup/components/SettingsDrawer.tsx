import { useEffect, useRef, useState } from 'react'
import { Copy, Plug, PlugZap, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

interface McpStatus {
  enabled: boolean
  connected: boolean
  token?: string
  serverUrl?: string
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const [mcpStatus, setMcpStatus] = useState<McpStatus>({ enabled: false, connected: false })
  const [serverUrlInput, setServerUrlInput] = useState('')
  const [floatingButtonEnabled, setFloatingButtonEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    refreshStatus()
    chrome.storage.local.get('floatingButtonEnabled', result => {
      setFloatingButtonEnabled(result.floatingButtonEnabled ?? false)
    })
  }, [open])

  useEffect(() => {
    if (!open || !mcpStatus.enabled) return
    chrome.runtime.sendMessage({ type: 'MCP_WATCH_START' })
    const interval = setInterval(refreshStatus, 3000)
    return () => {
      clearInterval(interval)
      chrome.runtime.sendMessage({ type: 'MCP_WATCH_STOP' })
    }
  }, [open, mcpStatus.enabled])

  const refreshStatus = () => {
    chrome.runtime.sendMessage({ type: 'MCP_STATUS' }, response => {
      if (!response || response.error) return
      setMcpStatus({
        enabled: response.enabled ?? false,
        connected: response.connected ?? false,
        token: response.token,
        serverUrl: response.serverUrl,
      })
      setServerUrlInput(response.serverUrl || '')
    })
  }

  const toggleMcp = () => {
    const type = mcpStatus.enabled ? 'MCP_DISABLE' : 'MCP_ENABLE'
    chrome.runtime.sendMessage({ type }, response => {
      if (!response?.success) return
      setMcpStatus(prev => ({
        ...prev,
        enabled: !prev.enabled,
        connected: false,
        token: response.token || prev.token,
      }))
    })
  }

  const handleServerUrlChange = (value: string) => {
    setServerUrlInput(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const url = value.trim()
      chrome.runtime.sendMessage({ type: 'MCP_SET_SERVER_URL', payload: { url } })
      setMcpStatus(prev => ({ ...prev, serverUrl: url }))
    }, 500)
  }

  const copyToken = async () => {
    if (!mcpStatus.token) return
    await navigator.clipboard.writeText(mcpStatus.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const toggleFloatingButton = () => {
    const next = !floatingButtonEnabled
    setFloatingButtonEnabled(next)
    chrome.storage.local.set({ floatingButtonEnabled: next })
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-80 overflow-y-auto bg-[#0b1511] text-stone-50 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0b1511]/95 p-4 backdrop-blur">
          <div>
            <h2 className="font-semibold">Publish Bridge</h2>
            <p className="text-xs text-stone-400">Local MCP connection settings</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-1.5 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-4">
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'grid h-11 w-11 place-items-center rounded-2xl',
                  mcpStatus.connected ? 'bg-emerald-400 text-emerald-950' : 'bg-stone-700 text-stone-300'
                )}>
                  {mcpStatus.connected ? <PlugZap className="h-5 w-5" /> : <Plug className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">MCP Bridge</p>
                  <p className="text-xs text-stone-400">
                    {mcpStatus.enabled
                      ? mcpStatus.connected
                        ? 'Connected to local server'
                        : 'Enabled, waiting for server'
                      : 'Disabled'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleMcp}
                className={cn(
                  'relative h-7 w-12 rounded-full transition-colors',
                  mcpStatus.enabled ? 'bg-emerald-400' : 'bg-stone-600'
                )}
              >
                <span className={cn(
                  'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform',
                  mcpStatus.enabled ? 'translate-x-6' : 'translate-x-1'
                )} />
              </button>
            </div>
          </section>

          <section className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Server URL</label>
            <input
              value={serverUrlInput}
              onChange={event => handleServerUrlChange(event.target.value)}
              placeholder="ws://localhost:9527"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs outline-none ring-emerald-400/40 focus:ring-2"
            />
            <p className="text-xs text-stone-400">Leave empty to use the default local bridge.</p>
          </section>

          <section className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Token</p>
              <button
                onClick={copyToken}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
              >
                <Copy className="h-3 w-3" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <code className="block break-all rounded-2xl bg-black/30 p-3 text-xs text-stone-200">
              {mcpStatus.token || 'Enable MCP to generate a token'}
            </code>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Floating Web Button</p>
                <p className="text-xs text-stone-400">Show a quick publish button on article pages.</p>
              </div>
              <button
                onClick={toggleFloatingButton}
                className={cn(
                  'relative h-7 w-12 rounded-full transition-colors',
                  floatingButtonEnabled ? 'bg-amber-300' : 'bg-stone-600'
                )}
              >
                <span className={cn(
                  'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform',
                  floatingButtonEnabled ? 'translate-x-6' : 'translate-x-1'
                )} />
              </button>
            </div>
          </section>
        </div>
      </aside>
    </>
  )
}
