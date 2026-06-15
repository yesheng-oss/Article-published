type Details = Record<string, unknown>

export async function trackSyncStart(_source: string, _platforms: string[]): Promise<void> {}
export async function trackPlatformSync(_source: string, _platform: string, _success: boolean, _details?: Details): Promise<void> {}
export async function trackSyncComplete(_results: Details): Promise<void> {}
export async function trackArticleExtract(_source: string, _success: boolean, _details?: Details): Promise<void> {}
export async function trackInstall(_reason: string, _previousVersion?: string): Promise<void> {}
export async function trackCmsSync(_source: string, _type: string, _success: boolean): Promise<void> {}
export async function trackPageView(_pageName: string): Promise<void> {}
export async function trackFeatureUse(_feature: string, _details?: Details): Promise<void> {}
export async function trackAuthCheck(_platform: string, _isLoggedIn: boolean): Promise<void> {}
export async function trackImageUpload(_platform: string, _success: boolean, _details?: Details): Promise<void> {}
export async function trackRetry(_source: string, _platforms: string[], _attempt: number, _count: number): Promise<void> {}
export async function trackContentProfile(_profile: Details): Promise<void> {}
export async function trackPanelInteraction(_action: string, _details?: Details): Promise<void> {}
export async function trackPlatformSelection(_action: string, _platform: string, _count?: number): Promise<void> {}
export async function trackFirstSync(_source: string): Promise<void> {}
export async function trackDraftClick(_platform: string): Promise<void> {}
export async function trackCmsManagement(_action: string, _type: string, _success: boolean): Promise<void> {}
export async function trackMcpUsage(_action: string): Promise<void> {}
export async function trackPerformance(_metrics: Details): Promise<void> {}
export async function trackFunnel(_stage: string, _source: string, _details?: Details): Promise<void> {}
export async function trackPlatformHealth(_metrics: Details): Promise<void> {}
export async function trackMilestone(_name: string, _details?: Details): Promise<void> {}
export async function trackChurnSignal(_signal: string, _details?: Details): Promise<void> {}
export async function trackPlatformCombination(_platforms: string[]): Promise<void> {}
export async function trackUsageTime(): Promise<void> {}
export async function trackSyncFlow(_source: string, _platforms: string[]): Promise<void> {}
export async function trackFeatureDiscovery(_feature: string, _source: string): Promise<void> {}
export async function trackImplicitFeedback(_feedback: string, _details?: Details): Promise<void> {}
export async function trackHelpSeeking(_source: string): Promise<void> {}
export async function trackGrowthMetrics(): Promise<void> {}
export async function trackSessionDepth(_actionCount: number): Promise<void> {}
export async function trackPlatformExpansion(_platform: string, _total: number): Promise<void> {}
export async function updateCumulativeStats(_results?: unknown): Promise<void> {}
export async function recordInstallTimestamp(): Promise<void> {
  await chrome.storage.local.set({ installedAt: Date.now() })
}

export function inferErrorType(error?: string): string {
  if (!error) return 'unknown'
  if (/login|auth|登录/i.test(error)) return 'auth'
  if (/network|fetch|timeout/i.test(error)) return 'network'
  return 'platform'
}
