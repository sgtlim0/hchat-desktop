# H Chat 스크린샷 심층 분석 + 구현 방안

> 분석일: 2026-03-03
> 소스: H Chat 서비스 5개 화면 스크린샷

---

## 1. 스크린샷 분석

### 1-1. 홈 대시보드 (`H Chat/ko/chat`)

**레이아웃**: 헤더(로고 + 탭 메뉴 + 사용자) → 사이드바(대화 목록) → 메인(비서 선택)

| 요소 | 상세 |
|------|------|
| **헤더 탭** | 업무 비서, 문서 번역, 문서 작성, 텍스트 추출 |
| **히어로 텍스트** | "실시간 검색, 사진 이해, 그림/차트 생성 업무 대화 모두 OK!" |
| **프롬프트 입력** | 중앙 입력바 + 파일 첨부 버튼 |
| **비서 탭** | H Chat 공식 비서 / 내가 만든 비서 |
| **카테고리 필터** | 전체, 채팅, 업무, 번역, 정리, 보고, 그림, 글쓰기 (수평 스크롤) |
| **기능 카드 그리드** | 2×4 카드: 신중한 목적이(GPT-4o), 티커타카 장인(GPT-4.1 nano), 문서 파일 검토, 문서 번역, 파워포인트 기획, 본문 번역, 데이터 분석, 이메일 작성 |
| **사이드바** | 내 계정 관리, 이용 매뉴얼, 로그아웃 (하단) |

**핵심 인사이트**:
- 비서 = 사전 구성된 시스템 프롬프트 + 모델 + 카테고리 조합
- 카테고리별 필터링으로 빠른 비서 탐색
- "내가 만든 비서" = 커스텀 페르소나 시스템

### 1-2. 문서 번역 도구 (`H Chat/ko/tools/translation`)

**레이아웃**: 헤더 → 안내 텍스트 → 엔진 선택 → 파일 업로드

| 요소 | 상세 |
|------|------|
| **안내 텍스트** | "문서 파일의 디자인과 형식을 유지하면서 원하는 언어로 번역해 드리는 기능" |
| **지원 포맷** | PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS |
| **스텝 표시** | ① 번역 시작 → ② 번역 결과 |
| **엔진 선택** | 자체 번역 엔진 (품질 최상, 속도 빠름, 언어 89개, 일 5000페이지/300MB) vs DeepL 번역 엔진 (품질 최고, 속도 빠름, 언어 32개, 일 30MB/100만자) |
| **경고 박스** | "AI 번역 특성상 글이 빠지거나 변경될 수 있고, 문서에 그림이 많으면 디자인이 일부 변경될 수 있어요." |
| **파일 업로드** | 드래그 앤 드롭 영역 ("클릭하여 파일을 선택하거나 드래그하여 추가해 주세요") |

**핵심 인사이트**:
- 번역 엔진 비교 선택 UI (카드형 라디오)
- 파일 포맷 제한 명시
- 배치 처리 (일일 처리량 제한 표시)

### 1-3. 문서 작성 도구 (`H Chat/ko/tools/docs`)

**레이아웃**: 헤더 → 안내 → 5단계 스텝퍼 → 프로젝트 목록

| 요소 | 상세 |
|------|------|
| **제목** | "문서 작성 도구" + 사용방법 링크 |
| **안내** | "한글(HWP)과 워드(DOCX) 문서 초안 작성을 돕는 문서 작성 도구입니다" |
| **5단계 스텝퍼** | ① 프로젝트 선택 → ② 작성할 파일 선택 → ③ 프로젝트 배경지식 제공 → ④ 목차 선택 및 내용 작성 → ⑤ 파일 생성 (지원 예정) |
| **CTA** | "새 프로젝트 시작" 버튼 |
| **프로젝트 테이블** | 프로젝트명, 문서 종류, 최종 작성일, 삭제 |
| **빈 상태** | "아직 만든 프로젝트가 없어요 '새 프로젝트 시작'을 눌러 AI와 함께 첫 문서를 작성해보세요!" |

