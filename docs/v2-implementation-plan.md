# v2-extension 기능 포팅 — 구현 계획

> 2026-03-02 | hchat-pwa P1~P3 신규 기능 구현 로드맵

---

## 1. 구현 순서 (의존성 기반)

```
Phase 1 (P1) — 즉시 구현 가능, 외부 의존 없음
  ├── 1A. TTS (음성 출력) ·························· 0.5일
  ├── 1B. STT (음성 입력) ·························· 0.5일
  ├── 1C. AI 대화 요약 ····························· 0.5일
  ├── 1D. 대화 포크 (Fork) ························· 0.5일
  └── 1E. ChatGPT/Claude 가져오기 확장 ············· 0.5일

Phase 2 (P2) — 중간 복잡도, 일부 백엔드 프록시 필요
  ├── 2A. 에이전트 모드 (Tool Calling) ·············· 2일
  ├── 2B. 웹 검색 + RAG ···························· 1.5일
  └── 2C. AI 도구 패널 (Writing/Grammar/OCR) ······· 1.5일

Phase 3 (P3) — 대화 정리 기능
  ├── 3A. 대화 폴더 ································ 1일
  ├── 3B. 대화 태그 ································ 0.5일
  └── 3C. 스토리지 관리 ···························· 1일
```

---

## 2. Phase 1 상세 구현

### 1A. TTS (음성 출력)

**목표**: 어시스턴트 메시지를 음성으로 읽어주기

**신규 파일**:
- `src/shared/lib/tts.ts` — Web Speech API 래퍼

**수정 파일**:
- `src/widgets/message-list/MessageBubble.tsx` — TTS 버튼 추가
- `src/shared/i18n/ko.ts`, `en.ts` — `tts.*` 키 ~6개

**구현 요점**:
```typescript
// src/shared/lib/tts.ts
const stripMarkdown = (text: string): string => { /* markdown 태그 제거 */ }

export function speak(text: string, lang = 'ko-KR'): void {
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(stripMarkdown(text))
  utterance.lang = lang
  utterance.rate = 1.0
  speechSynthesis.speak(utterance)
}

export function stop(): void { speechSynthesis.cancel() }
export function isSpeaking(): boolean { return speechSynthesis.speaking }
```

**MessageBubble 변경**:
- 어시스턴트 메시지에 `🔊 읽기` 버튼 추가
- 클릭 → `speak(message.text)`, 재생 중이면 `stop()`
- 상태: `idle` | `playing` (아이콘 토글)

---

### 1B. STT (음성 입력)

**목표**: 마이크로 음성 → 텍스트 변환

**신규 파일**:
- `src/shared/lib/stt.ts` — Web Speech Recognition 래퍼

**수정 파일**:
- `src/widgets/prompt-input/PromptInput.tsx` — 마이크 버튼 추가

**구현 요점**:
```typescript
// src/shared/lib/stt.ts
export function startListening(
  onResult: (text: string, isFinal: boolean) => void,
  lang = 'ko-KR'
): void {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = lang
  recognition.onresult = (event) => { /* interim/final 콜백 */ }
  recognition.start()
}
```

**PromptInput 변경**:
- `+` 버튼 옆에 `🎤` 마이크 버튼 추가
- 활성화 시 빨간색 + 파형 애니메이션
- interim 결과를 실시간으로 입력 필드에 표시
- final 결과 시 입력 필드에 확정

---

### 1C. AI 대화 요약

**목표**: 긴 대화를 AI가 자동 요약

**수정 파일**:
- `src/entities/session/session.store.ts` — `summary` 필드 + `generateSummary()` 액션
- `src/shared/types/index.ts` — `Session` 타입에 `summary?: string` 추가
- `src/pages/all-chats/AllChatsScreen.tsx` — 요약 표시 + 생성 버튼

**구현 요점**:
- 세션의 메시지 5개 이상일 때 요약 생성 가능
- `createStream()` 1회 호출, 시스템 프롬프트: "다음 대화를 2-3문장으로 요약"
- 결과를 `session.summary`에 저장 (Dexie 영속화)
- AllChatsScreen 세션 카드에 요약 표시 (접이식)

---

### 1D. 대화 포크 (Fork)

**목표**: 특정 메시지 시점에서 분기하여 새 대화 생성

**수정 파일**:
- `src/entities/session/session.store.ts` — `forkSession(sessionId, messageIndex)` 액션
- `src/widgets/message-list/MessageBubble.tsx` — 컨텍스트 메뉴에 "여기서 분기" 추가

