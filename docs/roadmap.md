# H Chat PWA — 로드맵

> 최종 업데이트: 2026-03-03

---

## 1. 완료된 작업 (2026-03-03)

### 주요 성과

| 항목 | 상태 | 비고 |
|------|------|------|
| **리브랜딩 (H Chat)** | ✅ 완료 | 모든 문서, 파일명, UI 텍스트 일괄 변경 |
| **Phase 1: 비서 마켓플레이스** | ✅ 완료 | HomeScreen 리팩토링, 8개 공식 비서 카드 그리드 |
| **카테고리 필터** | ✅ 완료 | 전체/채팅/업무/번역/정리/보고/그림/글쓰기 8개 |
| **공식/내비서 탭** | ✅ 완료 | 기존 페르소나 시스템 연결 |
| **버그 수정** | ✅ 완료 | 스트리밍 커서 더블 깜박임 해결 |
| **테스트 수정** | ✅ 완료 | debate store vi import 이슈 해결 |

### 구현 파일

```
수정: src/pages/home/HomeScreen.tsx      (비서 마켓플레이스 UI)
신규: src/shared/constants/assistants.ts (8개 비서 프리셋)
신규: src/shared/ui/AssistantCard.tsx    (비서 카드 컴포넌트)
수정: src/shared/i18n/ko.ts, en.ts       (i18n 키 28개 추가)
수정: src/widgets/message-list/MessageBubble.tsx (커서 버그 수정)
```

### 비서 프리셋 (8개)

| ID | 비서명 | 모델 | 프로바이더 | 카테고리 |
|----|--------|------|-----------|----------|
| analyst | 신중한 분석가 | Claude Sonnet 4.6 | Bedrock | 분석 |
| quickChat | 빠른 대화 | Gemini 2.0 Flash | Gemini | 대화 |
| docReview | 문서 검토 | Claude Sonnet 4.6 | Bedrock | 업무 |
| translator | 문서 번역 | GPT-4o | OpenAI | 번역 |
| reportWriter | 보고서 작성 | Claude Sonnet 4.6 | Bedrock | 보고 |
| codeReviewer | 코드 리뷰 | Claude Sonnet 4.6 | Bedrock | 업무 |
| dataAnalyst | 데이터 분석 | GPT-4o | OpenAI | 분석 |
| emailWriter | 이메일 작성 | GPT-4o-mini | OpenAI | 글쓰기 |

---

## 2. 향후 작업 (Phases 2-4)

### Phase 2: 헤더 도구 탭 + 문서 번역 워크플로우 (3일)

#### 2-1. 헤더 도구 탭 (0.5일)

**목표**: 상단 탭 바로 주요 도구 빠른 전환

```
수정: src/app/layouts/MainLayout.tsx
수정: src/shared/types/index.ts (ViewState 확장)
```

**탭 구성**:
- 업무 비서 (chat) — 기본 대화
- 문서 번역 (translate) — 파일 번역
- 문서 작성 (doc-write) — 마법사
- 텍스트 추출 (ocr) — OCR

#### 2-2. 문서 번역 워크플로우 (2.5일)

**목표**: 파일 업로드 → 엔진 선택 → 배치 번역 → 결과 다운로드

```
신규: src/pages/translate/TranslatePage.tsx
신규: src/entities/translate/translate.store.ts
신규: src/shared/lib/translate.ts
수정: src/shared/i18n/ko.ts, en.ts
```

**UI 구조**:
```
┌──────────────────────────────────────┐
│ 문서 번역 도구                        │
│ "디자인/형식 유지하면서 번역..."      │
│ 지원: PDF, DOCX, PPTX, XLSX          │
├──────────────────────────────────────┤
│ ① 번역 시작 → ② 번역 결과            │
├──────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐         │
│ │ 🔤 LLM    │ │ 🌐 브라우저│         │
│ │ · 고품질   │ │ · 빠른 속도│         │
│ └───────────┘ └───────────┘         │
├──────────────────────────────────────┤
│ 원본: [자동 ▾]  대상: [한국어 ▾]     │
├──────────────────────────────────────┤
│ 📄 파일 업로드 (드래그/클릭)          │
│                     [번역 시작]      │
├──────────────────────────────────────┤
│ 파일명 | 상태 | 진행률 | 다운로드    │
└──────────────────────────────────────┘
```