**핵심 인사이트**:
- 다단계 워크플로우 (5-step wizard)
- 프로젝트 기반 문서 관리 (생성/조회/삭제)
- HWP/DOCX 출력 지원

### 1-4. 텍스트 추출 (OCR) (`H Chat/ko/tools/ocr`)

**레이아웃**: 헤더 → 안내 → 탭(이미지 파일 업로드 / 추출된 텍스트 안내) → 업로드 → 결과

| 요소 | 상세 |
|------|------|
| **안내** | "이미지에서 글자를 자동으로 탐지하는 도구. 사용자가 인식 범위를 설정하면 결과를 가져올 수 있음. 스크린샷이나 스캔본도 가능" |
| **탭** | ① 이미지 파일 업로드 → ② 추출된 텍스트 안내 |
| **경고** | "명수+한글 등 문서에 복수 언어 사진이 있으면 이미 분석될 수도 있어요" |
| **업로드 안내** | "텍스트를 뽑아낼 이미지를 업로드. 같은 종류의 이미지(예: 명수조 5개)는 최대 20까지 동시 업로드 가능. 다른 종류 혼합 시 명수조 2개+사업자등록증 3개 식으로 분리" |
| **결과 섹션** | "변환된 파일은 최대 2주간 무료로 내려 받으실 수 있습니다" + 테이블(업로드시간, 파일명, 현재 상태) |

**핵심 인사이트**:
- OCR 배치 처리 (최대 20개 동시)
- 같은 종류끼리 묶어서 업로드
- 결과 다운로드 (2주 보관)

### 1-5. 내 계정 / 사용량 (`H Chat/ko/my-page`)

**레이아웃**: 프로필 → 요금제 정보 → 모델별 사용량 테이블

| 요소 | 상세 |
|------|------|
| **프로필** | 로그인된 계정 아이콘 + 이메일 (wooogi@gmail.com) |
| **요금제** | "Starter (무료 \| 요금제 갱신일: 2026.03.14)" |
| **사용량 테이블** | 9개 모델별 토큰 사용량 + 이용 요금 |
| **모델 목록** | OPENAI_CHAT_GPT4, OPENAI_CHAT_GPT3_5, OPENAI_ASSISTANT, OPENAI_ASSISTANT_FILE, CLAUDE_DOC_CREATE_NEW, CLAUDE_DOC_GEN_PART, DEEPL_TRANSLATE_FILE, OPENAI_COMPLETION_OCR, OPENAI_DALL_E3 |
| **하단 안내** | "매 3시간 또는 매일 제공되는 사용분은 해당 시간 또는 월에 사용하지 않으시면 소진되며, 이월되지 않습니다" |

**핵심 인사이트**:
- 기능별(모델별이 아닌) 사용량 추적
- 무료 vs 유료 요금제 구분
- 토큰 사용량 + 비용 동시 표시

---

## 2. 기존 구현 대비 GAP 분석

### 이미 구현된 기능 (hchat-pwa)

| H Chat 기능 | hchat-pwa 대응 | 상태 |
|-------------|---------------|------|
| 업무 비서 (채팅) | ChatPage + 멀티 프로바이더 | ✅ 완료 |
| 공식/커스텀 비서 | 페르소나 시스템 (5 프리셋 + 커스텀) | ✅ 완료 |
| 카테고리 필터 | 프롬프트 라이브러리 카테고리 | ✅ 완료 |
| 데이터 분석 | Excel/CSV 분석 (SheetJS) | ✅ 완료 |
| 이미지 생성 | DALL-E 3 통합 | ✅ 완료 |
| 사용량 추적 | 토큰 추정 + 비용 대시보드 | ✅ 완료 |
| 문서 검토 | AI 도구 패널 (문서 건강 검사) | ✅ 완료 |

