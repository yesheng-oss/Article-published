export interface UpdateInfo {
  version: string
  downloadUrl: string
  releaseNotes?: string
}

export interface UpdateCheckResult {
  hasUpdate: boolean
  info?: UpdateInfo
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  return { hasUpdate: false }
}

export async function getCachedUpdateInfo(): Promise<UpdateCheckResult | null> {
  return null
}

export async function dismissUpdate(_version: string): Promise<void> {}
export async function isUpdateDismissed(_version: string): Promise<boolean> {
  return true
}
