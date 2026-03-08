# 스마트 청킹 + Citation 시스템 구현 방안

> 작성일: 2026-03-08
> 대상: hchat-pwa (React 19 + Vite 7 + Zustand 5)
> 목표: PDF 분석 정밀도 향상 + AI 답변 출처 인용 시스템 도입

---

## 1. 현재 상태 분석

### 1-1. PDF 추출 (`src/shared/lib/pdf-extractor.ts`)

```typescript
// 현재: 단순 텍스트 추출, 페이지 구분 없이 단일 문자열 반환
async function extractPdfText(file: File): Promise<{ text: string; pageCount: number }>
```

**한계:**
- 페이지 번호 정보 미보존 (전체 텍스트를 `\n\n`으로 합침)
- 10,000자 하드 컷 (문장/단락 경계 무시)
- 청킹 없음 — 전체 텍스트를 시스템 프롬프트에 주입
- 표(Table) 구조 미보존

### 1-2. 시스템 프롬프트 주입 (`src/widgets/prompt-input/PromptInput.tsx:289`)

```typescript
// 현재: 파일명 + 페이지 수 + 평문 텍스트 단순 연결
const pdfContext = `[PDF Document: ${pdfAttachment.fileName} (${pdfAttachment.pageCount} pages)]\n\n${pdfAttachment.text}`
systemPrompt = systemPrompt ? `${systemPrompt}\n\n${pdfContext}` : pdfContext
```

**한계:**
- 인용 지시 없음 — LLM이 출처를 밝히지 않음
- 청크 ID 없음 — 어느 페이지에서 왔는지 추적 불가

### 1-3. 기존 RAG 시스템 (`src/shared/lib/rag.ts`)

이미 구현되어 있지만 **Knowledge Base 전용**:
- `Citation` 인터페이스 정의됨 (`documentId`, `documentTitle`, `chunkIndex`, `snippet`, `relevance`)
- `buildRAGContext()` — `[출처 N: 제목 - 섹션 M]` 형식 프롬프트 생성
- `chunkWithOverlap()` — 단락 기반 슬라이딩 윈도우 (500자 청크, 100자 오버랩)

**재사용 가능한 부분:** `chunkWithOverlap`, `Citation` 인터페이스, `buildRAGContext` 패턴

### 1-4. MessageBubble (`src/widgets/message-list/MessageBubble.tsx`)

- ReactMarkdown + remarkGfm 렌더링
- `MarkdownSegment` 컴포넌트로 마크다운 파싱
- 인용 배지(Citation Badge) UI 미구현

---

## 2. 아키텍처 설계

### 2-1. 전체 데이터 흐름

```
PDF 업로드
  │
  ▼
[스마트 청킹 엔진] ─── pdf-extractor.ts 개선
  │ 페이지별 텍스트 추출
  │ 재귀적 구분자 분할 (단락 → 문장 → 단어)
  │ 10-20% 오버랩
  │ 각 청크에 { id, page, text } 메타데이터
  ▼
[PdfChunkedAttachment] ─── types/index.ts 확장
  │ chunks: PdfChunk[]
  │ fileName, pageCount
  ▼
[시스템 프롬프트 빌더] ─── 신규: citation-prompt.ts
  │ "[Chunk 1, Page 3] 텍스트..."
  │ + 인용 규칙 지시어
  ▼
[LLM 스트리밍 응답]
  │ "...영업이익은 15% 증가했습니다[1]..."
  ▼
[Citation 파서] ─── 신규: citation-parser.ts
  │ [N] 패턴 감지 → 메타데이터 매핑
  │ 환각 검증 (존재하지 않는 번호 필터링)
  ▼
[MessageBubble 렌더링] ─── MessageBubble.tsx 확장
  │ [1] → 클릭 가능 배지
  │ 호버/클릭 시 출처 프리뷰 팝업
  ▼
[사용자 경험]
  "이 수치의 출처는?" → 배지 클릭 → Page 3 원문 확인
```

### 2-2. 파일 변경 요약

