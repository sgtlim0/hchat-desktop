# hchat-v2-extension 기능 분석 및 PWA 적용 우선순위

> 분석일: 2026-03-02
> 원본: https://github.com/sgtlim0/hchat-v2-extension
> 대상: hchat-pwa (React 19 + TypeScript + Vite 7 + Zustand 5)

---

## 1. 원본 기능 전체 인벤토리 (25개)

### 이식 가능 (PWA 호환) — 18개

| # | 기능 | 복잡도 | PWA 현재 상태 | 핵심 파일 |
|---|------|--------|---------------|-----------|
| 1 | 멀티 프로바이더 채팅 | LOW | ✅ 구현됨 | `providers/` |
| 2 | 자동 모델 라우팅 | LOW | ✅ 구현됨 | `model-router.ts` |
| 3 | **에이전트 모드 (Tool Calling)** | MEDIUM | ❌ 미구현 | `agent.ts`, `agentTools.ts` |
| 4 | **웹 검색 + RAG** | MEDIUM | ❌ 미구현 | `webSearch.ts`, `searchIntent.ts` |
| 5 | 크로스 모델 토론 | LOW | ✅ 방금 구현 | `debate.ts` |
| 6 | 그룹 채팅 | LOW | ✅ 구현됨 | `GroupChatView.tsx` |
| 7 | 페르소나 시스템 | LOW | ✅ 구현됨 | `personas.ts` |
| 8 | 프롬프트 라이브러리 | LOW | ✅ 구현됨 | `promptLibrary.ts` |
| 9 | **TTS (음성 출력)** | LOW | ❌ 미구현 | `tts.ts` |
| 10 | **STT (음성 입력)** | LOW | ❌ 미구현 | `stt.ts` |
| 11 | **대화 폴더** | LOW | ❌ 미구현 | `folders.ts` |
| 12 | **대화 태그** | LOW | ❌ 미구현 | `tags.ts` |
| 13 | **대화 포크 (분기)** | LOW | ❌ 미구현 | `chatHistory.ts` |
| 14 | 채팅 내보내기 | LOW | ✅ 구현됨 | `exportChat.ts` |
| 15 | **채팅 가져오기 (ChatGPT/Claude)** | LOW | 부분 (JSON만) | `importChat.ts` |
| 16 | 사용량 추적 | LOW | ✅ 구현됨 | `usage.ts` |
| 17 | **AI 대화 요약** | LOW | ❌ 미구현 | `summarize.ts` |
| 18 | **AI 도구 패널 (PDF/Writing/OCR)** | MEDIUM | 부분 (PDF만) | `ToolsView.tsx` |

### 이식 불가 (Chrome Extension 전용) — 7개

| # | 기능 | 사유 |
|---|------|------|
| 19 | 플로팅 AI 툴바 | Content Script (페이지 주입) |
| 20 | 검색엔진 AI 요약 | Content Script (Google/Bing/Naver) |
| 21 | 글쓰기 어시스턴트 | Content Script (textarea 감지) |
| 22 | 페이지 컨텍스트 추적 | chrome.tabs/scripting API |
| 23 | 웹 하이라이트 | Content Script (XPath 복원) |
| 24 | 멀티탭 요약 | chrome.tabs API |
| 25 | YouTube 트랜스크립트 추출 | chrome.scripting (캡션 DOM 접근) |

---

## 2. PWA 적용 우선순위

### P1 — 높은 가치 + 낮은 복잡도 (즉시 구현)

| 기능 | 이유 | 예상 공수 |
|------|------|-----------|
| **TTS (음성 출력)** | Web Speech API, 브라우저 네이티브, 코드 ~50줄 | 0.5일 |
| **STT (음성 입력)** | Web Speech API, 브라우저 네이티브, 코드 ~60줄 | 0.5일 |
| **AI 대화 요약** | LLM 1회 호출, 캐시, 코드 ~40줄 | 0.5일 |
| **대화 포크** | 기존 세션 복제 + 메시지 잘라내기 | 0.5일 |
| **ChatGPT/Claude 가져오기** | 순수 JSON 파싱, format 감지 ~80줄 | 0.5일 |

