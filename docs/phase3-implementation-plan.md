# Phase 3: 문서 작성 마법사 + OCR — 상세 구현 계획

> 예상 공수: 3일 | 복잡도: 높음 | 임팩트: 중간

---

## 1. 개요

**문서 작성 마법사**: 5단계 스텝퍼 UI로 AI 기반 문서 초안을 작성하는 워크플로우.
**OCR 텍스트 추출**: tesseract.js를 사용한 클라이언트 사이드 이미지 → 텍스트 변환.

Phase 2에서 추가된 HeaderTabs의 `docWriter`/`ocr` 뷰와 연결된다.

---

## 2. 작업 3-1: 문서 작성 마법사 (2일)

### 목표
프로젝트 설정 → 배경지식 → 목차 생성 → 내용 작성 → 다운로드의 5단계 워크플로우로 AI 문서 초안을 생성한다.

### UI 와이어프레임

```
┌──────────────────────────────────────────┐
│ 문서 작성 마법사                           │
│ "AI가 문서 초안을 작성합니다"               │
├──────────────────────────────────────────┤
│ ① 설정 → ② 배경 → ③ 목차 → ④ 작성 → ⑤ 완료 │
│ ───●────────○────────○────────○────────○──│
├──────────────────────────────────────────┤
│                                          │
│  [현재 단계 컨텐츠]                       │
│                                          │
├──────────────────────────────────────────┤
│ [← 이전]                       [다음 →] │
└──────────────────────────────────────────┘
```

### 5단계 상세

#### Step 1: 프로젝트 설정
```
프로젝트명: [                    ]
문서 종류:
  ○ 보고서 (Report)
  ○ 기획서 (Proposal)
  ○ 제안서 (Presentation)
  ○ 매뉴얼 (Manual)
모델 선택: [Claude Sonnet 4.6 ▾]
```

#### Step 2: 배경지식 제공
```
배경 자료를 입력하세요:
┌─────────────────────────────┐
│ 텍스트를 입력하거나          │
│ 파일을 첨부하세요 (PDF/TXT) │
│                             │
│                             │
└─────────────────────────────┘
📎 파일 첨부 (선택)
```

#### Step 3: 목차 생성
```
[AI 목차 생성] 버튼 → LLM 호출

생성된 목차:
1. 서론
   1.1 목적
   1.2 범위
2. 현황 분석
   2.1 시장 현황
   ...

각 항목 [편집] [삭제] [추가] 가능
```

#### Step 4: 내용 작성
```
섹션 선택: [1. 서론 ▾]

AI 초안:
┌─────────────────────────────┐
│ [생성된 텍스트...]           │
│                             │
│ 직접 편집 가능               │
└─────────────────────────────┘

[이 섹션 재생성] [다음 섹션]
```

#### Step 5: 파일 다운로드
```
문서 미리보기:
┌─────────────────────────────┐
│ # 보고서 제목                │
│ ## 1. 서론                   │
│ ...                         │
└─────────────────────────────┘

[📄 Markdown 다운로드] [📄 TXT 다운로드]
```

### 신규 파일

#### 2-1. `src/entities/doc-writer/doc-writer.store.ts`

```typescript
import { create } from 'zustand'

type DocType = 'report' | 'proposal' | 'presentation' | 'manual'

interface OutlineSection {
  id: string
  level: number         // 1, 2, 3
  title: string
  content?: string      // 작성된 내용
}

interface DocProject {
  id: string
  name: string
  type: DocType
  modelId: string
  context: string       // 배경지식 텍스트
  outline: OutlineSection[]
  createdAt: number
  updatedAt: number
}

interface DocWriterState {
  // 현재 프로젝트
  currentProject: DocProject | null
  step: number          // 1-5

  // 프로젝트 관리
  projects: DocProject[]
  hydrated: boolean

  // 액션
  hydrate: () => Promise<void>
  createProject: (name: string, type: DocType, modelId: string) => string
  setContext: (context: string) => void
  generateOutline: () => Promise<void>
  updateOutlineSection: (id: string, patch: Partial<OutlineSection>) => void
  addOutlineSection: (parentId: string | null, title: string, level: number) => void
  removeOutlineSection: (id: string) => void
  generateSectionContent: (sectionId: string) => Promise<void>
  updateSectionContent: (sectionId: string, content: string) => void
  exportMarkdown: () => string
  exportText: () => string
  setStep: (step: number) => void
  deleteProject: (id: string) => void
  selectProject: (id: string) => void
}
```