| 구분 | 파일 | 변경 내용 |
|------|------|----------|
| 수정 | `src/shared/types/index.ts` | `PdfChunk`, `PdfChunkedAttachment`, `CitationMeta` 타입 추가 |
| 수정 | `src/shared/lib/pdf-extractor.ts` | 페이지별 추출 + 스마트 청킹 |
| 신규 | `src/shared/lib/citation-prompt.ts` | 인용 규칙 시스템 프롬프트 빌더 |
| 신규 | `src/shared/lib/citation-parser.ts` | LLM 응답에서 `[N]` 파싱 + 검증 |
| 수정 | `src/widgets/prompt-input/PromptInput.tsx` | 청킹된 PDF → citation 프롬프트 빌더 연동 |
| 수정 | `src/widgets/message-list/MessageBubble.tsx` | `CitationBadge` 컴포넌트 추가 |
| 신규 | `src/widgets/message-list/CitationBadge.tsx` | 인용 배지 UI + 팝업 프리뷰 |

---

## 3. 상세 구현 명세

### 3-1. 타입 정의 (`src/shared/types/index.ts` 추가)

```typescript
/** 스마트 청킹된 PDF 청크 */
export interface PdfChunk {
  id: string          // "chunk-1", "chunk-2", ...
  page: number        // 원본 PDF 페이지 번호 (1-based)
  content: string     // 청크 텍스트
  startOffset: number // 페이지 내 시작 오프셋 (문자 단위)
}

/** 스마트 청킹 결과를 담는 PDF 첨부 (기존 PdfAttachment 대체) */
export interface PdfChunkedAttachment {
  fileName: string
  pageCount: number
  chunks: PdfChunk[]
  totalTextLength: number
}

/** LLM 응답에서 파싱된 인용 메타데이터 */
export interface CitationMeta {
  index: number       // [1], [2], ... 의 번호
  chunkId: string     // 매핑된 청크 ID
  page: number        // 원본 페이지 번호
  snippet: string     // 원문 미리보기 (150자)
}
```

### 3-2. 스마트 청킹 엔진 (`src/shared/lib/pdf-extractor.ts` 수정)

```typescript
import * as pdfjsLib from 'pdfjs-dist'
import type { PdfChunk, PdfChunkedAttachment } from '@/shared/types'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

const MAX_TOTAL_LENGTH = 12_000
const CHUNK_SIZE = 600
const OVERLAP_RATIO = 0.15

/** 기존 extractPdfText 유지 (하위 호환) */
export async function extractPdfText(file: File): Promise<{ text: string; pageCount: number }> {
  const result = await extractPdfChunked(file)
  return {
    text: result.chunks.map((c) => c.content).join('\n\n'),
    pageCount: result.pageCount,
  }
}

/** 신규: 페이지별 추출 + 스마트 청킹 */
export async function extractPdfChunked(file: File): Promise<PdfChunkedAttachment> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageCount = pdf.numPages

  // Phase 1: 페이지별 텍스트 추출
  const pageTexts: Array<{ page: number; text: string }> = []
  let totalLength = 0

  for (let i = 1; i <= pageCount; i++) {
    if (totalLength >= MAX_TOTAL_LENGTH) break

    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()

    if (pageText.length > 0) {
      pageTexts.push({ page: i, text: pageText })
      totalLength += pageText.length
    }
  }

  // Phase 2: 재귀적 구분자 분할 + 오버랩
  const chunks = smartChunk(pageTexts)

  return {
    fileName: file.name,
    pageCount,
    chunks,
    totalTextLength: chunks.reduce((sum, c) => sum + c.content.length, 0),
  }
}

/** 재귀적 구분자 분할: 단락 → 문장 → 단어 우선순위 */
function smartChunk(pageTexts: Array<{ page: number; text: string }>): PdfChunk[] {
  const chunks: PdfChunk[] = []
  let chunkIndex = 0
  let buffer = ''
  let bufferPage = 1

  for (const { page, text } of pageTexts) {
    // 단락 단위 분할
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0)
    if (paragraphs.length === 0) {
      // 단락 구분자 없으면 문장 단위
      paragraphs.push(...splitBySentences(text))
    }

    for (const para of paragraphs) {
      if (buffer.length + para.length > CHUNK_SIZE && buffer.length > 0) {
        // 현재 버퍼를 청크로 저장
        chunks.push({
          id: `chunk-${++chunkIndex}`,
          page: bufferPage,
          content: buffer.trim(),
          startOffset: 0,
        })

        // 오버랩: 마지막 부분 유지
        const overlapSize = Math.floor(buffer.length * OVERLAP_RATIO)
        buffer = buffer.slice(-overlapSize)
        bufferPage = page
      }

      if (buffer.length === 0) {
        bufferPage = page
      }
      buffer += (buffer ? '\n\n' : '') + para
    }
  }

  // 잔여 버퍼 처리
  if (buffer.trim().length > 0) {
    chunks.push({
      id: `chunk-${++chunkIndex}`,
      page: bufferPage,
      content: buffer.trim(),
      startOffset: 0,
    })
  }

  return chunks
}

/** 문장 단위 분할 (한국어/영어 지원) */
function splitBySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
```