**구현 요점**:
```typescript
forkSession: (sessionId: string, messageIndex: number) => {
  const original = get().sessions.get(sessionId)
  const messages = get().messages.get(sessionId) ?? []
  const forkedMessages = messages.slice(0, messageIndex + 1)
  const newSession = {
    ...original,
    id: crypto.randomUUID(),
    title: `Fork: ${original.title}`,
    createdAt: new Date().toISOString(),
    parentId: sessionId,       // 분기 추적
    forkPoint: messageIndex,   // 분기 지점
  }
  // 새 세션 + 복제된 메시지 저장
}
```

---

### 1E. ChatGPT/Claude 가져오기 확장

**목표**: ChatGPT, Claude 내보내기 JSON 형식 자동 감지 및 가져오기

**신규 파일**:
- `src/shared/lib/import-chat.ts` — 형식 감지 + 변환 로직

**수정 파일**:
- `src/pages/all-chats/AllChatsScreen.tsx` — 가져오기 다이얼로그 확장

**구현 요점**:
```typescript
function detectSource(data: unknown): 'chatgpt' | 'claude' | 'hchat' | 'unknown' {
  if (Array.isArray(data) && data[0]?.mapping) return 'chatgpt'
  if (data?.chat_messages) return 'claude'
  if (data?.messages && data?.model) return 'hchat'
  return 'unknown'
}

function convertChatGPT(data: any): Session & { messages: Message[] } { /* mapping → 선형 메시지 */ }
function convertClaude(data: any): Session & { messages: Message[] } { /* chat_messages → Message[] */ }
```

---

## 3. Phase 2 상세 구현

### 2A. 에이전트 모드 (Tool Calling)

**목표**: LLM이 도구를 호출하며 다단계 작업 수행

**신규 파일**:
- `src/entities/agent/agent.store.ts` — 에이전트 상태 관리
- `src/pages/agent/AgentPage.tsx` — 에이전트 UI
- `src/shared/lib/agent/agent-runner.ts` — 에이전트 실행 루프
- `src/shared/lib/agent/tools/*.ts` — 5개 도구 구현

**수정 파일**:
- `src/shared/types/index.ts` — `AgentStep`, `AgentSession`, ViewState + `'agent'`
- `src/app/layouts/MainLayout.tsx` — agent 뷰 라우팅
- `src/widgets/sidebar/Sidebar.tsx` — 사이드바 항목
- i18n — `agent.*` 키 ~20개

**에이전트 루프**:
```typescript
async function runAgent(prompt: string, tools: Tool[], maxSteps = 5): AsyncGenerator<AgentStep> {
  const history: Message[] = [{ role: 'user', content: prompt }]

  for (let step = 0; step < maxSteps; step++) {
    const response = await streamToCompletion(history)
    const toolCalls = parseToolCalls(response)  // XML <tool_call> 파싱

    if (toolCalls.length === 0) {
      yield { type: 'response', content: response }
      return
    }

    for (const call of toolCalls) {
      yield { type: 'tool_call', tool: call.name, args: call.args }
      const result = await executeTool(call)
      yield { type: 'tool_result', tool: call.name, result }
      history.push({ role: 'assistant', content: response })
      history.push({ role: 'user', content: `<tool_result>${result}</tool_result>` })
    }
  }
}
```

**5개 도구**:
1. `web_search` — DuckDuckGo HTML 스크래핑 (Modal 프록시)
2. `fetch_url` — URL 내용 가져오기 (Modal 프록시)
3. `calculate` — 안전한 수학 파서 (`eval` 없음)
4. `get_datetime` — 현재 날짜/시간 반환
5. `analyze_pdf` — 업로드된 PDF 분석 (기존 pdf-extractor 재사용)

**CORS 해결**: Modal 백엔드에 `/api/proxy` 엔드포인트 추가

---

### 2B. 웹 검색 + RAG

**목표**: 검색 의도 자동 감지 → 검색 → 결과 컨텍스트 주입

**신규 파일**:
- `src/shared/lib/web-search.ts` — 검색 의도 감지 + 결과 파싱
- Modal 백엔드: `/api/search` 엔드포인트 (DuckDuckGo 프록시)

**수정 파일**:
- `src/widgets/prompt-input/PromptInput.tsx` — 검색 토글 + 결과 표시
- `src/entities/session/session.store.ts` — 검색 결과 컨텍스트 주입