**핵심 로직**:

1. `generateOutline()`:
   - 프로바이더 팩토리로 LLM 호출
   - 시스템 프롬프트: "Generate a detailed outline for a {type} about '{name}'. Context: {context}. Return as JSON array of {id, level, title}."
   - JSON 파싱 → `outline` 상태 업데이트

2. `generateSectionContent(sectionId)`:
   - 해당 섹션의 `title` + 전체 `outline` + `context` 전달
   - 시스템 프롬프트: "Write section '{title}' for a {type}. Outline: {outline}. Context: {context}."
   - 스트리밍 응답 → `content` 업데이트

3. `exportMarkdown()`:
   - 목차를 Markdown 헤더로 변환 (`#`, `##`, `###`)
   - 각 섹션 내용 결합

#### 2-2. `src/pages/doc-writer/DocWriterPage.tsx` (~400줄)

```
컴포넌트 구조:
DocWriterPage
├── StepIndicator (5단계 진행 표시)
├── Step1ProjectSetup
│   ├── TextInput (프로젝트명)
│   ├── DocTypeSelector (4종 라디오)
│   └── ModelSelector (기존 모델 드롭다운 재사용)
├── Step2Context
│   ├── Textarea (배경지식 입력)
│   └── FileAttach (PDF/TXT 파일 첨부)
├── Step3Outline
│   ├── GenerateButton (AI 목차 생성)
│   └── OutlineEditor (트리 구조 편집)
├── Step4Content
│   ├── SectionSelector (드롭다운)
│   ├── ContentEditor (텍스트 편집기)
│   └── RegenerateButton (섹션 재생성)
├── Step5Export
│   ├── MarkdownPreview (미리보기)
│   └── DownloadButtons (MD/TXT)
└── StepNavigation (이전/다음 버튼)
```

**StepIndicator 컴포넌트**:
- 5개 원형 스텝 + 연결선
- 완료: 초록색 체크, 현재: 파란색 활성, 미래: 회색
- 각 스텝 라벨 표시

### Dexie 테이블

```typescript
// src/shared/lib/db.ts 에 추가
docProjects: '&id, name, type, createdAt'
```

### i18n 키 (~25개)

```typescript
'docWriter.title': '문서 작성 마법사',
'docWriter.desc': 'AI가 문서 초안을 작성합니다',
'docWriter.step1': '프로젝트 설정',
'docWriter.step2': '배경지식',
'docWriter.step3': '목차 생성',
'docWriter.step4': '내용 작성',
'docWriter.step5': '완료',
'docWriter.projectName': '프로젝트명',
'docWriter.docType': '문서 종류',
'docWriter.docType.report': '보고서',
'docWriter.docType.proposal': '기획서',
'docWriter.docType.presentation': '제안서',
'docWriter.docType.manual': '매뉴얼',
'docWriter.context': '배경지식을 입력하세요',
'docWriter.context.fileHint': '또는 PDF/TXT 파일을 첨부하세요',
'docWriter.generateOutline': 'AI 목차 생성',
'docWriter.regenerateOutline': '목차 재생성',
'docWriter.addSection': '섹션 추가',
'docWriter.generateContent': '이 섹션 AI 작성',
'docWriter.regenerateContent': '재생성',
'docWriter.selectSection': '섹션 선택',
'docWriter.preview': '미리보기',
'docWriter.downloadMd': 'Markdown 다운로드',
'docWriter.downloadTxt': 'TXT 다운로드',
'docWriter.prev': '이전',
'docWriter.next': '다음',
```

---

## 3. 작업 3-2: OCR 텍스트 추출 (1일)