### 3-3. Citation 시스템 프롬프트 빌더 (`src/shared/lib/citation-prompt.ts` 신규)

```typescript
import type { PdfChunk, PdfChunkedAttachment } from '@/shared/types'

const MAX_CONTEXT_CHARS = 8_000

/** 인용 규칙이 포함된 시스템 프롬프트 생성 */
export function buildCitationPrompt(
  attachment: PdfChunkedAttachment,
  baseSystemPrompt?: string,
): string {
  const chunks = selectRelevantChunks(attachment.chunks)

  const contextParts = chunks.map(
    (chunk) => `[${chunk.id}, Page ${chunk.page}]\n${chunk.content}`
  )

  const citationRules = `다음은 "${attachment.fileName}" (${attachment.pageCount}페이지) 문서에서 추출한 내용입니다.

---문서 내용---
${contextParts.join('\n\n')}
---문서 내용 끝---

답변 규칙:
1. 위 문서 내용을 근거로 답변하세요.
2. 핵심 정보나 수치를 인용할 때 반드시 해당 청크 번호를 [N] 형식으로 표기하세요 (예: [1], [2]).
3. 문서에 없는 내용은 추측이라고 명시하세요.
4. 인용 번호는 위에 제공된 chunk ID의 숫자를 사용하세요.`

  return baseSystemPrompt
    ? `${baseSystemPrompt}\n\n${citationRules}`
    : citationRules
}

/** 최대 컨텍스트 크기 내에서 청크 선택 */
function selectRelevantChunks(chunks: PdfChunk[]): PdfChunk[] {
  const selected: PdfChunk[] = []
  let totalLength = 0

  for (const chunk of chunks) {
    if (totalLength + chunk.content.length > MAX_CONTEXT_CHARS) break
    selected.push(chunk)
    totalLength += chunk.content.length
  }

  return selected
}

/** 특정 쿼리에 관련된 청크를 우선 선택 (키워드 매칭) */
export function rankChunksByQuery(
  chunks: PdfChunk[],
  query: string,
): PdfChunk[] {
  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)

  const scored = chunks.map((chunk) => {
    const lowerContent = chunk.content.toLowerCase()
    const matchCount = queryTokens.filter((t) => lowerContent.includes(t)).length
    return { chunk, score: matchCount / Math.max(queryTokens.length, 1) }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.chunk)
}
```

### 3-4. Citation 파서 (`src/shared/lib/citation-parser.ts` 신규)

```typescript
import type { PdfChunk, CitationMeta } from '@/shared/types'

const CITATION_REGEX = /\[(\d+)\]/g

/** LLM 응답 텍스트에서 [N] 인용 번호 추출 + 청크 메타 매핑 */
export function parseCitations(
  responseText: string,
  chunks: PdfChunk[],
): CitationMeta[] {
  const seen = new Set<number>()
  const citations: CitationMeta[] = []

  let match: RegExpExecArray | null = null
  while ((match = CITATION_REGEX.exec(responseText)) !== null) {
    const num = parseInt(match[1], 10)
    if (seen.has(num)) continue
    seen.add(num)

    // 환각 검증: 실제 존재하는 청크 번호인지 확인
    const chunk = chunks.find((c) => c.id === `chunk-${num}`)
    if (!chunk) continue

    citations.push({
      index: num,
      chunkId: chunk.id,
      page: chunk.page,
      snippet: chunk.content.slice(0, 150) + (chunk.content.length > 150 ? '...' : ''),
    })
  }

  return citations.sort((a, b) => a.index - b.index)
}

/** 응답 텍스트에서 인용 번호를 마크다운 강조로 변환 */
export function annotateCitations(responseText: string, validIndices: Set<number>): string {
  return responseText.replace(CITATION_REGEX, (match, num) => {
    const n = parseInt(num, 10)
    // 유효한 인용만 배지로 변환, 나머지는 그대로 유지
    if (validIndices.has(n)) {
      return `**[${n}]**`
    }
    return match
  })
}
```

