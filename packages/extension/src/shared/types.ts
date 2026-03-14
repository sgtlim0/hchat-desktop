export type ExtPage = 'chat' | 'history' | 'settings' | 'promptLibrary' | 'pageContext'

export interface PageContext {
  readonly url: string
  readonly title: string
  readonly text: string
  readonly selectedText?: string
}

export interface ExtStreamRequest {
  readonly type: 'stream-start'
  readonly modelId: string
  readonly messages: ReadonlyArray<{ readonly role: 'user' | 'assistant'; readonly content: string }>
  readonly system?: string
  readonly sessionId: string
}

export interface ExtStreamChunk {
  readonly type: 'stream-chunk'
  readonly text: string
  readonly sessionId: string
}

export interface ExtStreamEnd {
  readonly type: 'stream-end'
  readonly sessionId: string
  readonly usage?: { readonly inputTokens: number; readonly outputTokens: number }
}

export interface ExtStreamError {
  readonly type: 'stream-error'
  readonly error: string
  readonly sessionId: string
}

export type ExtStreamMessage = ExtStreamRequest | ExtStreamChunk | ExtStreamEnd | ExtStreamError