**검색 의도 감지**:
```typescript
const SEARCH_PATTERNS = [
  /최신|최근|현재|지금|오늘|뉴스/,
  /latest|recent|current|today|news/,
  /누구|언제|어디|what is|who is|when|where/,
  /비교|차이|versus|vs\b/,
]

export function needsWebSearch(query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  if (SKIP_PATTERNS.some(p => p.test(trimmed))) return false
  return SEARCH_PATTERNS.some(p => p.test(trimmed))
}
```

---

### 2C. AI 도구 패널

**목표**: 글쓰기 변환 11종 + 문법 검사 + 요약 + OCR

**신규 파일**:
- `src/pages/tools/ToolsPage.tsx` — 메인 뷰
- `src/pages/tools/WritingTool.tsx` — 11종 글쓰기 변환
- `src/pages/tools/GrammarTool.tsx` — 문법 검사
- `src/pages/tools/SummarizeTool.tsx` — 텍스트 요약
- `src/pages/tools/OcrTool.tsx` — 이미지 → 텍스트 (비전 모델)

**글쓰기 도구 11종**: 바꿔쓰기, 공식적, 캐주얼, 짧게, 길게, 문법교정, 불릿, 이메일, 요약, 번역EN, 번역KO

**OCR**: 이미지 업로드 → base64 → 비전 모델 (Claude/GPT-4V) → 텍스트 추출

---

## 4. Phase 3 상세 구현

### 3A. 대화 폴더

**신규 파일**:
- `src/entities/folder/folder.store.ts` — 폴더 CRUD
- Dexie 스키마 확장: `folders` 테이블

**수정 파일**:
- `src/shared/types/index.ts` — `Folder` 타입, `Session`에 `folderId?` 추가
- `src/widgets/sidebar/Sidebar.tsx` — 폴더 섹션 추가
- `src/pages/all-chats/AllChatsScreen.tsx` — 폴더별 필터링

### 3B. 대화 태그

**수정 파일**:
- `src/shared/types/index.ts` — `Session`에 `tags?: string[]` 추가
- `src/entities/session/session.store.ts` — `addTag()`, `removeTag()` 액션
- `src/widgets/sidebar/Sidebar.tsx` — 태그 클라우드 섹션
- `src/pages/all-chats/AllChatsScreen.tsx` — 태그별 필터링

### 3C. 스토리지 관리

**신규 파일**:
- `src/pages/settings/StorageSection.tsx` — IndexedDB 분석 + 정리 UI

---

## 5. 수정 파일 전체 요약

| Phase | 신규 파일 | 수정 파일 | 백엔드 |
|-------|----------|----------|--------|
| P1 (5개) | 3 | 8 | 없음 |
| P2 (3개) | 9 | 6 | Modal 2개 엔드포인트 |
| P3 (3개) | 2 | 5 | 없음 |
| **합계** | **14** | **19** | **2** |

---

## 6. 기술적 의사결정

| 결정 | 선택 | 이유 |
|------|------|------|
| TTS 엔진 | Web Speech API | 외부 의존 없음, 브라우저 네이티브 |
| STT 엔진 | Web Speech Recognition | 브라우저 네이티브, Chrome/Edge 지원 |
| 차트 라이브러리 | 없음 (SVG 직접) | 이미 구현됨, 번들 크기 절약 |
| 에이전트 tool call | XML 기반 | 크로스 프로바이더 호환 |
| 웹 검색 | DuckDuckGo + Modal 프록시 | API 키 불필요, CORS 우회 |
| PDF 처리 | pdfjs-dist (이미 설치됨) | 브라우저 네이티브 PDF 파싱 |
| 폴더/태그 저장소 | Dexie (IndexedDB) | 기존 영속화 패턴 일관성 |

---

## 7. 위험 요소 및 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| Web Speech API 브라우저 호환성 | STT/TTS가 Safari에서 제한적 | feature detection + 폴백 UI |
| DuckDuckGo 스크래핑 불안정 | 웹 검색 실패 | Brave Search 대안, 에러 핸들링 |
| 에이전트 무한 루프 | 비용 폭주 | maxSteps 제한 (기본 5) |
| 대용량 PDF | 메모리 + 토큰 초과 | 10,000자 제한 (이미 구현) |
| IndexedDB 용량 | 폴더/태그 데이터 증가 | 스토리지 관리 기능 (P3) |