### 3-5. PromptInput 연동 (`src/widgets/prompt-input/PromptInput.tsx` 수정)

**변경 포인트:** `handleSend()` 내 시스템 프롬프트 구성 부분

```typescript
// 기존 (PromptInput.tsx:289-293)
// if (pdfAttachment) {
//   const pdfContext = `[PDF Document: ${pdfAttachment.fileName}...`
//   systemPrompt = systemPrompt ? `${systemPrompt}\n\n${pdfContext}` : pdfContext
// }

// 변경 후
import { buildCitationPrompt, rankChunksByQuery } from '@/shared/lib/citation-prompt'
import type { PdfChunkedAttachment } from '@/shared/types'

// state 추가
const [pdfChunkedAttachment, setPdfChunkedAttachment] = useState<PdfChunkedAttachment | null>(null)

// handleFileUpload에서 extractPdfChunked 사용
if (ext === 'pdf') {
  setPdfLoading(true)
  try {
    const { extractPdfChunked } = await import('@/shared/lib/pdf-extractor')
    const result = await extractPdfChunked(file)
    setPdfChunkedAttachment(result)
    // 하위 호환: 기존 pdfAttachment도 유지
    setPdfAttachment({
      fileName: result.fileName,
      pageCount: result.pageCount,
      text: result.chunks.map((c) => c.content).join('\n\n'),
    })
  } catch (error) { /* ... */ }
}

// handleSend에서 citation 프롬프트 빌더 사용
if (pdfChunkedAttachment) {
  // 쿼리 관련도 기반 청크 재정렬
  const rankedChunks = rankChunksByQuery(pdfChunkedAttachment.chunks, messageText)
  const rankedAttachment = { ...pdfChunkedAttachment, chunks: rankedChunks }
  systemPrompt = buildCitationPrompt(rankedAttachment, systemPrompt)
}
```

### 3-6. CitationBadge 컴포넌트 (`src/widgets/message-list/CitationBadge.tsx` 신규)

```typescript
import { memo, useState, useCallback, useRef, useEffect } from 'react'
import type { CitationMeta } from '@/shared/types'

interface CitationBadgeProps {
  citation: CitationMeta
}

export const CitationBadge = memo(function CitationBadge({ citation }: CitationBadgeProps) {
  const [showPopup, setShowPopup] = useState(false)
  const badgeRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback(() => {
    setShowPopup((prev) => !prev)
  }, [])

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!showPopup) return
    function handleClickOutside(e: MouseEvent) {
      if (
        badgeRef.current && !badgeRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPopup])

  return (
    <span className="relative inline-block">
      <button
        ref={badgeRef}
        onClick={handleToggle}
        className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold
          bg-primary/15 text-primary rounded-full hover:bg-primary/25
          transition-colors cursor-pointer align-super mx-0.5"
        aria-label={`출처 ${citation.index} - Page ${citation.page}`}
      >
        {citation.index}
      </button>

      {showPopup && (
        <div
          ref={popupRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
            w-72 bg-surface border border-border rounded-lg shadow-lg p-3
            text-xs text-text-primary"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5
              bg-primary/15 text-primary rounded-full text-[10px] font-bold">
              {citation.index}
            </span>
            <span className="font-medium text-text-secondary">
              Page {citation.page}
            </span>
          </div>
          <p className="text-text-secondary leading-relaxed border-l-2 border-primary/30 pl-2">
            {citation.snippet}
          </p>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="w-2 h-2 bg-surface border-r border-b border-border rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </span>
  )
})
```

### 3-7. MessageBubble 확장 (`src/widgets/message-list/MessageBubble.tsx` 수정)

**변경 포인트:** `MarkdownSegment` 내에서 `[N]` 패턴을 `CitationBadge`로 변환

```typescript
// 추가 import
import { CitationBadge } from './CitationBadge'
import { parseCitations } from '@/shared/lib/citation-parser'
import type { CitationMeta, PdfChunk } from '@/shared/types'

// MessageBubbleProps 확장
interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  messageIndex?: number
  onFork?: (messageIndex: number) => void
  onOpenInCanvas?: (language: string, content: string) => void
  pdfChunks?: PdfChunk[]  // Citation 렌더링을 위한 청크 데이터
}

// MarkdownSegment에 citations prop 추가
const MarkdownSegment = memo(function MarkdownSegment({
  content,
  isStreaming,
  components,
  citations,
}: {
  content: string
  isStreaming: boolean
  components: Components
  citations?: CitationMeta[]
}) {
  // Citation이 있으면 [N] 패턴을 React 요소로 변환
  const processedContent = useMemo(() => {
    if (!citations || citations.length === 0 || isStreaming) return null

    const validIndices = new Set(citations.map((c) => c.index))
    const parts: Array<string | { type: 'citation'; meta: CitationMeta }> = []
    let lastIndex = 0

    const regex = /\[(\d+)\]/g
    let match: RegExpExecArray | null = null

    while ((match = regex.exec(content)) !== null) {
      const num = parseInt(match[1], 10)
      if (!validIndices.has(num)) continue

      // 매치 전 텍스트
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }
      // Citation 메타
      const meta = citations.find((c) => c.index === num)!
      parts.push({ type: 'citation', meta })
      lastIndex = match.index + match[0].length
    }

    // 나머지 텍스트
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : null
  }, [content, citations, isStreaming])

  // Citation이 있는 경우: 텍스트 + 배지 혼합 렌더링
  if (processedContent) {
    return (
      <div className="prose-chat text-text-primary text-sm leading-relaxed">
        {processedContent.map((part, i) => {
          if (typeof part === 'string') {
            return (
              <ReactMarkdown key={i} remarkPlugins={remarkPlugins} components={components}>
                {part}
              </ReactMarkdown>
            )
          }
          return <CitationBadge key={`cite-${part.meta.index}`} citation={part.meta} />
        })}
      </div>
    )
  }

  // 기존 렌더링 로직 (Citation 없을 때)
  const rendered = useMemo(() => {
    if (isStreaming) return null
    return (
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {content}
      </ReactMarkdown>
    )
  }, [content, isStreaming, components])

  return (
    <div className="prose-chat text-text-primary text-sm leading-relaxed">
      {isStreaming ? (
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
          {content}
        </ReactMarkdown>
      ) : rendered}
    </div>
  )
})
```

---

## 4. 세션 스토어 연동

### 4-1. Citation 메타를 메시지에 저장

`Message` 타입에 optional `citations` 필드 추가:

```typescript
// src/shared/types/index.ts — Message 확장
export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  segments: MessageSegment[]
  attachments?: ImageAttachment[]
  citations?: CitationMeta[]  // 추가
  createdAt: string
}
```

### 4-2. PromptInput에서 스트리밍 완료 후 Citation 파싱

```typescript
// handleSend() 스트리밍 완료 후 (PromptInput.tsx)
// 기존 artifact 감지 로직 아래에 추가

// Citation 파싱
if (pdfChunkedAttachment && fullText) {
  const citations = parseCitations(fullText, pdfChunkedAttachment.chunks)
  if (citations.length > 0) {
    updateLastMessage(sessionId, assistantMessageId, (msg) => ({
      ...msg,
      citations,
    }))
  }
}
```

### 4-3. MessageList에서 citations 전달

```typescript
// MessageList.tsx — MessageBubble에 citations 전달
<MessageBubble
  message={message}
  isStreaming={isStreaming && index === messages.length - 1}
  messageIndex={index}
  onFork={handleFork}
  onOpenInCanvas={handleOpenInCanvas}
  // message.citations가 있으면 자동으로 배지 렌더링
/>
```

MessageBubble 내부에서 `message.citations`를 `MarkdownSegment`에 전달.

---

## 5. 테스트 전략

### 5-1. 단위 테스트

| 파일 | 테스트 대상 | 케이스 |
|------|-----------|--------|
| `pdf-extractor.test.ts` | `smartChunk()` | 단락 분할, 문장 분할, 오버랩 크기 검증, 빈 페이지 처리 |
| `citation-prompt.test.ts` | `buildCitationPrompt()` | 청크 → 프롬프트 형식, MAX_CONTEXT 초과 처리, 빈 청크 |
| `citation-parser.test.ts` | `parseCitations()` | `[1]` 파싱, 중복 제거, 환각 번호 필터링, 연속 인용 `[1][2]` |
| `CitationBadge.test.tsx` | UI 렌더링 | 배지 표시, 클릭 시 팝업, 외부 클릭 닫기 |

### 5-2. 통합 테스트

```typescript
// 전체 파이프라인 테스트
test('PDF 업로드 → 스마트 청킹 → Citation 프롬프트 → 파싱 → 배지 렌더링', async () => {
  // 1. PDF 청킹
  const chunks = smartChunk([
    { page: 1, text: '매출은 100억원입니다.' },
    { page: 2, text: '영업이익률은 15%입니다.' },
  ])
  expect(chunks.length).toBeGreaterThan(0)
  expect(chunks[0].page).toBe(1)

  // 2. 프롬프트 빌드
  const prompt = buildCitationPrompt({ fileName: 'test.pdf', pageCount: 2, chunks, totalTextLength: 100 })
  expect(prompt).toContain('[chunk-1, Page 1]')
  expect(prompt).toContain('[N] 형식으로 표기')

  // 3. Citation 파싱
  const responseText = '매출은 100억원[1]이고 영업이익률은 15%[2]입니다.'
  const citations = parseCitations(responseText, chunks)
  expect(citations).toHaveLength(2)
  expect(citations[0].page).toBe(1)

  // 4. 환각 검증
  const hallucinated = parseCitations('없는 출처입니다[99]', chunks)
  expect(hallucinated).toHaveLength(0)
})
```

---

## 6. 구현 순서

```
Step 1 (0.5일) — 타입 정의 + 스마트 청킹
  ├── PdfChunk, PdfChunkedAttachment, CitationMeta 타입 추가
  ├── extractPdfChunked() 구현
  ├── smartChunk() + splitBySentences() 구현
  └── 단위 테스트 작성

Step 2 (0.5일) — Citation 프롬프트 빌더
  ├── buildCitationPrompt() 구현
  ├── rankChunksByQuery() 구현
  └── 단위 테스트 작성

Step 3 (0.5일) — Citation 파서
  ├── parseCitations() 구현
  ├── 환각 검증 로직
  └── 단위 테스트 작성

Step 4 (1일) — UI 연동
  ├── PromptInput handleFileUpload/handleSend 수정
  ├── CitationBadge 컴포넌트 구현
  ├── MessageBubble MarkdownSegment 확장
  ├── Message 타입에 citations 필드 추가
  └── UI 테스트 작성

Step 5 (0.5일) — 통합 테스트 + 마무리
  ├── 전체 파이프라인 통합 테스트
  ├── 엣지 케이스 (빈 PDF, 초대형 PDF, 한국어/영어 혼합)
  └── i18n 키 추가 (출처, Page 등)
```

**총 예상 공수: 3일**

---

## 7. 엣지 케이스 & 주의사항

| 케이스 | 대응 |
|--------|------|
| LLM이 `[1]`이 아닌 `(1)` 또는 `[출처1]` 형식 사용 | 시스템 프롬프트에 "반드시 [N] 대괄호 형식만 사용"  명시 |
| 존재하지 않는 청크 번호 인용 (환각) | `parseCitations()`에서 유효한 chunk ID만 매핑, 나머지 무시 |
| 스트리밍 중 `[N]` 실시간 렌더링 | 스트리밍 중에는 Citation 비활성 (완료 후 파싱) |
| PDF에 표가 포함된 경우 | 현재는 텍스트로 추출 (향후 Modal 백엔드에 PyMuPDF 추가 시 개선) |
| 청크 수가 매우 많은 대용량 PDF | `MAX_TOTAL_LENGTH` + `MAX_CONTEXT_CHARS`로 이중 제한 |
| 기존 `pdfAttachment` 사용하는 코드 | `extractPdfText()` 하위 호환 유지, 점진적 마이그레이션 |
| Citation 팝업이 화면 밖으로 넘침 | 팝업 위치를 `bottom-full` 대신 동적 계산 (Phase 2) |

---

## 8. 향후 확장 (Phase 2)

| 기능 | 설명 | 의존성 |
|------|------|--------|
| **서버 사이드 PyMuPDF** | Modal 백엔드에 표 추출 + 좌표 보존 엔드포인트 | Modal 백엔드 수정 |
| **PDF 뷰어 연동** | Citation 클릭 시 PDF 해당 페이지 이동 | react-pdf 또는 pdfjs-dist viewer |
| **쿼리 기반 RAG 청크 선택** | 사용자 질문과 관련도 높은 청크만 LLM에 전달 | embedding.ts 연동 |
| **Cross-encoder 리랭킹** | 청크-쿼리 쌍의 관련도 정밀 재순위화 | ONNX Web Worker |
| **Excel/CSV Citation** | 스프레드시트 분석에도 셀/시트 출처 인용 | spreadsheet-parser.ts 확장 |