### 미구현 기능 (새로 발견)

| H Chat 기능 | 설명 | 복잡도 |
|-------------|------|--------|
| **문서 번역 워크플로우** | 파일 업로드 → 엔진 선택 → 배치 번역 → 결과 다운로드 | 높음 |
| **문서 작성 마법사** | 5단계 스텝퍼, 프로젝트 관리, HWP/DOCX 생성 | 높음 |
| **OCR 텍스트 추출** | 이미지 → 텍스트, 배치 처리, 결과 다운로드 | 중간 |
| **기능별 사용량 분리** | 채팅/번역/문서생성/OCR/이미지별 개별 추적 | 낮음 |
| **비서 마켓플레이스** | 공식 비서 카드 그리드 + 카테고리 필터 + 원클릭 시작 | 중간 |
| **헤더 탭 도구 전환** | 채팅 ↔ 번역 ↔ 작성 ↔ OCR 탭 전환 | 낮음 |

---

## 3. 구현 방안

### Phase 1: 비서 마켓플레이스 + 도구 탭 (2일)

#### 3-1. 비서 마켓플레이스 (HomeScreen 리팩토링)

**현재**: HomeScreen에 QuickAction 카드 + 최근 대화 목록
**목표**: H Chat 스타일 비서 선택 그리드 + 카테고리 필터

```
수정: src/pages/home/HomeScreen.tsx
신규: src/shared/constants/assistants.ts  (비서 프리셋 데이터)
수정: src/shared/i18n/ko.ts, en.ts        (i18n 키 추가)
```

**비서 프리셋 데이터 구조**:
```typescript
interface AssistantPreset {
  id: string
  icon: string           // 이모지 또는 lucide 아이콘
  titleKey: string       // i18n 키
  descriptionKey: string // i18n 키
  category: AssistantCategory
  modelId: string        // 기본 모델
  systemPrompt: string   // 시스템 프롬프트
}

type AssistantCategory = 'all' | 'chat' | 'work' | 'translate' | 'organize' | 'report' | 'image' | 'writing'
```

**프리셋 예시** (H Chat 참고, 8개):
1. 신중한 목적이 → GPT-4o, 분석/추론 특화
2. 티커타카 장인 → GPT-4.1 nano, 빠른 대화/이미지 인식
3. 문서 파일 검토 → Claude Sonnet, PDF 문서 분석
4. 문서 번역 → Claude Sonnet, 번역 프롬프트
5. 파워포인트 기획 → GPT-4o, PPT 구성 보조
6. 본문 번역 → Gemini Flash, 빠른 번역
7. 데이터 분석 → Claude Sonnet, 데이터 분석 프롬프트
8. 이메일 작성 → GPT-4o, 비즈니스 이메일

**구현 흐름**:
1. 카테고리 필터 클릭 → 비서 카드 필터링
2. 비서 카드 클릭 → `createSession(preset.modelId, preset.systemPrompt)` → 채팅 화면 이동
3. "내가 만든 비서" 탭 → 기존 페르소나 시스템 연결

#### 3-2. 헤더 도구 탭

**현재**: 사이드바 메뉴로 도구 접근
**목표**: 상단 탭으로 주요 도구 빠른 전환

```
수정: src/app/layouts/MainLayout.tsx  (탭 바 추가)
수정: src/shared/types/index.ts      (ViewState 확장)
```

**탭 목록**: 업무 비서(chat) | 문서 번역(translate) | 문서 작성(doc-write) | 텍스트 추출(ocr)

---

### Phase 2: 문서 번역 워크플로우 (3일)

#### 3-3. 번역 도구 페이지

```
신규: src/pages/translate/TranslatePage.tsx
신규: src/entities/translate/translate.store.ts
신규: src/shared/lib/translate.ts           (번역 유틸리티)
수정: src/app/layouts/MainLayout.tsx        (라우트 추가)
수정: src/shared/i18n/ko.ts, en.ts
```

