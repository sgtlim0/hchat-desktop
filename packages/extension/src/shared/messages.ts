import type { ExtMessage, MessageType } from './types'

export const MSG = {
  ANALYZE: 'ANALYZE' as MessageType,
  ANALYZE_STREAM: 'ANALYZE_STREAM' as MessageType,
  TEST_CONNECTION: 'TEST_CONNECTION' as MessageType,
  EXTRACT_TEXT: 'EXTRACT_TEXT' as MessageType,
  ANALYSIS_CHUNK: 'ANALYSIS_CHUNK' as MessageType,
  ANALYSIS_DONE: 'ANALYSIS_DONE' as MessageType,
  ANALYSIS_ERROR: 'ANALYSIS_ERROR' as MessageType,
} as const

export function sendMessage<T = unknown>(
  type: MessageType,
  payload?: unknown,
): Promise<T> {
  const message: ExtMessage = { type, payload }
  return chrome.runtime.sendMessage(message)
}

export function sendTabMessage<T = unknown>(
  tabId: number,
  type: MessageType,
  payload?: unknown,
): Promise<T> {
  const message: ExtMessage = { type, payload }
  return chrome.tabs.sendMessage(tabId, message)
}
