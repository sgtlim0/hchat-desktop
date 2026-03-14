import type { PageContext } from './types'

export type BackgroundMessage =
  | { readonly type: 'EXTRACT_PAGE'; readonly tabId?: number }
  | { readonly type: 'OPEN_SIDEPANEL' }
  | { readonly type: 'NEW_CHAT' }
  | { readonly type: 'CONTEXT_MENU_ACTION'; readonly action: 'summarize' | 'translate' | 'ask'; readonly text?: string }
  | { readonly type: 'GET_PAGE_CONTEXT' }
  | { readonly type: 'ABORT_STREAM'; readonly sessionId: string }

export type ContentMessage =
  | { readonly type: 'EXTRACT_PAGE_CONTENT' }
  | { readonly type: 'PAGE_CONTENT_RESULT'; readonly data: PageContext }
  | { readonly type: 'SELECTED_TEXT'; readonly text: string }

export type SidePanelMessage =
  | { readonly type: 'PAGE_CONTEXT_UPDATED'; readonly context: PageContext }
  | { readonly type: 'CONTEXT_MENU_ACTION'; readonly action: string; readonly text?: string }

export type ExtMessage = BackgroundMessage | ContentMessage | SidePanelMessage