**기술 스택**:
- LLM 번역: 기존 프로바이더 재사용
- 텍스트 추출: pdf-extractor (기존)
- 진행률: 청크별 완료 퍼센트

**스토어 구조**:
```typescript
interface TranslateState {
  engine: 'llm' | 'browser'
  sourceLang: string
  targetLang: string
  files: TranslateFile[]
  isProcessing: boolean
}

interface TranslateFile {
  id: string
  name: string
  status: 'pending' | 'extracting' | 'translating' | 'done' | 'error'
  progress: number  // 0-100
  originalText?: string
  translatedText?: string
}
```

---

### Phase 3: 문서 작성 마법사 + OCR (3일)

#### 3-1. 문서 작성 마법사 (2일)

**목표**: 5단계 스텝퍼로 AI 문서 초안 작성

```
신규: src/pages/doc-writer/DocWriterPage.tsx
신규: src/entities/doc-writer/doc-writer.store.ts
수정: src/shared/i18n/ko.ts, en.ts
```

**5단계 플로우**:

| 단계 | 내용 | 사용자 액션 |
|------|------|-------------|
| 1. 프로젝트 설정 | 프로젝트명, 문서 종류 | 입력 |
| 2. 배경지식 제공 | 컨텍스트 텍스트/파일 | 업로드 |
| 3. 목차 생성 | AI 목차 초안 생성 | 편집 |
| 4. 내용 작성 | 섹션별 AI 초안 | 편집 |
| 5. 파일 다운로드 | MD/TXT 내보내기 | 다운로드 |

**문서 종류**:
- 보고서 (Report)
- 기획서 (Proposal)
- 제안서 (Presentation)
- 매뉴얼 (Manual)

**스토어 구조**:
```typescript
interface DocProject {
  id: string
  name: string
  type: 'report' | 'proposal' | 'presentation' | 'manual'
  context: string
  outline: OutlineSection[]
  content: Record<string, string>  // sectionId → text
  createdAt: number
}

interface OutlineSection {
  id: string
  level: number  // 1, 2, 3
  title: string
  children?: OutlineSection[]
}
```

#### 3-2. OCR 텍스트 추출 (1일)

**목표**: 이미지 → 텍스트, 배치 처리, 결과 다운로드

```
신규: src/pages/ocr/OcrPage.tsx
신규: src/shared/lib/ocr.ts
설치: tesseract.js
```

**UI 구조**:
```
┌────────────────────────────────────┐
│ 텍스트 추출 (OCR)                   │
│ "이미지에서 글자 자동 탐지"          │
├────────────────────────────────────┤
│ ① 이미지 업로드 → ② 추출 결과      │
├────────────────────────────────────┤
│ 📸 이미지 업로드 (최대 20개)        │
│    드래그 앤 드롭 또는 클릭         │
│                      [추출 시작]   │
├────────────────────────────────────┤
│ 파일명 | 상태 | 진행률 | 다운로드   │
└────────────────────────────────────┘
```

**기술 결정**:
- tesseract.js (클라이언트 OCR, 100+ 언어)
- dynamic import + CDN worker (번들 크기 최적화)
- 배치 처리 (Promise.allSettled)

**위험 요소**:
- wasm 번들 크기 (15MB) → CDN worker로 완화
- 한국어 정확도 → 한국어 학습 데이터 + 후처리

---

### Phase 4: 기능별 사용량 + 마무리 (1일)

#### 4-1. 사용량 추적 확장 (0.5일)

**목표**: 기능별 사용량 분리 추적

```
수정: src/entities/usage/usage.store.ts
수정: src/pages/settings/SettingsScreen.tsx
```

**UsageCategory 확장**:
```typescript
type UsageCategory =
  | 'chat'           // 기본 대화
  | 'translate'      // 문서 번역
  | 'doc-write'      // 문서 작성
  | 'ocr'            // OCR
  | 'image-gen'      // 이미지 생성
  | 'data-analysis'  // 데이터 분석
```

**UI 변경**:
- 설정 > 사용량 탭에 카테고리 필터 추가
- 기능별 비용/토큰 차트

#### 4-2. 문서화 + 테스트 (0.5일)

- i18n 키 검증 (누락 확인)
- Phase 2-3 유닛 테스트 추가
- CLAUDE.md 업데이트

---

## 3. 파일 변경 요약

