/**
 * 统一的悬浮同步按钮 (FAB)
 */

const PULSE_KEYFRAMES = `
  @keyframes wcs-pulse {
    0%, 100% { box-shadow: 0 4px 12px rgba(7,193,96,0.35); }
    50% { box-shadow: 0 4px 20px rgba(7,193,96,0.6), 0 0 0 8px rgba(7,193,96,0.1); }
  }
`

export interface FabOptions {
  onClick: () => void
  /** 按钮 bottom 偏移，默认 88px */
  bottom?: string
}

/**
 * 创建悬浮同步按钮，带 pulse 动画 + tooltip
 */
export function createSyncFab(options: FabOptions): HTMLElement {
  const { onClick, bottom = '88px' } = options

  const btn = document.createElement('div')
  btn.id = 'wechatsync-fab'
  btn.title = '同步文章'
  btn.style.cssText = `
    position: fixed !important;
    right: 24px !important;
    bottom: ${bottom} !important;
    height: 40px !important;
    padding: 0 16px !important;
    border-radius: 20px !important;
    background: linear-gradient(135deg, #07c160 0%, #06ad56 100%) !important;
    box-shadow: 0 4px 12px rgba(7, 193, 96, 0.35) !important;
    cursor: pointer !important;
    z-index: 2147483646 !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s !important;
    user-select: none !important;
    color: white !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    border: none !important;
  `
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
    </svg>
    <span style="color:white;font-size:14px;font-weight:500;">同步</span>
  `

  // pulse 动画样式
  const style = document.createElement('style')
  style.textContent = PULSE_KEYFRAMES
  document.head.appendChild(style)
  btn.style.animation = 'wcs-pulse 1.2s ease-in-out 3'

  // tooltip
  const tooltip = document.createElement('div')
  tooltip.textContent = '点击同步文章到多平台'
  tooltip.style.cssText = `
    position: absolute !important;
    right: 100% !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-right: 10px !important;
    padding: 6px 12px !important;
    background: rgba(0,0,0,0.75) !important;
    color: white !important;
    font-size: 12px !important;
    border-radius: 6px !important;
    white-space: nowrap !important;
    pointer-events: none !important;
    opacity: 0 !important;
    transition: opacity 0.2s !important;
  `
  btn.appendChild(tooltip)

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)'
    btn.style.boxShadow = '0 6px 20px rgba(7, 193, 96, 0.45)'
    tooltip.style.opacity = '1'
  })
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)'
    btn.style.boxShadow = '0 4px 12px rgba(7, 193, 96, 0.35)'
    tooltip.style.opacity = '0'
  })
  btn.addEventListener('click', onClick)

  return btn
}
