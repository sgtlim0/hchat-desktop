export interface AppConfig {
  apiBaseUrl: string
  isExtension: boolean
}

let config: AppConfig = { apiBaseUrl: '', isExtension: false }

export function setConfig(c: AppConfig): void { config = c }
export function getConfig(): AppConfig { return config }