| Phase | 신규 파일 | 수정 파일 | 설치 |
|-------|-----------|-----------|------|
| Phase 2 | 3 | 3 | - |
| Phase 3 | 4 | 2 | tesseract.js |
| Phase 4 | 0 | 2 | - |
| **합계** | **7** | **7** | **1** |

### 상세 파일 목록

```
# Phase 2
신규: src/pages/translate/TranslatePage.tsx
신규: src/entities/translate/translate.store.ts
신규: src/shared/lib/translate.ts
수정: src/app/layouts/MainLayout.tsx (탭 바 추가)
수정: src/shared/types/index.ts (ViewState 확장)
수정: src/shared/i18n/ko.ts, en.ts (번역 ~30개 키)

# Phase 3
신규: src/pages/doc-writer/DocWriterPage.tsx
신규: src/entities/doc-writer/doc-writer.store.ts
신규: src/pages/ocr/OcrPage.tsx
신규: src/shared/lib/ocr.ts
수정: src/shared/i18n/ko.ts, en.ts (문서작성/OCR ~40개 키)

# Phase 4
수정: src/entities/usage/usage.store.ts (카테고리 추가)
수정: src/pages/settings/SettingsScreen.tsx (필터 UI)
```

---

## 4. 우선순위 + 공수

| Phase | 기능 | 공수 | 임팩트 | 복잡도 |
|-------|------|------|--------|--------|
| **Phase 2** | 헤더 탭 + 문서 번역 | 3일 | 높음 | 중간 |
| **Phase 3** | 문서 작성 + OCR | 3일 | 중간 | 높음 |
| **Phase 4** | 기능별 사용량 | 1일 | 낮음 | 낮음 |
| **합계** | | **7일** | | |

---

## 5. 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| **번역 엔진** | LLM API (기존 프로바이더) | 별도 API 불필요, 인프라 재사용 |
| **OCR** | tesseract.js | 클라이언트 전용, 100+ 언어 지원 |
| **문서 생성** | Markdown → TXT/MD | DOCX 생성 복잡도 높아 추후 고려 |
| **스텝퍼 UI** | 커스텀 구현 | 기존 UI 패턴 활용 |
| **배치 처리** | Web Worker + Promise.allSettled | 메인 스레드 블로킹 방지 |

---

## 6. 위험 요소

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| tesseract.js 번들 크기 (15MB wasm) | 초기 로딩 지연 | dynamic import + CDN worker |
| LLM 번역 품질 불안정 | 사용자 불만 | 청크 크기 최적화 + 재시도 로직 |
| 5단계 마법사 UX 복잡도 | 이탈률 증가 | 각 단계 저장 + 중간 복귀 지원 |
| OCR 한국어 정확도 | 결과 품질 저하 | 한국어 학습 데이터 + 후처리 |

---

## 7. 성과 지표

### 완료 기준

- [x] Phase 1: 비서 마켓플레이스 (2026-03-03 완료)
- [ ] Phase 2: 문서 번역 워크플로우 기능 동작
- [ ] Phase 3: 문서 작성 마법사 + OCR 통합
- [ ] Phase 4: 기능별 사용량 추적 완료
- [ ] 테스트 커버리지 80%+ 유지
- [ ] i18n 키 100% 번역 (ko/en)

### 전체 진행률

| 구분 | 완료 | 남은 작업 | 진행률 |
|------|------|-----------|--------|
| Phase 1 | 1/1 | 0 | 100% |
| Phase 2 | 0/1 | 1 | 0% |
| Phase 3 | 0/2 | 2 | 0% |
| Phase 4 | 0/1 | 1 | 0% |
| **전체** | **1/5** | **4** | **20%** |

---

## 8. 참고 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| 스크린샷 분석 | `docs/hchat-screenshot-analysis.md` | H Chat UI 상세 분석 |
| 구현 계획 | `docs/hchat-implementation-plan.md` | Phase별 구현 방안 |
| TODO 리스트 | `docs/todolist.md` | 전체 작업 현황 |
| 비서 프리셋 | `src/shared/constants/assistants.ts` | 8개 비서 데이터 |
| Phase 2 계획 | `docs/phase2-implementation-plan.md` | 헤더 탭 + 문서 번역 상세 |
| Phase 3 계획 | `docs/phase3-implementation-plan.md` | 문서 작성 마법사 + OCR 상세 |
| Phase 4 계획 | `docs/phase4-implementation-plan.md` | 기능별 사용량 추적 상세 |
