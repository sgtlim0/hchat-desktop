# Phase 4: 기능별 사용량 추적 + 마무리 — 상세 구현 계획

> ✅ **완료** (2026-03-03) | 예상 공수: 1일 | 복잡도: 낮음 | 임팩트: 중간

---

## 1. 개요

기존 `UsageEntry`에 **기능별 카테고리**(chat, translate, doc-write, ocr, image-gen, data-analysis)를 추가하여 어떤 기능이 토큰/비용을 얼마나 소비하는지 분리 추적한다. 설정 > 사용량 탭에 카테고리 필터 + 기능별 차트를 추가한다.

---

## 2. 작업 4-1: UsageEntry 확장 (0.3일)

### 현재 UsageEntry

```typescript
// src/shared/types/index.ts (line 239)
export interface UsageEntry {
  id: string
  sessionId: string
  modelId: string
  provider: ProviderType
  inputTokens: number
  outputTokens: number
  cost: number
  createdAt: string
}
```

### 확장 후

```typescript
export type UsageCategory =
  | 'chat'           // 기본 대화 (기본값)
  | 'translate'      // 문서 번역
  | 'doc-write'      // 문서 작성
  | 'ocr'            // OCR (토큰 사용 없지만 실행 기록)
  | 'image-gen'      // 이미지 생성
  | 'data-analysis'  // 데이터 분석

export interface UsageEntry {
  id: string
  sessionId: string
  modelId: string
  provider: ProviderType
  inputTokens: number
  outputTokens: number
  cost: number
  createdAt: string
  category?: UsageCategory  // 신규 — undefined는 'chat'으로 처리
}
```

### 하위 호환성 전략

- `category` 필드는 **optional** (`?`)
- 기존 데이터: `category === undefined` → UI에서 `'chat'`으로 표시
- 신규 데이터: 호출 시점에 `category` 명시
- IndexedDB 마이그레이션 불필요 (optional 필드 추가)
- 필터링: `entry.category ?? 'chat'`

---

## 3. 작업 4-2: usage.store.ts 확장 (0.2일)

### 추가 메서드

```typescript
// src/entities/usage/usage.store.ts

interface UsageState {
  // ... 기존 메서드

  // 신규
  getCategoryUsage: (category: UsageCategory) => UsageEntry[]
  getCategoryCost: (category: UsageCategory) => number
  getCategorySummary: () => CategorySummary[]
}

interface CategorySummary {
  category: UsageCategory
  totalEntries: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
}
```

### 구현

```typescript
getCategoryUsage: (category) => {
  return get().entries.filter((e) =>
    (e.category ?? 'chat') === category
  )
},

getCategoryCost: (category) => {
  return get().entries
    .filter((e) => (e.category ?? 'chat') === category)
    .reduce((sum, e) => sum + e.cost, 0)
},

getCategorySummary: () => {
  const categories: UsageCategory[] = [
    'chat', 'translate', 'doc-write', 'ocr', 'image-gen', 'data-analysis'
  ]
  return categories.map((cat) => {
    const entries = get().entries.filter((e) => (e.category ?? 'chat') === cat)
    return {
      category: cat,
      totalEntries: entries.length,
      totalInputTokens: entries.reduce((s, e) => s + e.inputTokens, 0),
      totalOutputTokens: entries.reduce((s, e) => s + e.outputTokens, 0),
      totalCost: entries.reduce((s, e) => s + e.cost, 0),
    }
  })
},
```

---

## 4. 작업 4-3: 호출부 category 전달 (0.2일)

### 변경 지점

각 기능의 `addUsage()` 호출 시 `category` 파라미터 추가:

| 호출 위치 | 현재 | 변경 후 |
|-----------|------|---------|
| `ChatPage` 스트리밍 완료 | `addUsage({...})` | `addUsage({..., category: 'chat'})` |
| `GroupChatPage` 응답 완료 | `addUsage({...})` | `addUsage({..., category: 'chat'})` |
| `DebatePage` 라운드 완료 | `addUsage({...})` | `addUsage({..., category: 'chat'})` |
| `TranslatePage` 번역 완료 | (신규) | `addUsage({..., category: 'translate'})` |
| `DocWriterPage` 생성 완료 | (신규) | `addUsage({..., category: 'doc-write'})` |
| `ImageGenPage` 생성 완료 | `addUsage({...})` | `addUsage({..., category: 'image-gen'})` |
| `AiToolsPage` 도구 실행 완료 | `addUsage({...})` | `addUsage({..., category: 'data-analysis'})` |

