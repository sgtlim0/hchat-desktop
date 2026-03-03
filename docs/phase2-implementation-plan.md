# Phase 2: 헤더 도구 탭 + 문서 번역 워크플로우 — 상세 구현 계획

> ✅ **완료** (2026-03-03) | 예상 공수: 3일 | 복잡도: 중간 | 임팩트: 높음

---

## 1. 개요

ChatGPT/H Chat의 "도구 탭" 패턴을 참고하여, 상단 탭 바로 주요 기능(업무 비서, 문서 번역, 문서 작성, OCR)을 빠르게 전환하는 UX를 추가한다. 동시에 **문서 번역 워크플로우**를 구현하여 파일 업로드 → 엔진 선택 → 배치 번역 → 결과 다운로드까지의 완전한 흐름을 제공한다.

---

## 2. 작업 2-1: 헤더 도구 탭 (0.5일)

### 목표
상단에 탭 바를 추가하여 주요 도구 화면으로 빠르게 전환한다.

### 탭 구성

| 탭 ID | 라벨 (ko) | 라벨 (en) | 이동 뷰 | 아이콘 |
|--------|-----------|-----------|---------|--------|
| `chat` | 업무 비서 | Assistant | `home` | MessageSquare |
| `translate` | 문서 번역 | Translate | `translate` | Languages |
| `docWriter` | 문서 작성 | Doc Writer | `docWriter` | FileText |
| `ocr` | 텍스트 추출 | OCR | `ocr` | ScanText |

### 수정 파일

#### 2-1-1. `src/shared/types/index.ts`

```typescript
// Before
export type ViewState = 'home' | 'chat' | 'settings' | 'allChats' | 'projects' | 'projectDetail' | 'quickChat' | 'memory' | 'agentSwarm' | 'schedule' | 'groupChat' | 'promptLibrary' | 'debate' | 'aiTools' | 'imageGen' | 'agent'

// After — 3개 추가
export type ViewState = 'home' | 'chat' | 'settings' | 'allChats' | 'projects' | 'projectDetail' | 'quickChat' | 'memory' | 'agentSwarm' | 'schedule' | 'groupChat' | 'promptLibrary' | 'debate' | 'aiTools' | 'imageGen' | 'agent' | 'translate' | 'docWriter' | 'ocr'
```

#### 2-1-2. `src/widgets/header-tabs/HeaderTabs.tsx` (신규)

```typescript
interface HeaderTab {
  id: string
  labelKey: string
  icon: string      // lucide icon name
  view: ViewState
}

const HEADER_TABS: HeaderTab[] = [
  { id: 'chat', labelKey: 'headerTab.assistant', icon: 'MessageSquare', view: 'home' },
  { id: 'translate', labelKey: 'headerTab.translate', icon: 'Languages', view: 'translate' },
  { id: 'docWriter', labelKey: 'headerTab.docWriter', icon: 'FileText', view: 'docWriter' },
  { id: 'ocr', labelKey: 'headerTab.ocr', icon: 'ScanText', view: 'ocr' },
]
```

- 현재 `view` 값에 따라 활성 탭 하이라이트
- 탭 클릭 → `sessionStore.setView(tab.view)`
- 모바일: 수평 스크롤, 활성 탭 자동 스크롤

#### 2-1-3. `src/app/layouts/MainLayout.tsx` (수정)

- `HeaderTabs` 컴포넌트를 `Sidebar`와 콘텐츠 영역 사이에 배치
- `renderContent()`에 `translate`, `docWriter`, `ocr` 케이스 추가
- 3개 신규 페이지 lazy import 추가

```typescript
const TranslatePage = lazy(() => import('@/pages/translate/TranslatePage').then((m) => ({ default: m.TranslatePage })))
const DocWriterPage = lazy(() => import('@/pages/doc-writer/DocWriterPage').then((m) => ({ default: m.DocWriterPage })))
const OcrPage = lazy(() => import('@/pages/ocr/OcrPage').then((m) => ({ default: m.OcrPage })))

// renderContent() 내
case 'translate': return <TranslatePage />
case 'docWriter': return <DocWriterPage />
case 'ocr': return <OcrPage />
```

### 사이드바 연동

`Sidebar.tsx`에 "도구" 섹션 추가:
```
── 도구 ──
📖 문서 번역
📝 문서 작성
🔍 텍스트 추출
```

---

## 3. 작업 2-2: 문서 번역 워크플로우 (2.5일)

### 목표
파일 업로드 → 텍스트 추출 → LLM/브라우저 번역 → 결과 다운로드의 완전한 파이프라인을 구현한다.

### UI 와이어프레임

