import { ArrowLeft, Github, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AboutPage() {
  const navigate = useNavigate()
  const version = chrome.runtime.getManifest().version

  return (
    <div className="flex h-[500px] flex-col bg-[#08130f] text-stone-50">
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-semibold">关于</h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#35d69b] text-2xl font-black text-[#06251c] shadow-lg shadow-emerald-950/40">
          叶
        </div>
        <h2 className="mt-4 text-xl font-semibold">小叶发布器</h2>
        <p className="mt-1 text-sm text-stone-400">v{version}</p>
        <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-stone-300">
          面向个人使用的浏览器发布助手，连接 MCP 与浏览器登录态，
          默认把生成内容保存为草稿，最终发布始终由你确认。
        </p>

        <div className="mt-6 grid w-full max-w-[260px] gap-2 text-left">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            草稿优先的安全发布流程
          </div>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm transition hover:bg-white/10"
          >
            <Github className="h-4 w-4" />
            个人项目源码
          </a>
        </div>
      </main>
    </div>
  )
}