**UI 구조** (H Chat 참고):
```
┌─────────────────────────────────────────────┐
│ 문서 번역 도구                                │
│ "문서 파일의 디자인과 형식을 유지하면서..."      │
│ 지원 포맷: PDF, DOCX, PPTX, XLSX             │
├─────────────────────────────────────────────┤
│ ① 번역 시작  ────────── ② 번역 결과          │
├─────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐   │
│ │ 🔤 자체 번역 엔진  │ │ 🌐 LLM 번역 엔진  │   │
│ │ · 빠른 속도        │ │ · 고품질 번역      │   │
│ │ · 89개 언어        │ │ · 컨텍스트 이해    │   │
│ └──────────────────┘ └──────────────────┘   │
├─────────────────────────────────────────────┤
│ 원본 언어: [자동 감지 ▾]  대상 언어: [한국어 ▾] │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │  📄 파일을 드래그하거나 클릭하여 업로드    │ │
│ │     PDF, DOCX, PPTX, XLSX 지원          │ │
│ └─────────────────────────────────────────┘ │
│                          [번역 시작] 버튼    │
├─────────────────────────────────────────────┤
│ 번역 결과                                    │
│ ┌────────┬──────┬──────┬────────┐          │
│ │ 파일명  │ 상태  │ 진행률 │ 다운로드 │          │
│ ├────────┼──────┼──────┼────────┤          │
│ │ doc.pdf│ 완료 ✅│ 100% │ [↓]    │          │
│ └────────┴──────┴──────┴────────┘          │
└─────────────────────────────────────────────┘
```

**번역 방식** (백엔드 없이 클라이언트 구현):
- **LLM 번역**: 파일 텍스트 추출(기존 pdf-extractor 재사용) → 청크 분할 → LLM API 호출 → 번역 결과 합성
- 텍스트 기반 번역만 지원 (레이아웃 보존은 미지원)
- 진행률: 청크별 완료 퍼센트 표시

**스토어 구조**:
```typescript
interface TranslateState {
  engine: 'llm' | 'browser'  // LLM 번역 vs 브라우저 내장
  sourceLang: string
  targetLang: string
  files: TranslateFile[]
  isProcessing: boolean
}

interface TranslateFile {
  id: string
  name: string
  size: number
  status: 'pending' | 'extracting' | 'translating' | 'done' | 'error'
  progress: number  // 0-100
  originalText?: string
  translatedText?: string
  error?: string
}
```

---

### Phase 3: 문서 작성 마법사 + OCR (3일)

#### 3-4. 문서 작성 마법사

```
신규: src/pages/doc-writer/DocWriterPage.tsx
신규: src/entities/doc-writer/doc-writer.store.ts
수정: src/app/layouts/MainLayout.tsx
수정: src/shared/i18n/ko.ts, en.ts
```

**5단계 스텝퍼 UI**:
1. **프로젝트 설정**: 프로젝트명, 문서 종류(보고서/기획서/제안서/매뉴얼)
2. **배경지식 제공**: 텍스트 입력 또는 파일 업로드 (컨텍스트)
3. **목차 생성**: AI가 목차 초안 생성 → 사용자 편집
4. **내용 작성**: 목차별 AI 초안 생성 → 섹션별 편집
5. **파일 다운로드**: Markdown / TXT 내보내기 (DOCX는 추후)

**구현 방식**: 기존 `export-chat.ts` 패턴 재사용 + 스텝퍼 UI 신규

#### 3-5. OCR 텍스트 추출

```
신규: src/pages/ocr/OcrPage.tsx
신규: src/shared/lib/ocr.ts         (Tesseract.js 래퍼)
수정: src/app/layouts/MainLayout.tsx
수정: src/shared/i18n/ko.ts, en.ts
설치: tesseract.js
```

