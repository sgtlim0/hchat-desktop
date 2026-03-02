# H Chat 기능 도입 — 구현 계획

> 2026-03-02 | 기능 분석 기반

---

## 1. 구현 순서

```
Phase 1 — 즉시 구현 (외부 의존 없음)
  ├── 1A. Thinking Depth 모드 ······················ 0.5일
  └── 1B. 사용량 예산 경고 ························· 0.5일

Phase 2 — AI 가드레일 + 도구 확장
  ├── 2A. AI 가드레일 (민감 데이터 감지) ············ 1일
  ├── 2B. 문서 건강 검사 ··························· 1일
  └── 2C. ROI 측정 대시보드 ························ 1일

Phase 3 — 고급 기능
  ├── 3A. Excel/CSV 분석 + 차트 ···················· 2일
  └── 3B. 이미지 생성 UI ·························· 1.5일
```

---

## 2. Phase 1 상세

### 1A. Thinking Depth 모드

**목표**: 모델별 추론 깊이 조절 (fast/balanced/deep)

**수정 파일**:
- `src/shared/types/index.ts` — `ThinkingDepth` 타입
- `src/entities/settings/settings.store.ts` — `thinkingDepth` 상태
- `src/widgets/prompt-input/PromptInput.tsx` — 3단 토글 UI
- `src/shared/lib/providers/factory.ts` — depth → 모델 파라미터 매핑

**모델별 매핑**:
| Depth | Claude | GPT | Gemini |
|-------|--------|-----|--------|
| Fast | temperature: 0.3, max: 1024 | temperature: 0.3, max: 1024 | temperature: 0.3, max: 1024 |
| Balanced | 기본 설정 | 기본 설정 | 기본 설정 |
| Deep | extended_thinking: true | reasoning_effort: "high" | thinking_config: {type: "enabled"} |

### 1B. 사용량 예산 경고

**목표**: 월간 예산 설정 + 임계치 도달 시 경고

**수정 파일**:
- `src/entities/settings/settings.store.ts` — `monthlyBudget`, `budgetThreshold` 상태
- `src/pages/settings/SettingsScreen.tsx` — Usage 탭에 예산 설정 UI
- `src/shared/lib/usage-chart.ts` — `getCurrentMonthCost()` 유틸
- `src/widgets/prompt-input/PromptInput.tsx` — 예산 초과 시 경고 배너

**구현 요점**:
```typescript
// settings.store.ts
monthlyBudget: 10.00,      // USD
budgetThreshold: 0.7,       // 70%
budgetAlertEnabled: true,

// usage-chart.ts
export function getCurrentMonthCost(entries: UsageEntry[]): number {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return entries
    .filter(e => new Date(e.date) >= monthStart)
    .reduce((sum, e) => sum + e.cost, 0)
}
```

---

## 3. Phase 2 상세

### 2A. AI 가드레일

**목표**: 전송 전 민감 데이터 자동 감지 + 경고/마스킹

**신규 파일**:
- `src/shared/lib/guardrail.ts` — 민감 정보 Regex 패턴 + 감지/마스킹

**수정 파일**:
- `src/entities/settings/settings.store.ts` — 가드레일 설정
- `src/widgets/prompt-input/PromptInput.tsx` — 전송 전 검사 + 경고 다이얼로그
- `src/pages/settings/SettingsScreen.tsx` — Privacy 탭 가드레일 토글
- `src/shared/i18n/ko.ts`, `en.ts` — `guardrail.*` 키 ~12개

**감지 패턴**:
```typescript
const PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\d{2,3}-\d{3,4}-\d{4}/g,
  ssn: /\d{6}-[1-4]\d{6}/g,
  creditCard: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  apiKey: /(sk-|pk_|AKIA)[a-zA-Z0-9]{20,}/g,
}
```

**워크플로우**:
1. 전송 버튼 클릭
2. `detectSensitiveData(text)` 실행
3. 감지 결과 있으면 → 경고 다이얼로그 표시
4. 사용자 선택: 취소 / 마스킹 후 전송 / 그대로 전송

### 2B. 문서 건강 검사

**목표**: 문서 맞춤법, 문법, 형식 일관성 AI 분석

**신규 파일**:
- `src/pages/tools/DocHealthTool.tsx` — 문서 검사 UI + 결과 표시

**수정 파일**:
- `src/pages/tools/ToolsPage.tsx` — 도구 카드 추가 (이미 존재할 경우)

**구현 방식**:
- 텍스트 입력 → LLM 1회 호출
- 시스템 프롬프트: JSON 구조로 응답 요청 (score, issues[], suggestions[])
- 결과 파싱 → 점수, 오류 목록, 자동 수정 제안 표시

### 2C. ROI 측정 대시보드

**목표**: 사용량 대비 생산성 지표 표시

**수정 파일**:
- `src/pages/settings/SettingsScreen.tsx` — Usage 탭에 ROI 섹션 추가
- `src/shared/lib/usage-chart.ts` — ROI 계산 유틸

**지표**:
- 총 대화 수 / 총 비용 → 대화당 비용
- 일 평균 사용량 → 사용 빈도
- 모델별 효율성 비교 (토큰/비용 비율)

---

## 4. Phase 3 상세

### 3A. Excel/CSV 분석

**설치**: `xlsx` (SheetJS)

**신규 파일**:
- `src/shared/lib/csv-parser.ts` — CSV/Excel 파싱
- `src/pages/tools/DataAnalysisTool.tsx` — 분석 UI

**구현 방식**:
1. 파일 업로드 → SheetJS 파싱 → 데이터 요약 (행수, 컬럼, 타입)
2. 사용자 질문 + 데이터 (최대 100행 샘플) → LLM 분석
3. LLM 응답에서 차트 데이터 추출 → SVG 차트 렌더링

### 3B. 이미지 생성 UI

**수정 파일**:
- `src/pages/tools/ImageGenTool.tsx` — 이미지 생성 UI
- `src/shared/lib/providers/factory.ts` — 이미지 생성 API 연동

**구현 방식**:
- 텍스트 프롬프트 → DALL-E 3 / Gemini Imagen API
- 결과 이미지 표시 + 다운로드
- 참조 이미지 업로드 지원 (img2img)

---

## 5. 파일 수정 요약

| Phase | 신규 | 수정 | 설치 |
|-------|------|------|------|
| Phase 1 | 0 | 4 | - |
| Phase 2 | 2 | 5 | - |
| Phase 3 | 2 | 1 | xlsx |
| **합계** | **4** | **10** | **1** |

---

## 6. v2-extension 포팅과의 의존성

| H Chat 기능 | v2-extension 선행 작업 | 비고 |
|------------|----------------------|------|
| Thinking Depth | 없음 | 독립 구현 |
| 예산 경고 | 없음 (기존 usage 스토어 활용) | 독립 구현 |
| AI 가드레일 | 없음 | 독립 구현 |
| 문서 건강 검사 | AI 도구 패널 (P2) | 도구 페이지 프레임 재사용 |
| Excel/CSV 분석 | AI 도구 패널 (P2) | 도구 페이지 프레임 재사용 |
| 이미지 생성 | 없음 | 별도 API 연동 필요 |

**권장 구현 순서**: v2-extension P1 → H Chat Phase 1 → v2 P2 → H Chat Phase 2 → H Chat Phase 3