### 기존 호출부 확인

```bash
# 현재 addUsage 호출 위치
grep -rn "addUsage" src/
```

기존 `addUsage` 호출에 `category: 'chat'`을 추가하면 기존 동작과 동일 (undefined → 'chat'이므로 실질적 변경 없음). 명시적으로 추가하는 것은 코드 명확성을 위함.

---

## 5. 작업 4-4: 설정 > 사용량 탭 UI (0.3일)

### 현재 UI (SettingsScreen 사용량 탭)

```
사용량 추적
├── 총 비용: $12.34
├── 총 토큰: 1,234,567
├── SVG 바차트 (일별/주별)
└── 모델별 사용량 테이블
```

### 변경 후 UI

```
사용량 추적
├── 카테고리 필터 (가로 필 형태)
│   [전체] [대화] [번역] [문서작성] [이미지] [분석]
├── 필터된 총 비용 / 총 토큰
├── 기능별 비용 도넛 차트 (SVG)
│   ┌──────────┐
│   │  🍩 차트  │  대화: 60%  번역: 20%  문서: 15%  기타: 5%
│   └──────────┘
├── SVG 바차트 (일별/주별) — 필터 적용
└── 모델별 사용량 테이블 — 필터 적용
```

### 컴포넌트 변경

```typescript
// SettingsScreen.tsx 사용량 탭 내부

// 1. 카테고리 필터 필(pill) 버튼
const [selectedCategory, setSelectedCategory] = useState<UsageCategory | 'all'>('all')

const USAGE_CATEGORIES = [
  { id: 'all', labelKey: 'usage.category.all', color: '#6B7280' },
  { id: 'chat', labelKey: 'usage.category.chat', color: '#3B82F6' },
  { id: 'translate', labelKey: 'usage.category.translate', color: '#10B981' },
  { id: 'doc-write', labelKey: 'usage.category.docWrite', color: '#F59E0B' },
  { id: 'image-gen', labelKey: 'usage.category.imageGen', color: '#8B5CF6' },
  { id: 'data-analysis', labelKey: 'usage.category.analysis', color: '#EF4444' },
]

// 2. 필터 적용
const filteredEntries = selectedCategory === 'all'
  ? entries
  : entries.filter((e) => (e.category ?? 'chat') === selectedCategory)

// 3. 기능별 비용 도넛 차트 (SVG)
function CategoryDonutChart({ summary }: { summary: CategorySummary[] }) {
  // SVG <circle> stroke-dasharray 기법
  // 각 카테고리 색상 + 퍼센트 레이블
}
```

### 도넛 차트 SVG 구현

```typescript
function CategoryDonutChart({ summary }: { summary: CategorySummary[] }) {
  const totalCost = summary.reduce((s, c) => s + c.totalCost, 0)
  if (totalCost === 0) return null

  const radius = 40
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <svg viewBox="0 0 100 100" width={160} height={160}>
      {summary
        .filter((s) => s.totalCost > 0)
        .map((s) => {
          const pct = s.totalCost / totalCost
          const dashArray = `${pct * circumference} ${circumference}`
          const dashOffset = -offset * circumference
          offset += pct
          return (
            <circle
              key={s.category}
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={CATEGORY_COLORS[s.category]}
              strokeWidth="12"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          )
        })}
    </svg>
  )
}
```

---

## 6. i18n 키 (7개/언어)

```typescript
// ko.ts
'usage.category.all': '전체',
'usage.category.chat': '대화',
'usage.category.translate': '번역',
'usage.category.docWrite': '문서 작성',
'usage.category.imageGen': '이미지 생성',
'usage.category.analysis': '데이터 분석',
'usage.category.chart': '기능별 비용',

// en.ts
'usage.category.all': 'All',
'usage.category.chat': 'Chat',
'usage.category.translate': 'Translate',
'usage.category.docWrite': 'Doc Writer',
'usage.category.imageGen': 'Image Gen',
'usage.category.analysis': 'Analysis',
'usage.category.chart': 'Cost by Feature',
```

