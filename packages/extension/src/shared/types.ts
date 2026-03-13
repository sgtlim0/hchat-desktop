export interface Credentials {
  readonly accessKeyId: string
  readonly secretAccessKey: string
  readonly region: string
}

export type AnalysisMode = 'summary' | 'translate' | 'code' | 'draft'

export interface AnalysisRequest {
  readonly mode: AnalysisMode
  readonly content: string
  readonly model: string
  readonly credentials: Credentials
  readonly language?: string
  readonly customPrompt?: string
}

export interface AnalysisResult {
  readonly id: string
  readonly mode: AnalysisMode
  readonly fileName: string
  readonly fileType: string
  readonly resultText: string
  readonly model?: string
  readonly timestamp: number
  readonly tokenUsage?: {
    readonly input: number
    readonly output: number
  }
}

export type MessageType =
  | 'ANALYZE'
  | 'ANALYZE_STREAM'
  | 'TEST_CONNECTION'
  | 'EXTRACT_TEXT'
  | 'ANALYSIS_CHUNK'
  | 'ANALYSIS_DONE'
  | 'ANALYSIS_ERROR'

export interface ExtMessage {
  readonly type: MessageType
  readonly payload?: unknown
}

export type FileType = 'pdf' | 'text' | 'code'

export interface FileInfo {
  readonly name: string
  readonly size: number
  readonly type: string
  readonly content: string
  readonly extension: string
  readonly fileName?: string
  readonly fileType?: FileType
  readonly charCount?: number
  readonly truncated?: boolean
}

export interface Settings {
  readonly model: string
  readonly language: string
  readonly darkMode: boolean
}

export interface HistoryEntry {
  readonly id: string
  readonly mode: AnalysisMode
  readonly title: string
  readonly content: string
  readonly result: string
  readonly model: string
  readonly timestamp: number
}