### P2 — 높은 가치 + 중간 복잡도

| 기능 | 이유 | 예상 공수 |
|------|------|-----------|
| **에이전트 모드** | 핵심 차별화 기능, XML tool call 파싱 + 5개 도구 | 2일 |
| **웹 검색 + RAG** | DuckDuckGo 스크래핑 (CORS 프록시 필요) | 1.5일 |
| **AI 도구 패널** | 글쓰기 도구 11종 + OCR (비전 모델) | 1.5일 |

### P3 — 보통 가치 + 낮은 복잡도

| 기능 | 이유 | 예상 공수 |
|------|------|-----------|
| **대화 폴더** | 정리 기능, 컬러 코딩 | 1일 |
| **대화 태그** | 정리 기능, 필터링 | 0.5일 |
| **스토리지 관리** | IndexedDB 분석 + 정리 UI | 1일 |

---

## 3. 핵심 포팅 대상 코드 패턴

### 에이전트 모드 (agent.ts)

```typescript
// XML 기반 tool call 파싱 (크로스 프로바이더 호환)
export async function runAgent(opts: AgentOptions): Promise<AgentResult> {
  for (let step = 0; step < maxSteps; step++) {
    const fullResponse = await streamStep(...)
    const toolCalls = parseToolCalls(fullResponse) // <tool_call> XML 파싱
    if (toolCalls.length === 0) return { finalText, steps }
    // 도구 실행 → 결과를 히스토리에 추가 → 다음 라운드
  }
}
```

### 웹 검색 (webSearch.ts)

```typescript
// 검색 의도 감지 → DuckDuckGo HTML 스크래핑
export function needsWebSearch(query: string): boolean {
  if (SKIP_PATTERNS.some(p => p.test(trimmed))) return false
  return SEARCH_PATTERNS.some(p => p.test(trimmed))
}

export async function webSearch(query: string): Promise<SearchResult[]> {
  // DuckDuckGo HTML → DOM 파싱 → 상위 5개 결과
}
```

### TTS/STT (tts.ts, stt.ts)

```typescript
// TTS: Web Speech API
const utterance = new SpeechSynthesisUtterance(stripMarkdown(text))
speechSynthesis.speak(utterance)

// STT: Web Speech Recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
recognition.continuous = true
recognition.interimResults = true
```

### 가져오기 형식 감지 (importChat.ts)

```typescript
function detectSource(data: unknown): 'chatgpt' | 'claude' | 'hchat' | 'unknown' {
  if (Array.isArray(data) && data[0]?.mapping) return 'chatgpt'
  if (data?.chat_messages) return 'claude'
  if (data?.messages && data?.model) return 'hchat'
  return 'unknown'
}
```

---

## 4. 아키텍처 차이점

| 항목 | v2-extension | hchat-pwa |
|------|-------------|-----------|
| 프레임워크 | React 19 + Vite 6 | React 19 + Vite 7 |
| 스타일링 | 순수 CSS + CSS Variables | Tailwind CSS 3 |
| 상태관리 | chrome.storage.local | Zustand 5 + IndexedDB (Dexie) |
| 라우팅 | 탭 기반 (5개 뷰) | ViewState 기반 (13개 뷰) |
| i18n | 커스텀 (ko/en) | 커스텀 (ko/en) — 호환 |
| 프로바이더 | 직접 fetch (SigV4 포함) | Modal 백엔드 프록시 + 직접 fetch |
| 번들링 | @crxjs/vite-plugin | Vite + vite-plugin-pwa |

### 포팅 시 주의사항

1. **chrome.storage → Dexie**: 모든 저장소 접근을 IndexedDB로 교체
2. **CORS**: 웹 검색, URL 페치 등은 PWA에서 CORS 제한 → Modal 백엔드 프록시 필요
3. **Content Script 기능 대체**: 페이지 읽기 → URL 입력 + fetch, YouTube → URL 기반 API
4. **CSS → Tailwind**: 순수 CSS 컴포넌트를 Tailwind 클래스로 변환
