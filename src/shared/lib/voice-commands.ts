/**
 * Voice Command System — Natural language command recognition
 * Detects user intent from speech and dispatches actions.
 */

export interface VoiceCommand {
  id: string
  patterns: RegExp[]
  action: string
  params?: Record<string, string>
  description: string
}

export interface CommandMatch {
  command: VoiceCommand
  confidence: number
  extractedParams: Record<string, string>
}

const COMMANDS: VoiceCommand[] = [
  {
    id: 'summarize',
    patterns: [/요약해\s*줘/, /요약해\s*주세요/, /summarize/i, /요약\s*부탁/],
    action: 'summarize',
    description: '현재 대화 요약',
  },
  {
    id: 'translate',
    patterns: [/번역해\s*줘/, /번역해\s*주세요/, /translate/i, /(.+)로\s*번역/],
    action: 'translate',
    description: '텍스트 번역',
  },
  {
    id: 'new-chat',
    patterns: [/새\s*대화/, /새로운\s*대화/, /new\s*chat/i],
    action: 'newChat',
    description: '새 대화 시작',
  },
  {
    id: 'search',
    patterns: [/검색해\s*줘/, /찾아\s*줘/, /search/i, /(.+)\s*검색/],
    action: 'search',
    description: '문서 검색',
  },
  {
    id: 'read-aloud',
    patterns: [/읽어\s*줘/, /소리\s*내어/, /read\s*aloud/i],
    action: 'readAloud',
    description: '마지막 응답 읽기',
  },
  {
    id: 'stop',
    patterns: [/멈춰/, /중지/, /stop/i, /그만/],
    action: 'stop',
    description: '현재 작업 중지',
  },
  {
    id: 'debate',
    patterns: [/토론\s*시작/, /debate/i, /토론해\s*줘/],
    action: 'debate',
    description: 'AI 토론 시작',
  },
  {
    id: 'take-note',
    patterns: [/메모/, /노트/, /note/i, /기록해\s*줘/],
    action: 'takeNote',
    description: '음성 메모 저장',
  },
  {
    id: 'meeting-start',
    patterns: [/회의\s*시작/, /미팅\s*시작/, /start\s*meeting/i, /녹음\s*시작/],
    action: 'meetingStart',
    description: '회의 녹음 시작',
  },
  {
    id: 'meeting-end',
    patterns: [/회의\s*끝/, /미팅\s*종료/, /end\s*meeting/i, /녹음\s*종료/],
    action: 'meetingEnd',
    description: '회의 녹음 종료',
  },
]

/** Match voice input against registered commands */
export function matchCommand(text: string): CommandMatch | null {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return null

  let bestMatch: CommandMatch | null = null
  let bestConfidence = 0

  for (const cmd of COMMANDS) {
    for (const pattern of cmd.patterns) {
      const match = normalized.match(pattern)
      if (match) {
        const coverage = match[0].length / normalized.length
        const confidence = Math.min(coverage + 0.3, 1)

        if (confidence > bestConfidence) {
          const extractedParams: Record<string, string> = {}
          if (match[1]) {
            extractedParams.target = match[1].trim()
          }

          bestMatch = { command: cmd, confidence, extractedParams }
          bestConfidence = confidence
        }
      }
    }
  }

  return bestConfidence >= 0.3 ? bestMatch : null
}

/** Get all available commands */
export function getAvailableCommands(): VoiceCommand[] {
  return [...COMMANDS]
}

/** Register a custom command */
export function registerCommand(command: VoiceCommand): void {
  COMMANDS.push(command)
}

export type { VoiceCommand as VoiceCommandType }