### 목표
이미지 업로드 → tesseract.js 클라이언트 OCR → 배치 처리 → 결과 다운로드.

### UI 와이어프레임

```
┌──────────────────────────────────────────┐
│ 텍스트 추출 (OCR)                         │
│ "이미지에서 글자를 자동으로 탐지합니다"     │
├──────────────────────────────────────────┤
│ ① 이미지 업로드       ② 추출 결과         │
├──────────────────────────────────────────┤
│ 인식 언어: [한국어+영어 ▾]                │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ 📸 이미지를 드래그하거나 클릭하세요 │   │
│ │    PNG, JPG, BMP (최대 20개)       │   │
│ └────────────────────────────────────┘   │
│                          [추출 시작]     │
├──────────────────────────────────────────┤
│ 파일명         | 상태    | 진행률 | 액션  │
│ screenshot.png | 완료    | ████ 100% | 📋 │
│ doc-scan.jpg   | 추출 중 | ██▓░ 45%  | -  │
├──────────────────────────────────────────┤
│ 전체 결과:                               │
│ ┌────────────────────────────────────┐   │
│ │ [추출된 텍스트...]                  │   │
│ └────────────────────────────────────┘   │
│ [📋 전체 복사] [📄 TXT 다운로드]         │
└──────────────────────────────────────────┘
```

### 신규 파일

#### 3-1. `src/shared/lib/ocr.ts`

```typescript
import { createWorker, Worker } from 'tesseract.js'

let worker: Worker | null = null

export async function initOcrWorker(langs: string = 'kor+eng'): Promise<void> {
  if (worker) return
  worker = await createWorker(langs, undefined, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js',
  })
}

export async function recognizeImage(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!worker) await initOcrWorker()
  const result = await worker!.recognize(imageFile, {}, {
    progress: (p) => onProgress?.(Math.round(p.progress * 100))
  })
  return result.data.text
}

export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}

// 배치 처리
export async function recognizeBatch(
  files: File[],
  onFileProgress: (fileIndex: number, progress: number) => void,
  onFileComplete: (fileIndex: number, text: string) => void
): Promise<string[]> {
  const results: string[] = []
  for (let i = 0; i < files.length; i++) {
    const text = await recognizeImage(files[i], (p) => onFileProgress(i, p))
    results.push(text)
    onFileComplete(i, text)
  }
  return results
}
```

**기술 결정**:
- `tesseract.js` v5 — 클라이언트 전용, 100+ 언어
- CDN worker + WASM — 번들 크기 최소화 (npm 패키지는 타입만)
- SIMD LSTM 코어 — 최고 정확도
- 순차 처리 (병렬 시 메모리 초과 위험)

#### 3-2. `src/pages/ocr/OcrPage.tsx` (~250줄)

```
컴포넌트 구조:
OcrPage
├── OcrHeader (제목, 설명)
├── LanguageSelector (인식 언어 선택)
├── ImageDropzone (드래그앤드롭 + 클릭, 이미지 썸네일 미리보기)
├── OcrFileList (파일별 상태 + 진행률)
├── OcrResultView (추출된 텍스트, 편집 가능)
└── ActionButtons (전체 복사, TXT 다운로드)
```

**지원 언어**:
| 코드 | 표시명 |
|------|--------|
| `kor+eng` | 한국어 + 영어 (기본) |
| `eng` | 영어 |
| `jpn+eng` | 일본어 + 영어 |
| `chi_sim+eng` | 중국어(간체) + 영어 |

### 패키지 설치

```bash
npm install tesseract.js
```

- `tesseract.js` v5: ~200KB (타입 + 로더)
- WASM 코어: CDN에서 동적 로드 (~15MB, 캐시됨)

### i18n 키 (~15개)

