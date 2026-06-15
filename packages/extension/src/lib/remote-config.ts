export interface RemoteBanner {
  id: string
  title: string
  message: string
  description?: string
  icon?: string
  style?: 'info' | 'success' | 'warning' | 'error'
  dismissible?: boolean
  ctaText?: string
  ctaUrl?: string
  action?: {
    text: string
    url: string
  }
}

export async function fetchRemoteConfig(): Promise<void> {}
export async function fetchConfigIfNeeded(): Promise<void> {}
export async function getActiveBanner(): Promise<RemoteBanner | null> {
  return null
}
export async function dismissBanner(_id: string): Promise<void> {}