```
┌──────────────────────────────────────────┐
│ 문서 번역                                 │
│ "디자인/형식 유지하면서 번역합니다"        │
│ 지원: PDF, TXT, MD                        │
├──────────────────────────────────────────┤
│ ① 번역 시작          ② 번역 결과          │
├──────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐          │
│ │ 🔤 LLM 번역  │ │ 🌐 브라우저  │          │
│ │ · 고품질      │ │ · 빠른 속도  │          │
│ │ · 맥락 이해   │ │ · 무료       │          │
│ └─────────────┘ └─────────────┘          │
├──────────────────────────────────────────┤
│ 원본: [자동 감지 ▾]  대상: [한국어 ▾]     │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ 📄 파일을 드래그하거나 클릭하세요   │   │
│ │    PDF, TXT, MD (최대 10MB)        │   │
│ └────────────────────────────────────┘   │
│                            [번역 시작]   │
├──────────────────────────────────────────┤
│ 파일명      | 상태     | 진행률 | 액션   │
│ report.pdf  | 번역 중  | ██▓░ 65% | -   │
│ memo.txt    | 완료     | ████ 100% | ⬇  │
└──────────────────────────────────────────┘
```

### 신규 파일

#### 3-1. `src/entities/translate/translate.store.ts`

```typescript
import { create } from 'zustand'

type TranslateEngine = 'llm' | 'browser'
type TranslateFileStatus = 'pending' | 'extracting' | 'translating' | 'done' | 'error'

interface TranslateFile {
  id: string
  name: string
  size: number
  type: string                  // mime type
  status: TranslateFileStatus
  progress: number              // 0-100
  originalText?: string
  translatedText?: string
  error?: string
}

interface TranslateState {
  engine: TranslateEngine
  sourceLang: string            // 'auto' | 'ko' | 'en' | 'ja' | 'zh' ...
  targetLang: string
  files: TranslateFile[]
  isProcessing: boolean

  setEngine: (engine: TranslateEngine) => void
  setSourceLang: (lang: string) => void
  setTargetLang: (lang: string) => void
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
  updateFile: (id: string, patch: Partial<TranslateFile>) => void
  startTranslation: () => Promise<void>
  clearAll: () => void
}
```

**핵심 로직**:
1. `addFiles()` — File 객체 → TranslateFile 변환, ID 부여
2. `startTranslation()` — 순차 처리:
   - 각 파일 `status: 'extracting'` → 텍스트 추출
   - `status: 'translating'` → 청크 분할 → LLM/브라우저 번역
   - `status: 'done'` → 완료
3. 진행률: 전체 청크 수 대비 완료 청크 수로 계산

#### 3-2. `src/shared/lib/translate.ts`

```typescript
// 텍스트 추출
async function extractText(file: File): Promise<string>
  // PDF → pdfjs-dist (기존 pdf-extractor 재사용)
  // TXT/MD → FileReader.readAsText()

// LLM 번역
async function translateWithLLM(
  text: string,
  sourceLang: string,
  targetLang: string,
  modelId: string,
  onProgress: (chunk: string) => void
): Promise<string>
  // 청크 분할 (2000자 단위)
  // 기존 provider factory 활용
  // 시스템 프롬프트: "Translate the following text from {source} to {target}. Preserve formatting."

// 브라우저 번역 (Web Translation API 또는 fallback)
async function translateWithBrowser(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string>
  // Chrome Translation API (navigator.translations) 사용
  // 미지원 브라우저: LLM 폴백
```

**청크 분할 전략**:
- 2000자 단위 (문장 경계 존중)
- 각 청크에 "이전 맥락" 100자 포함 (번역 일관성)
- 진행률: `completedChunks / totalChunks * 100`

#### 3-3. `src/pages/translate/TranslatePage.tsx`

```
컴포넌트 구조:
TranslatePage
├── TranslateHeader (제목, 설명, 지원 포맷)
├── TranslateEngineSelector (LLM/브라우저 카드 선택)
├── LanguageSelector (원본/대상 언어 드롭다운)
├── FileDropzone (드래그앤드롭 + 클릭 업로드)
├── TranslateFileList (파일 목록 + 진행률 + 다운로드)
└── TranslateResultView (② 탭: 번역 결과 미리보기)
```

- `FileDropzone`: `onDragOver`, `onDrop`, `<input type="file" multiple accept=".pdf,.txt,.md">`
- `TranslateFileList`: 상태별 색상 뱃지, 진행률 바, 다운로드 버튼
- `TranslateResultView`: 원본/번역본 좌우 비교 (splitView)

### 지원 언어