```typescript
'ocr.title': '텍스트 추출 (OCR)',
'ocr.desc': '이미지에서 글자를 자동으로 탐지합니다',
'ocr.language': '인식 언어',
'ocr.dropzone': '이미지를 드래그하거나 클릭하세요',
'ocr.dropzone.hint': 'PNG, JPG, BMP (최대 20개)',
'ocr.start': '추출 시작',
'ocr.status.pending': '대기',
'ocr.status.processing': '추출 중',
'ocr.status.done': '완료',
'ocr.status.error': '오류',
'ocr.result': '추출 결과',
'ocr.copyAll': '전체 복사',
'ocr.downloadTxt': 'TXT 다운로드',
'ocr.noResult': '추출 결과가 없습니다',
'ocr.loading': 'OCR 엔진 로딩 중...',
```

---

## 4. 수정 파일 요약

| 구분 | 파일 | 변경 내용 |
|------|------|-----------|
| 신규 | `src/pages/doc-writer/DocWriterPage.tsx` | 문서 작성 마법사 (~400줄) |
| 신규 | `src/entities/doc-writer/doc-writer.store.ts` | 문서 작성 상태 관리 (~200줄) |
| 신규 | `src/pages/ocr/OcrPage.tsx` | OCR 페이지 (~250줄) |
| 신규 | `src/shared/lib/ocr.ts` | tesseract.js 래퍼 (~80줄) |
| 수정 | `src/shared/lib/db.ts` | `docProjects` 테이블 추가 |
| 수정 | `src/shared/i18n/ko.ts` | ~40개 키 추가 |
| 수정 | `src/shared/i18n/en.ts` | ~40개 키 추가 |
| 설치 | `tesseract.js` | npm install |

---

## 5. 기술 결정

| 항목 | 선택 | 대안 | 이유 |
|------|------|------|------|
| OCR 엔진 | tesseract.js v5 (CDN) | 백엔드 OCR | 클라이언트 전용, 서버 비용 없음 |
| WASM 로딩 | CDN (jsdelivr) | 셀프 호스팅 | 캐시 효율, CDN 속도 |
| 문서 편집기 | textarea + markdown | WYSIWYG (Tiptap) | 복잡도 최소화, 추후 확장 가능 |
| 문서 저장 | IndexedDB (Dexie) | localStorage | 대용량 문서 지원 |
| 내보내기 형식 | MD + TXT | + DOCX | DOCX 생성 복잡도 높아 추후 고려 |
| 배치 OCR | 순차 처리 | Web Worker 병렬 | 메모리 안전성 우선 |

---

## 6. 위험 요소 & 완화

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| tesseract.js WASM 15MB 초기 로딩 | UX 저하 | CDN 캐시 + "엔진 로딩 중" 스피너 |
| 한국어 OCR 정확도 (80-90%) | 결과 품질 | `kor+eng` 조합 + 결과 편집 UI |
| 5단계 마법사 UX 복잡도 | 이탈률 | 각 단계 자동 저장 + "이전" 복귀 |
| LLM 목차 생성 JSON 파싱 실패 | 기능 오류 | JSON 파싱 에러 핸들링 + 재시도 |
| 대용량 이미지 처리 | 메모리 부족 | 파일당 10MB 제한, 최대 20개 |

---

## 7. 테스트 계획

| 테스트 | 범위 | 도구 |
|--------|------|------|
| doc-writer.store.test.ts | 프로젝트 CRUD, 단계 전이, 목차 CRUD | Vitest |
| ocr.test.ts | OCR 래퍼 함수, 워커 초기화/종료 | Vitest (mock worker) |
| DocWriterPage.test.tsx | 5단계 네비게이션, 렌더링 | RTL |
| OcrPage.test.tsx | 파일 업로드, 결과 표시 | RTL |
| E2E: doc-writer flow | 전체 5단계 흐름 | Playwright |

---

## 8. 의존성

- **Phase 2 선행 필수**: ViewState 확장 (`translate`, `docWriter`, `ocr`), MainLayout 라우팅, HeaderTabs
- `doc-writer.store.ts`의 LLM 호출 → 기존 `ProviderFactory` 재사용
- `ocr.ts`의 파일 처리 → Web File API (브라우저 내장)
- Dexie DB 스키마 확장 → `docProjects` 테이블 추가 (마이그레이션 주의)
