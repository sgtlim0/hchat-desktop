# P2 구현 완료 — 사용량 추적 + 프롬프트 라이브러리 + 페르소나 시스템

**커밋**: `79da39a`
**배포**: https://hchat-desktop.vercel.app
**날짜**: 2026-03-02

---

## A. 사용량 추적 (Usage Tracking)

메시지 전송 시 토큰 사용량을 자동 추정하고 비용을 계산하여 설정 대시보드에 표시.

### 주요 구현

| 파일 | 설명 |
|------|------|
| `src/shared/lib/token-estimator.ts` | ~4 chars = 1 token 추정 유틸리티 |
| `src/entities/usage/usage.store.ts` | Zustand 스토어 + `calculateCost()` 헬퍼 |
| `src/shared/lib/db.ts` | DB v2 — `usages` 테이블, `putUsage()`, `getAllUsages()` |
| `src/widgets/prompt-input/PromptInput.tsx` | `finally` 블록에서 자동 사용량 기록 |
| `src/pages/settings/SettingsScreen.tsx` | "사용량" 탭 — 총 비용, 모델별 테이블, 초기화 |

### 데이터 모델

```typescript
interface UsageEntry {
  id: string
  sessionId: string
  modelId: string
  provider: ProviderType
  inputTokens: number
  outputTokens: number
  cost: number        // MODELS[].cost 기반 계산 (USD per 1M tokens)
  createdAt: string
}
```

---

## B. 프롬프트 라이브러리 (Prompt Library)

자주 쓰는 프롬프트를 저장, 검색, 재사용. `{{variable}}` 템플릿 변수 지원.

### 주요 구현

| 파일 | 설명 |
|------|------|
| `src/shared/lib/prompt-template.ts` | `extractVariables()`, `fillTemplate()` |
| `src/entities/prompt-library/prompt-library.store.ts` | CRUD + `toggleFavorite()` + `incrementUsage()` |
| `src/pages/prompt-library/PromptLibraryPage.tsx` | 전체 페이지 (카드 그리드, 필터, 폼, 변수 모달) |
| `src/widgets/sidebar/Sidebar.tsx` | `BookOpen` 아이콘으로 사이드바 항목 추가 |
| `src/app/layouts/MainLayout.tsx` | `'promptLibrary'` 뷰 라우팅 + lazy import |

### 데이터 모델

```typescript
type PromptCategory = 'general' | 'coding' | 'writing' | 'analysis' | 'translation' | 'custom'

interface SavedPrompt {
  id: string
  title: string
  content: string          // {{variable}} 지원
  category: PromptCategory
  tags: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}
```

### 사용 흐름

1. 프롬프트 라이브러리 → 카드 클릭 (Play 버튼)
2. 변수가 있으면 → 변수 입력 모달 표시
3. 적용 → 새 세션 생성 + `pendingPrompt` 설정 → 채팅 화면 이동

---

## C. 페르소나 시스템 (Persona System)

AI 어시스턴트에 역할/성격을 부여하는 시스템 프롬프트 관리.

### 주요 구현

| 파일 | 설명 |
|------|------|
| `src/shared/constants.ts` | `DEFAULT_PERSONAS` 5개 프리셋 정의 |
| `src/entities/persona/persona.store.ts` | CRUD + `setActivePersona()` + 기본 프리셋 시딩 |
| `src/widgets/prompt-input/PromptInput.tsx` | 페르소나 선택 칩 + `system` 프롬프트 주입 |
| `src/pages/settings/SettingsScreen.tsx` | "페르소나" 탭 — 프리셋 목록 + 커스텀 CRUD |

### 기본 프리셋

| ID | 이름 | 역할 |
|----|------|------|
| `persona-general` | General Assistant | 범용 도우미 |
| `persona-developer` | Senior Developer | 시니어 개발자 |
| `persona-writer` | Creative Writer | 콘텐츠 작가 |
| `persona-analyst` | Data Analyst | 데이터 분석가 |
| `persona-translator` | Translator | 번역 전문가 |

### 동작 방식

- PromptInput 상단에 페르소나 선택 칩 표시
- 선택된 페르소나의 `systemPrompt` → `createStream()` 호출 시 `system` 파라미터로 전달
- 기본 프리셋은 삭제 불가 (`isDefault: true`)
- 첫 hydrate 시 DB에 프리셋이 없으면 자동 시딩

---

## 공통 변경사항

### DB 스키마 업그레이드

```
v1 → v2: usages, prompts, personas 테이블 추가
```

### i18n

- `ko.ts`, `en.ts`에 각 ~50개 키 추가
- 네임스페이스: `usage.*`, `promptLib.*`, `persona.*`, `sidebar.promptLibrary`, `settings.tab.usage`, `settings.tab.personas`

### ViewState 확장

```typescript
// 기존
'home' | 'chat' | ... | 'groupChat'
// 추가
| 'promptLibrary'
```

### Hydration (MainLayout)

```typescript
useEffect(() => {
  hydrateSession()
  hydrateProject()
  hydrateUsage()          // 신규
  hydratePromptLibrary()  // 신규
  hydratePersona()        // 신규
}, [...])
```

---

## 파일 변경 요약

| 구분 | 파일 | 변경 |
|------|------|------|
| 신규 | `src/shared/lib/token-estimator.ts` | 토큰 추정 |
| 신규 | `src/shared/lib/prompt-template.ts` | 템플릿 변수 처리 |
| 신규 | `src/entities/usage/usage.store.ts` | 사용량 스토어 |
| 신규 | `src/entities/prompt-library/prompt-library.store.ts` | 프롬프트 스토어 |
| 신규 | `src/entities/persona/persona.store.ts` | 페르소나 스토어 |
| 신규 | `src/pages/prompt-library/PromptLibraryPage.tsx` | 프롬프트 라이브러리 페이지 |
| 수정 | `src/shared/types/index.ts` | UsageEntry, SavedPrompt, Persona, ViewState 타입 |
| 수정 | `src/shared/lib/db.ts` | DB v2 + 6개 CRUD 함수 |
| 수정 | `src/shared/constants.ts` | DEFAULT_PERSONAS |
| 수정 | `src/widgets/prompt-input/PromptInput.tsx` | 사용량 기록 + 페르소나 UI/주입 |
| 수정 | `src/pages/settings/SettingsScreen.tsx` | usage, personas 탭 |
| 수정 | `src/app/layouts/MainLayout.tsx` | 3개 스토어 hydrate + promptLibrary 라우팅 |
| 수정 | `src/widgets/sidebar/Sidebar.tsx` | 프롬프트 라이브러리 사이드바 항목 |
| 수정 | `src/shared/i18n/ko.ts` | ~50개 한국어 키 |
| 수정 | `src/shared/i18n/en.ts` | ~50개 영어 키 |

**총 15파일 변경, +1,175줄 / -28줄**

---

## 검증 결과

- `npm run build` — 성공
- `npx vitest run` — 83/83 테스트 통과
- Vercel 프로덕션 배포 — 성공