| 코드 | 언어 |
|------|------|
| `auto` | 자동 감지 |
| `ko` | 한국어 |
| `en` | 영어 |
| `ja` | 일본어 |
| `zh` | 중국어 |
| `es` | 스페인어 |
| `fr` | 프랑스어 |
| `de` | 독일어 |

### i18n 키 (~30개)

```typescript
// ko.ts
'translate.title': '문서 번역',
'translate.desc': '디자인/형식 유지하면서 번역합니다',
'translate.supported': '지원: PDF, TXT, MD',
'translate.engine.llm': 'LLM 번역',
'translate.engine.llm.desc': '고품질, 맥락 이해',
'translate.engine.browser': '브라우저 번역',
'translate.engine.browser.desc': '빠른 속도, 무료',
'translate.source': '원본 언어',
'translate.target': '대상 언어',
'translate.auto': '자동 감지',
'translate.dropzone': '파일을 드래그하거나 클릭하세요',
'translate.dropzone.hint': 'PDF, TXT, MD (최대 10MB)',
'translate.start': '번역 시작',
'translate.status.pending': '대기',
'translate.status.extracting': '텍스트 추출 중',
'translate.status.translating': '번역 중',
'translate.status.done': '완료',
'translate.status.error': '오류',
'translate.download': '다운로드',
'translate.clear': '전체 삭제',
'translate.result': '번역 결과',
'translate.original': '원본',
'translate.translated': '번역본',
// ... (en.ts 동일 구조)
```

---

## 4. 수정 파일 요약

| 구분 | 파일 | 변경 내용 |
|------|------|-----------|
| 신규 | `src/widgets/header-tabs/HeaderTabs.tsx` | 도구 탭 바 컴포넌트 |
| 신규 | `src/pages/translate/TranslatePage.tsx` | 문서 번역 페이지 (~300줄) |
| 신규 | `src/entities/translate/translate.store.ts` | 번역 상태 관리 (~150줄) |
| 신규 | `src/shared/lib/translate.ts` | 텍스트 추출 + 번역 로직 (~200줄) |
| 수정 | `src/shared/types/index.ts` | ViewState에 3개 뷰 추가 |
| 수정 | `src/app/layouts/MainLayout.tsx` | HeaderTabs 배치, 3개 뷰 라우팅 |
| 수정 | `src/widgets/sidebar/Sidebar.tsx` | "도구" 섹션 추가 |
| 수정 | `src/shared/i18n/ko.ts` | ~30개 키 추가 |
| 수정 | `src/shared/i18n/en.ts` | ~30개 키 추가 |

---

## 5. 기술 결정

| 항목 | 선택 | 대안 | 이유 |
|------|------|------|------|
| 번역 엔진 | LLM API (기존 프로바이더) | Google Translate API | 별도 API 키 불필요, 인프라 재사용 |
| 브라우저 번역 | Chrome Translation API | 없음 | 무료, 빠름, Chrome 한정 (폴백: LLM) |
| 텍스트 추출 | pdfjs-dist (기존) | pdf-parse | 이미 설치됨, PDF 채팅에서 검증됨 |
| 청크 크기 | 2000자 | 1000/4000자 | 맥락 유지 + API 토큰 한도 균형 |
| 파일 크기 제한 | 10MB | 50MB | 클라이언트 메모리 보호 |

---

## 6. 위험 요소 & 완화

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| LLM 번역 품질 불안정 | 사용자 불만 | 청크 간 맥락 전달 + 재시도 로직 |
| PDF 텍스트 추출 순서 | 레이아웃 깨짐 | 페이지 단위 추출, 순서 보장 |
| 대용량 파일 메모리 부족 | 브라우저 크래시 | 10MB 제한 + 스트리밍 처리 |
| 브라우저 번역 API 미지원 | 기능 사용 불가 | LLM 폴백, 미지원 알림 |

---

## 7. 테스트 계획

| 테스트 | 범위 | 도구 |
|--------|------|------|
| translate.store.test.ts | 스토어 CRUD, 상태 전이 | Vitest |
| translate.test.ts | 텍스트 추출, 청크 분할 | Vitest |
| TranslatePage.test.tsx | UI 렌더링, 파일 업로드 | RTL |
| E2E: translate flow | 전체 번역 흐름 | Playwright |

---

## 8. 의존성

- Phase 3의 `DocWriterPage`, `OcrPage`는 Phase 2의 ViewState 확장 + HeaderTabs에 의존
- `translate.ts`의 PDF 추출은 기존 `src/shared/lib/pdf-extractor.ts` 재사용
- 기존 provider factory (`shared/lib/providers/factory.ts`) 재사용
