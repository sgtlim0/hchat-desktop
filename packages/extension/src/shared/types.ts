export type ExtPage = 'chat' | 'data' | 'research' | 'history' | 'settings' | 'promptLibrary' | 'pageContext'

export interface PageContext {
  readonly url: string
  readonly title: string
  readonly text: string
  readonly selectedText?: string
}

// --- Page Intelligence Engine types ---

export interface PageMetadata {
  readonly ogTitle?: string
  readonly ogDescription?: string
  readonly ogImage?: string
  readonly ogType?: string
  readonly author?: string
  readonly publishedDate?: string
  readonly language: string
  readonly canonicalUrl?: string
  readonly jsonLd?: ReadonlyArray<Record<string, unknown>>
}

export interface Section {
  readonly level: number
  readonly heading: string
  readonly content: string
  readonly children: ReadonlyArray<Section>
}

export interface TableData {
  readonly headers: ReadonlyArray<string>
  readonly rows: ReadonlyArray<ReadonlyArray<string>>
  readonly caption?: string
  readonly sourceIndex: number
}

export interface ListData {
  readonly type: 'ordered' | 'unordered'
  readonly items: ReadonlyArray<string>
  readonly sourceIndex: number
}

export interface LinkData {
  readonly href: string
  readonly text: string
  readonly isExternal: boolean
}

export interface ImageData {
  readonly src: string
  readonly alt: string
  readonly width?: number
  readonly height?: number
}

export interface PageIntelligence {
  readonly url: string
  readonly title: string
  readonly metadata: PageMetadata
  readonly sections: ReadonlyArray<Section>
  readonly tables: ReadonlyArray<TableData>
  readonly lists: ReadonlyArray<ListData>
  readonly links: ReadonlyArray<LinkData>
  readonly images: ReadonlyArray<ImageData>
  readonly readingTime: number
  readonly contentDensity: number
  readonly rawText: string
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