**구현 방식**:
- `tesseract.js` (클라이언트 OCR, 100+ 언어)
- 이미지 업로드 (드래그 앤 드롭, 최대 20개)
- 배치 처리 + 진행률 표시
- 결과 텍스트 복사/다운로드

---

### Phase 4: 기능별 사용량 + 마무리 (1일)

#### 3-6. 사용량 추적 확장

```
수정: src/entities/usage/usage.store.ts  (기능 카테고리 추가)
수정: src/pages/settings/SettingsScreen.tsx (사용량 탭 확장)
```

**기능별 분류 추가**:
```typescript
type UsageCategory = 'chat' | 'translate' | 'doc-write' | 'ocr' | 'image-gen' | 'data-analysis'
```

- 기존 usage 엔트리에 `category` 필드 추가
- 설정 > 사용량 탭에 카테고리 필터 추가

---

## 4. 파일 변경 요약

| 구분 | 파일 | Phase |
|------|------|-------|
| 수정 | `src/pages/home/HomeScreen.tsx` | 1 |
| 신규 | `src/shared/constants/assistants.ts` | 1 |
| 수정 | `src/app/layouts/MainLayout.tsx` | 1,2,3 |
| 수정 | `src/shared/types/index.ts` | 1 |
| 신규 | `src/pages/translate/TranslatePage.tsx` | 2 |
| 신규 | `src/entities/translate/translate.store.ts` | 2 |
| 신규 | `src/shared/lib/translate.ts` | 2 |
| 신규 | `src/pages/doc-writer/DocWriterPage.tsx` | 3 |
| 신규 | `src/entities/doc-writer/doc-writer.store.ts` | 3 |
| 신규 | `src/pages/ocr/OcrPage.tsx` | 3 |
| 신규 | `src/shared/lib/ocr.ts` | 3 |
| 수정 | `src/entities/usage/usage.store.ts` | 4 |
| 수정 | `src/pages/settings/SettingsScreen.tsx` | 4 |
| 수정 | `src/shared/i18n/ko.ts`, `en.ts` | 1,2,3,4 |
| 설치 | `tesseract.js` | 3 |

**총 파일**: 신규 8개, 수정 7개, 설치 1개

---

## 5. 구현 우선순위 + 공수

| Phase | 기능 | 공수 | 임팩트 |
|-------|------|------|--------|
| **1** | 비서 마켓플레이스 + 도구 탭 | 2일 | 높음 |
| **2** | 문서 번역 워크플로우 | 3일 | 높음 |
| **3** | 문서 작성 마법사 + OCR | 3일 | 중간 |
| **4** | 기능별 사용량 확장 | 1일 | 낮음 |
| **합계** | | **9일** | |

---

## 6. 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| **번역 엔진** | LLM API (기존 프로바이더) | 별도 번역 API 불필요, 기존 인프라 재사용 |
| **OCR** | tesseract.js | 클라이언트 전용, 설치 간편, 100+ 언어 |
| **문서 생성** | Markdown → TXT/MD 내보내기 | DOCX 생성은 복잡도 높아 추후 고려 |
| **스텝퍼 UI** | 커스텀 구현 | 외부 라이브러리 불필요, 기존 UI 패턴 활용 |
| **배치 처리** | Web Worker + Promise.allSettled | 메인 스레드 블로킹 방지 |

---

## 7. 위험 요소

| 위험 | 영향 | 대응 |
|------|------|------|
| tesseract.js 번들 크기 (15MB wasm) | 초기 로딩 지연 | dynamic import + CDN worker |
| LLM 번역 품질 불안정 | 사용자 불만 | 청크 크기 최적화 + 재시도 |
| 문서 작성 5단계 UX 복잡도 | 이탈률 증가 | 각 단계 저장 + 중간 복귀 지원 |
| OCR 한국어 정확도 | 결과 품질 | 한국어 학습 데이터 + 후처리 |