---

## 7. 수정 파일 요약

| 구분 | 파일 | 변경 내용 |
|------|------|-----------|
| 수정 | `src/shared/types/index.ts` | `UsageCategory` 타입 + `UsageEntry.category` 추가 |
| 수정 | `src/entities/usage/usage.store.ts` | 3개 메서드 추가 (getCategoryUsage, getCategoryCost, getCategorySummary) |
| 수정 | `src/pages/settings/SettingsScreen.tsx` | 카테고리 필터 + 도넛 차트 |
| 수정 | `src/pages/chat/ChatPage.tsx` | addUsage에 `category: 'chat'` 추가 |
| 수정 | `src/pages/group-chat/GroupChatPage.tsx` | addUsage에 `category: 'chat'` 추가 |
| 수정 | `src/pages/debate/DebatePage.tsx` | addUsage에 `category: 'chat'` 추가 |
| 수정 | `src/pages/image-gen/ImageGenPage.tsx` | addUsage에 `category: 'image-gen'` 추가 |
| 수정 | `src/shared/i18n/ko.ts` | 7개 키 추가 |
| 수정 | `src/shared/i18n/en.ts` | 7개 키 추가 |

---

## 8. 작업 4-5: 문서화 + 테스트 마무리

### 문서 업데이트
- `CLAUDE.md`: Phase 2-4 기능 추가
- `README.md`: 기능 목록 업데이트
- `docs/todolist.md`: Phase 2-4 완료 마킹

### 테스트 계획

| 테스트 | 범위 | 도구 |
|--------|------|------|
| usage.store.test.ts 확장 | getCategoryUsage, getCategoryCost, getCategorySummary | Vitest |
| UsageEntry 하위 호환 | category undefined → 'chat' 폴백 | Vitest |
| SettingsScreen 카테고리 필터 | 필터 클릭 → 올바른 데이터 표시 | RTL |
| 도넛 차트 렌더링 | SVG 출력, 0 비용 시 null | RTL |

### 테스트 코드 예시

```typescript
// usage.store.test.ts
describe('category tracking', () => {
  it('should filter by category with fallback', () => {
    const store = useUsageStore.getState()
    store.addUsage({ ...mockEntry, category: 'translate' })
    store.addUsage({ ...mockEntry, category: undefined }) // legacy

    expect(store.getCategoryUsage('translate')).toHaveLength(1)
    expect(store.getCategoryUsage('chat')).toHaveLength(1) // undefined → 'chat'
  })

  it('should calculate category cost', () => {
    const store = useUsageStore.getState()
    store.addUsage({ ...mockEntry, cost: 0.05, category: 'translate' })
    store.addUsage({ ...mockEntry, cost: 0.10, category: 'chat' })

    expect(store.getCategoryCost('translate')).toBeCloseTo(0.05)
    expect(store.getCategoryCost('chat')).toBeCloseTo(0.10)
  })

  it('should generate category summary', () => {
    const store = useUsageStore.getState()
    store.addUsage({ ...mockEntry, cost: 0.05, category: 'translate' })

    const summary = store.getCategorySummary()
    const translateSummary = summary.find((s) => s.category === 'translate')
    expect(translateSummary?.totalCost).toBeCloseTo(0.05)
    expect(translateSummary?.totalEntries).toBe(1)
  })
})
```

---

## 9. 위험 요소 & 완화

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| 기존 데이터 category 누락 | 필터 부정확 | `?? 'chat'` 폴백 일관 적용 |
| 도넛 차트 0 비용 | 빈 차트 | totalCost === 0 시 "데이터 없음" 메시지 |
| 카테고리 추가 시 타입 확장 | 코드 변경 필요 | UsageCategory union type + USAGE_CATEGORIES 배열 분리 |

---

## 10. 의존성

- **Phase 2 선행**: `translate` 카테고리 사용처 (TranslatePage)
- **Phase 3 선행**: `doc-write` 카테고리 사용처 (DocWriterPage)
- 기존 `usage.store.ts`, `SettingsScreen.tsx` 수정 — 충돌 가능성 낮음 (추가만)
- i18n 키 충돌 없음 (`usage.category.*` 네임스페이스)
