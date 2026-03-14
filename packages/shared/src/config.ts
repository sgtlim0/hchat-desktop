export interface AppConfig {
  readonly apiBaseUrl: string
  readonly isDev: boolean
}

let _config: AppConfig = { apiBaseUrl: '', isDev: false }

export function initConfig(config: AppConfig): void {
  _config = { ...config }
}

export function getConfig(): AppConfig {
  return _config
}
