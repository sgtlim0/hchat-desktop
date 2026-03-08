# Confluence/Jira 검색 기능 프론트엔드 마이그레이션 계획

> **소스**: `/Users/yhlim/Desktop/app2/` (hchat-mono 독립 앱)
> **타겟**: `/Users/yhlim/workspace/hchat-pwa/` (H Chat Desktop PWA)
> **작성일**: 2026-03-08

---

## A. 기존 코드 분석 (hchat-pwa 현황)

### A-1. 이미 존재하는 파일들

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/entities/tool-integration/tool-integration.store.ts` | **스텁** | Zustand store 존재하지만 실제 API 호출 없음. `testConnection`이 필드 유무만 검증 (항상 true/false). `AtlassianConfig`는 `{baseUrl, email, apiToken, connected}` 4필드만 보유 |
| `src/pages/settings/ToolIntegrationSection.tsx` | **완성** | Settings UI에서 Confluence/Jira 자격증명 입력 + 연결 테스트 + 같은 계정 공유 체크박스. 단, 실제 백엔드 호출 없이 필드 검증만 수행 |
| `src/widgets/prompt-input/ToolSelector.tsx` | **완성** | 채팅 입력창 옆 도구 토글 popover. 세션별 Confluence/Jira on/off 관리. 미설정 시 Settings 이동 링크 제공 |
| `src/pages/internal-search/InternalSearchPage.tsx` | **Mock** | 사내검색 페이지가 존재하지만 **Mock 데이터만 반환**. 실제 Atlassian API 연동 없음. 단순 통합검색 UI (Confluence/Jira 토글 + 검색) |
| `backend/routes/tools.py` | **기본** | Modal 백엔드에 `/api/tools/search`, `/api/tools/test-connection`, `/api/tools/create-jira-issue` 엔드포인트 존재. CQL/JQL 기본 검색 구현. AI 요약/분석 기능 **없음** |
| `src/shared/i18n/ko.ts`, `en.ts` | **부분** | `tools.*`, `internalSearch.*`, `settings.tool.*` 키 약 15개 존재 |
| ViewState `'internalSearch'` | **등록됨** | route-map.ts, types/index.ts에 이미 등록. Sidebar에도 네비게이션 아이템 존재 |

### A-2. 핵심 갭 분석 (app2에는 있지만 hchat-pwa에 없는 것)

| 기능 | app2 | hchat-pwa |
|------|------|-----------|
| **Confluence 전용 검색 페이지** | `pages/confluence/ui/index.tsx` — CQL 검색 + 공간 키 필터 + 페이지 ID 직접 조회 + AI 개요 + 개별 페이지 AI 요약 | 없음 (InternalSearchPage가 Mock 통합검색만 제공) |
| **Jira 전용 검색 페이지** | `pages/jira/ui/index.tsx` — JQL 검색 + 프로젝트 키 필터 + 티켓 ID 직접 조회 + AI 개요 + 개별 티켓 AI 분석 | 없음 |
| **PageCard 컴포넌트** | 공간 Badge + 제목 링크 + excerpt + AI 요약 버튼 + AiBlock | 없음 |
| **TicketCard 컴포넌트** | 티켓키 + 상태/우선순위/이슈타입 Badge + 담당자 + 라벨 + AI 분석 버튼 + AiBlock | 없음 |
| **AiBlock 컴포넌트** | 마크다운 → HTML 변환, AI 분석 결과 표시 블록 | 없음 (기존 Citation 시스템과 별개) |
| **API 클라이언트** | `@hchat/api-client` — `searchConfluence`, `summarizePage`, `searchJira`, `analyzeTicket`, `verifyAtlassian`, `verifyBedrock` | 없음 (백엔드에 `/api/tools/search`만 존재, AI 분석 엔드포인트 없음) |
| **타입 정의** | `@hchat/types` — `ConfluencePage`, `JiraTicket`, `ConfluenceSearchRequest/Response`, `JiraSearchRequest/Response`, `PageSummarizeRequest/Response`, `TicketAnalyzeRequest/Response` | 없음 |
| **자격증명 검증** | `useVerifyCredentials` — Atlassian/Bedrock 실제 API 호출로 검증, `isReady` 상태 | `testConnection`이 필드 유무만 체크 |
| **Bedrock 자격증명** | `BedrockCreds` (aws_access_key_id, aws_secret_access_key, aws_region, model_id) | 없음 (hchat-pwa는 기존 Bedrock 연동이 Modal 서버 사이드에서 처리) |
| **백엔드 엔드포인트** | `/api/confluence/search`, `/api/confluence/summarize`, `/api/jira/search`, `/api/jira/summarize`, `/api/verify/atlassian`, `/api/verify/bedrock` | `/api/tools/search`, `/api/tools/test-connection`만 존재. AI 요약/분석 없음 |

---

## B. 신규 생성 파일 목록

### B-1. 타입 정의

**`src/shared/types/atlassian.ts`** (신규)
```
- ConfluencePageResult: { id, title, space, space_key, link, excerpt, last_modified, source }
- ConfluencePageVM: ConfluencePageResult & { is_summarizing, ai_summary }
- JiraTicketResult: { key, id, summary, status, status_category, assignee, priority, issue_type, project, project_key, updated, labels, link, source }
- JiraTicketVM: JiraTicketResult & { is_analyzing, ai_analysis, total_comments }
- ConfluenceSearchResponse: { query, total, results, ai_overview }
- JiraSearchResponse: { query, total, results, ai_overview }
- PageSummaryResponse: { page_id, page_title, space_name, page_link, version, last_modified, summary, char_count }
- TicketAnalysisResponse: { issue_key, summary, status, assignee, reporter, priority, issue_type, created, updated, labels, total_comments, link, ai_analysis }
```

### B-2. API 클라이언트

**`src/shared/lib/api/atlassian-client.ts`** (신규)
```
- searchConfluence(params) → POST /api/confluence/search
- summarizePage(params) → POST /api/confluence/summarize
- searchJira(params) → POST /api/jira/search
- analyzeTicket(params) → POST /api/jira/summarize
- verifyAtlassian(creds) → POST /api/verify/atlassian
- verifyBedrock(creds) → POST /api/verify/bedrock (선택 — hchat-pwa는 Modal 서버사이드 Bedrock)
```
> 기존 `VITE_API_BASE_URL` 환경변수를 사용하여 Modal 백엔드로 요청.
> app2의 `@hchat/api-client/src/index.ts`를 Vite 환경에 맞게 변환.

### B-3. Zustand Stores

**`src/entities/confluence-search/confluence-search.store.ts`** (신규)
```
State:
  - pages: ConfluencePageVM[]
  - aiOverview: string | null
  - total: number
  - loading: boolean
  - error: string | null

Actions:
  - search(query, spaceKeys, pageIds) → API 호출 후 state 갱신
  - summarize(pageId) → 개별 페이지 AI 요약 요청
  - clearResults() → 결과 초기화
```
> app2의 `useConfluenceSearch` hook을 Zustand store 패턴으로 변환

**`src/entities/jira-search/jira-search.store.ts`** (신규)
```
State:
  - tickets: JiraTicketVM[]
  - aiOverview: string | null
  - total: number
  - loading: boolean
  - error: string | null

Actions:
  - search(query, projectKeys, ticketIds) → API 호출 후 state 갱신
  - analyze(issueKey) → 개별 티켓 AI 분석 요청
  - clearResults() → 결과 초기화
```
> app2의 `useJiraSearch` hook (features/jira-search)을 Zustand store로 변환

### B-4. 페이지 컴포넌트

**`src/pages/confluence-search/ConfluenceSearchPage.tsx`** (신규)
```
- 2-컬럼 레이아웃: 좌측 검색 사이드바 + 우측 결과 목록
- 검색 입력: 검색어 + 공간 키 필터 + 페이지 ID 직접 입력
- AI 개요 블록: 검색 결과 전체 요약
- PageCard 목록: 각 결과에 AI 요약 버튼
- 빈 상태 + 로딩 상태 + 에러 상태
- 미연결 시 LockScreen (Settings 이동)
```

**`src/pages/jira-search/JiraSearchPage.tsx`** (신규)
```
- 2-컬럼 레이아웃: 좌측 검색 사이드바 + 우측 결과 목록
- 검색 입력: 검색어 + 프로젝트 키 필터 + 티켓 ID 직접 입력
- AI 개요 블록: 검색 결과 전체 요약
- TicketCard 목록: 각 결과에 AI 분석 버튼
- 빈 상태 + 로딩 상태 + 에러 상태
- 미연결 시 LockScreen (Settings 이동)
```

### B-5. 위젯 (재사용 컴포넌트)

**`src/widgets/atlassian/PageCard.tsx`** (신규)
```
- ConfluencePageVM을 받아 렌더링
- 공간 Badge, 제목 링크, excerpt, AI 요약 버튼
- 요약 완료 시 AiBlock 표시
- hchat-pwa의 Tailwind CSS 스타일로 재작성 (app2의 inline style 대신)
```

**`src/widgets/atlassian/TicketCard.tsx`** (신규)
```
- JiraTicketVM을 받아 렌더링
- 티켓키(골드), 상태/우선순위/이슈타입 Badge, 담당자, 라벨
- AI 분석 버튼 + AiBlock
- statusVariant(), priorityVariant() 헬퍼 함수 포함
- hchat-pwa Tailwind CSS 스타일
```

**`src/widgets/atlassian/AiBlock.tsx`** (신규)
```
- AI 분석/요약 결과 표시 블록
- 마크다운 → HTML 기본 변환 (h2, bold)
- 또는 기존 react-markdown 활용
- 파란색 배경의 구분된 블록 UI
```

**`src/widgets/atlassian/LockScreen.tsx`** (신규)
```
- 자격증명 미설정 시 표시하는 안내 화면
- Settings 이동 버튼
- useToolIntegrationStore의 연결 상태 확인
```

**`src/widgets/atlassian/index.ts`** (신규)
```
- barrel export: PageCard, TicketCard, AiBlock, LockScreen
```

### B-6. 테스트 파일

**`src/entities/confluence-search/__tests__/confluence-search.store.test.ts`** (신규)
**`src/entities/jira-search/__tests__/jira-search.store.test.ts`** (신규)
**`src/shared/lib/api/__tests__/atlassian-client.test.ts`** (신규)
**`src/pages/confluence-search/__tests__/ConfluenceSearchPage.test.tsx`** (신규)
**`src/pages/jira-search/__tests__/JiraSearchPage.test.tsx`** (신규)
**`src/widgets/atlassian/__tests__/PageCard.test.tsx`** (신규)
**`src/widgets/atlassian/__tests__/TicketCard.test.tsx`** (신규)

### B-7. 백엔드 라우트 (선택)

**`backend/routes/confluence.py`** (신규)
```
- POST /api/confluence/search — CQL 검색 + 페이지 ID 직접 조회 + AI 개요
- POST /api/confluence/summarize — 페이지 본문 추출 + AI 요약
```

**`backend/routes/jira_routes.py`** (신규)
```
- POST /api/jira/search — JQL 검색 + 티켓 ID 직접 조회 + AI 개요
- POST /api/jira/summarize — 티켓 상세 + 댓글 파싱 + AI 분석
```

**`backend/routes/verify.py`** (신규)
```
- POST /api/verify/atlassian — /rest/api/3/myself 호출로 실제 인증 확인
```

> app2의 `confluence.py`, `jira.py`, `auth.py`, `atlassian.py`, `bedrock.py`를 Modal FastAPI 패턴으로 변환.
> AI 요약/분석에는 기존 hchat-pwa 백엔드의 Bedrock 클라이언트를 재활용.

---

## C. 수정 필요 파일 목록

### C-1. ViewState 타입 추가

**`src/shared/types/index.ts`** (라인 99)
```diff
- export type ViewState = '...' | 'internalSearch'
+ export type ViewState = '...' | 'internalSearch' | 'confluenceSearch' | 'jiraSearch'
```

### C-2. 라우트 맵 등록

**`src/app/layouts/route-map.ts`**
```diff
+ const ConfluenceSearchPage: LazyPage = lazy(() => import('@/pages/confluence-search/ConfluenceSearchPage').then((m) => ({ default: m.ConfluenceSearchPage })))
+ const JiraSearchPage: LazyPage = lazy(() => import('@/pages/jira-search/JiraSearchPage').then((m) => ({ default: m.JiraSearchPage })))

  export const ROUTE_MAP: Partial<Record<ViewState, LazyPage>> = {
    ...
    internalSearch: InternalSearchPage,
+   confluenceSearch: ConfluenceSearchPage,
+   jiraSearch: JiraSearchPage,
  }
```

### C-3. 사이드바 네비게이션

**`src/widgets/sidebar/Sidebar.tsx`** (기존 `internalSearch` 항목 근처)
```diff
  <SidebarItem
    icon={Building2}
    label={t('sidebar.internalSearch')}
    onClick={() => handleViewChange('internalSearch')}
  />
+ <SidebarItem
+   icon={FileText}
+   label={t('sidebar.confluenceSearch')}
+   onClick={() => handleViewChange('confluenceSearch')}
+ />
+ <SidebarItem
+   icon={Bug}
+   label={t('sidebar.jiraSearch')}
+   onClick={() => handleViewChange('jiraSearch')}
+ />
```

### C-4. tool-integration store 강화

**`src/entities/tool-integration/tool-integration.store.ts`**

수정 사항:
1. `testConnection`을 실제 백엔드 `/api/verify/atlassian` 호출로 교체
2. 자격증명을 `AtlassianConfig`에서 app2의 `AtlassianCreds` 필드명으로 매핑 (또는 어댑터 레이어 추가)
3. (선택) Bedrock 자격증명 추가 — hchat-pwa는 Modal 서버 사이드에서 처리하므로, 별도 Bedrock 모델 선택만 추가하거나 기본 모델 사용

```diff
  interface AtlassianConfig {
    baseUrl: string      // → domain (app2 API의 atlassian.domain)
    email: string
    apiToken: string     // → api_token (app2 API의 atlassian.api_token)
    connected: boolean
+   displayName?: string // 인증 성공 시 표시명
+   accountId?: string   // 인증 성공 시 계정 ID
  }

- testConnection: async (type) => {
-   // 필드 검증만 수행
-   return true
- }
+ testConnection: async (type) => {
+   // 실제 백엔드 API 호출
+   const result = await verifyAtlassian(config)
+   set에 connected: true, displayName 등 저장
+ }
```

### C-5. i18n 키 추가

**`src/shared/i18n/ko.ts`** 및 **`src/shared/i18n/en.ts`**
```
추가 키:
  'sidebar.confluenceSearch': 'Confluence 검색' / 'Confluence Search'
  'sidebar.jiraSearch': 'Jira 검색' / 'Jira Search'
  'confluence.title': 'Confluence 문서 검색'
  'confluence.searchPlaceholder': 'API 스펙, 온보딩...'
  'confluence.spaceKeys': '공간 키 (쉼표 구분)'
  'confluence.pageIds': '페이지 ID 직접 입력'
  'confluence.aiSummary': 'AI 요약'
  'confluence.summarized': '요약됨'
  'confluence.empty': '검색어나 공간 키, 페이지 ID를 입력하여 검색하세요'
  'jira.title': 'Jira 티켓 검색'
  'jira.searchPlaceholder': '로그인 오류, 배포 이슈...'
  'jira.projectKeys': '프로젝트 키 (쉼표 구분)'
  'jira.ticketIds': '티켓 번호 직접 입력'
  'jira.aiAnalysis': 'AI 분석'
  'jira.analyzed': '분석됨'
  'jira.empty': '검색어나 프로젝트 키, 티켓 번호를 입력하여 검색하세요'
  'atlassian.lockScreen.title': '연결 설정이 필요합니다'
  'atlassian.lockScreen.desc': '설정에서 Atlassian 토큰을 등록하고 연결을 확인하세요'
  'atlassian.lockScreen.goSettings': '설정으로 이동'
  'atlassian.aiOverview': '검색 개요'
  'atlassian.tip': '팁'
  ... (약 25개 키 추가)
```

### C-6. InternalSearchPage 연동 (선택)

**`src/pages/internal-search/InternalSearchPage.tsx`**

기존 Mock 데이터를 실제 API 호출로 교체:
- `useToolIntegrationStore`에서 자격증명 가져오기
- `atlassian-client.ts`의 `searchConfluence` / `searchJira` 호출
- 또는 기존 `/api/tools/search` 엔드포인트 활용
- 결과를 `SearchResult` 인터페이스에 매핑

### C-7. 백엔드 app.py 라우트 등록

**`backend/app.py`**
```diff
+ from backend.routes.confluence import router as confluence_router
+ from backend.routes.jira_routes import router as jira_router
+ from backend.routes.verify import router as verify_router

+ web_app.include_router(confluence_router, prefix="/api")
+ web_app.include_router(jira_router, prefix="/api")
+ web_app.include_router(verify_router, prefix="/api")
```

### C-8. Settings UI 강화 (선택)

**`src/pages/settings/ToolIntegrationSection.tsx`**

현재 `testConnection`이 필드 유무만 검증하므로, 실제 API 호출 결과를 반영하도록 수정:
- 성공 시 `displayName` 표시
- 실패 시 상세 에러 메시지 표시
- 연결 상태 아이콘 개선

---

## D. ViewState 라우팅 추가 방법

### D-1. 단계별 절차

1. **`src/shared/types/index.ts`** — `ViewState` union에 `'confluenceSearch' | 'jiraSearch'` 추가
2. **`src/app/layouts/route-map.ts`** — `lazy()` import + `ROUTE_MAP` 매핑 추가
3. **`src/widgets/sidebar/Sidebar.tsx`** — `SidebarItem` 2개 추가 (lucide 아이콘: `FileText`, `Bug`)
4. **`src/shared/i18n/ko.ts`, `en.ts`** — 사이드바 라벨 키 추가

### D-2. 기존 `internalSearch`와의 관계

- `internalSearch` (사내검색)은 **통합 검색** 역할 유지 — Confluence + Jira 결과를 한 화면에 표시
- `confluenceSearch`, `jiraSearch`는 **전용 검색** — 각 도구에 특화된 필터(공간 키, 프로젝트 키, ID 직접 입력) + AI 요약/분석 제공
- 사이드바에서 3개 모두 노출하거나, `internalSearch` 내에서 탭으로 Confluence/Jira 전용 모드 전환도 가능

### D-3. 권장 구조

```
사이드바:
  ├── 사내검색 (internalSearch) — 통합 검색 (간단)
  ├── Confluence 검색 (confluenceSearch) — 전용 상세 검색
  └── Jira 검색 (jiraSearch) — 전용 상세 검색
```

---

## E. Zustand Store 설계

### E-1. app2 hooks → Zustand 변환 패턴

**app2 패턴 (React useState + useCallback)**:
```typescript
// app2: features/confluence-search/model/index.ts
function useConfluenceSearch(atlassian, bedrock) {
  const [pages, setPages] = useState([])
  const search = useCallback(async (params) => { ... }, [atlassian, bedrock])
  return { pages, search, ... }
}
```

**hchat-pwa 패턴 (Zustand store)**:
```typescript
// hchat-pwa: entities/confluence-search/confluence-search.store.ts
export const useConfluenceSearchStore = create<ConfluenceSearchState>((set, get) => ({
  pages: [],
  loading: false,
  search: async (query, spaceKeys, pageIds) => {
    const { confluence } = useToolIntegrationStore.getState()
    set({ loading: true, pages: [], aiOverview: null })
    try {
      const creds = mapToAtlassianCreds(confluence)
      const res = await searchConfluence({ atlassian: creds, query, space_keys: spaceKeys, page_ids: pageIds })
      set({ pages: res.results.map(createPageVM), aiOverview: res.ai_overview, total: res.total })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },
  summarize: async (pageId) => {
    const { confluence } = useToolIntegrationStore.getState()
    set(state => ({
      pages: state.pages.map(p => p.id === pageId ? { ...p, is_summarizing: true } : p)
    }))
    // API 호출 후 ai_summary 업데이트
  }
}))
```

### E-2. 자격증명 접근 패턴

app2는 props로 `atlassian`, `bedrock`을 전달하지만, hchat-pwa에서는:
- `useToolIntegrationStore`에서 자격증명을 가져옴
- 검색 store 내부에서 `useToolIntegrationStore.getState()`로 크로스 스토어 접근
- 매핑 함수로 필드명 변환: `{ baseUrl → domain, apiToken → api_token }`

### E-3. 자격증명 매핑 유틸

**`src/shared/lib/api/atlassian-creds-mapper.ts`** (신규)
```typescript
function mapToAtlassianCreds(config: AtlassianConfig): AtlassianCreds {
  return {
    domain: config.baseUrl,
    email: config.email,
    api_token: config.apiToken,
  }
}
```

### E-4. Bedrock 자격증명 전략

app2는 클라이언트에서 Bedrock 자격증명을 직접 받아 백엔드로 전달하지만, hchat-pwa의 Modal 백엔드는 서버 사이드에서 AWS 인증을 처리.

**결정 필요**:
- **옵션 A (권장)**: Modal 백엔드에서 기존 Bedrock 인증 사용. 프론트에서 Bedrock 자격증명 입력 불필요. 백엔드 엔드포인트가 `bedrock` 필드 대신 서버 환경변수 사용.
- **옵션 B**: app2처럼 프론트에서 Bedrock 자격증명을 입력받아 전달. `ToolIntegrationStore`에 `bedrockConfig` 필드 추가.

---

## F. UI 컴포넌트 매핑

### F-1. 재활용 가능한 hchat-pwa 기존 컴포넌트

| app2 컴포넌트 | hchat-pwa 기존 | 재활용 방법 |
|---------------|---------------|-------------|
| `Button` (primary/gold/ghost/danger) | `src/shared/ui/Button.tsx` | 직접 사용. `variant` 매핑: gold→primary 또는 신규 variant 추가 |
| `Spinner` | 없음 (Loader2 아이콘 사용) | lucide `Loader2` + `animate-spin` 클래스로 대체 |
| `Card` | 없음 | `<div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">` Tailwind로 직접 작성 |
| `Badge` (blue/gold/green/red/gray/purple) | 없음 | 신규 `src/shared/ui/Badge.tsx` 생성 또는 Tailwind 유틸 클래스로 직접 처리 |
| `Input` (label + hint) | `src/shared/ui/FormInput.tsx` + `FormLabel.tsx` | 기존 FormInput/FormLabel 조합으로 대체 |
| `EmptyState` | 없음 (각 페이지에서 인라인 구현) | 기존 패턴 따라 인라인 작성 |
| `ToastList` | `src/shared/ui/ToastContainer.tsx` + `useToastStore` | 기존 Toast 시스템 직접 사용 |
| `StatusDot` | `ToolIntegrationSection.tsx`에 로컬 구현 | 공유 컴포넌트로 추출하거나 인라인 유지 |
| `AiBlock` | 없음 | 신규 생성 필요 |

### F-2. 신규 생성 필요 컴포넌트

1. **`AiBlock`** — AI 분석/요약 결과 표시. app2의 inline style을 Tailwind로 변환
2. **`PageCard`** — Confluence 페이지 결과 카드. Badge, Button 등 기존 컴포넌트 활용
3. **`TicketCard`** — Jira 티켓 결과 카드. 상태/우선순위 색상 매핑 포함
4. **`LockScreen`** — 미인증 상태 안내. Settings 이동 액션 포함
5. **`Badge`** (선택) — 범용 Badge 컴포넌트. 6가지 variant (blue/gold/green/red/gray/purple)

### F-3. 스타일 변환 규칙

| app2 (inline style) | hchat-pwa (Tailwind/CSS vars) |
|---------------------|-------------------------------|
| `var(--bg-surface)` | `bg-[var(--bg-secondary)]` |
| `var(--border-dim)` | `border-[var(--border)]` |
| `var(--text-primary)` | `text-[var(--text-primary)]` |
| `var(--text-muted)` | `text-[var(--text-secondary)]` |
| `var(--accent-blue)` | `text-[var(--primary)]` |
| `var(--accent-gold)` | `text-amber-500` |
| `var(--accent-green)` | `text-green-500` |
| `var(--radius-lg)` | `rounded-lg` |
| `var(--radius-md)` | `rounded-md` |
| `var(--font-mono)` | `font-mono` |

---

## G. 자격증명 관리

### G-1. 현재 구조

- **hchat-pwa**: `useToolIntegrationStore`가 `{ baseUrl, email, apiToken, connected }` 관리. Zustand in-memory (persist 없음!)
- **app2**: `useCredentials`가 `sessionStorage`에 저장. `AtlassianCreds` + `BedrockCreds` 분리.

### G-2. 통합 방안

**1단계: 기존 store 필드명 유지, 매핑 레이어 추가**
```
useToolIntegrationStore.confluence.baseUrl  →  API 요청 시 { domain: baseUrl }
useToolIntegrationStore.confluence.apiToken →  API 요청 시 { api_token: apiToken }
```
- 기존 Settings UI (`ToolIntegrationSection.tsx`)는 변경 없음
- `atlassian-creds-mapper.ts`에서 변환

**2단계: persist 추가 (보안 고려)**
- 현재 `useToolIntegrationStore`는 IndexedDB persist가 없음
- 옵션:
  - (A) `db.ts`에 테이블 추가 + hydrate/persist 구현 → 영구 저장 (암호화 필요)
  - (B) `sessionStorage` 사용 (app2 방식) → 탭 종료 시 소멸 (보안 우수)
  - **(C) 권장**: 기존 `db.ts`의 `encrypt`/`decrypt` 유틸 활용하여 IndexedDB에 암호화 저장

**3단계: 실제 연결 테스트**
- `testConnection`을 `/api/verify/atlassian` 호출로 교체
- 성공 시 `connected: true` + `displayName` 저장
- `isReady` 계산: `confluence.connected` (Bedrock는 서버 사이드이므로 별도 검증 불필요)

### G-3. Bedrock 자격증명 결정

hchat-pwa의 Modal 백엔드(`backend/app.py`)는 이미 AWS Bedrock를 서버 사이드에서 처리:
- Modal Secrets에 AWS 키 저장
- 프론트엔드는 Bedrock 자격증명을 알 필요 없음

따라서 app2의 `BedrockCreds`를 프론트에서 관리할 필요 없음. 백엔드 엔드포인트에서 `bedrock` 파라미터를 제거하고 서버 환경변수 사용.

**단, AI 요약/분석 요청 시** 백엔드가 어떤 모델을 사용할지는 설정 필요:
- 기존 `SettingsStore.selectedModel`을 활용하거나
- AI 요약 전용 모델을 백엔드에서 고정 (haiku 4.5 → 비용 최적화)

---

## H. 구현 순서 (단계별)

### Phase 1: 기반 (의존성 없음) — 예상 1일

| 순서 | 작업 | 파일 |
|------|------|------|
| 1-1 | 타입 정의 | `src/shared/types/atlassian.ts` |
| 1-2 | 자격증명 매핑 유틸 | `src/shared/lib/api/atlassian-creds-mapper.ts` |
| 1-3 | API 클라이언트 | `src/shared/lib/api/atlassian-client.ts` |
| 1-4 | ViewState 타입 추가 | `src/shared/types/index.ts` 수정 |
| 1-5 | i18n 키 추가 | `src/shared/i18n/ko.ts`, `en.ts` 수정 |

### Phase 2: 백엔드 엔드포인트 — 예상 1일

| 순서 | 작업 | 파일 |
|------|------|------|
| 2-1 | Atlassian 서비스 (HTML 파서, ADF 파서, 헬퍼) | `backend/services/atlassian.py` |
| 2-2 | 인증 검증 라우트 | `backend/routes/verify.py` |
| 2-3 | Confluence 검색/요약 라우트 | `backend/routes/confluence.py` |
| 2-4 | Jira 검색/분석 라우트 | `backend/routes/jira_routes.py` |
| 2-5 | app.py 라우터 등록 | `backend/app.py` 수정 |

### Phase 3: Store + 기존 파일 수정 — 예상 0.5일

| 순서 | 작업 | 파일 |
|------|------|------|
| 3-1 | Confluence 검색 store | `src/entities/confluence-search/confluence-search.store.ts` |
| 3-2 | Jira 검색 store | `src/entities/jira-search/jira-search.store.ts` |
| 3-3 | tool-integration store 강화 (실제 API 검증) | `src/entities/tool-integration/tool-integration.store.ts` 수정 |

### Phase 4: UI 위젯 — 예상 0.5일

| 순서 | 작업 | 파일 |
|------|------|------|
| 4-1 | Badge 공유 컴포넌트 | `src/shared/ui/Badge.tsx` (선택) |
| 4-2 | AiBlock | `src/widgets/atlassian/AiBlock.tsx` |
| 4-3 | PageCard | `src/widgets/atlassian/PageCard.tsx` |
| 4-4 | TicketCard | `src/widgets/atlassian/TicketCard.tsx` |
| 4-5 | LockScreen | `src/widgets/atlassian/LockScreen.tsx` |

### Phase 5: 페이지 + 라우팅 — 예상 1일

| 순서 | 작업 | 파일 |
|------|------|------|
| 5-1 | Confluence 검색 페이지 | `src/pages/confluence-search/ConfluenceSearchPage.tsx` |
| 5-2 | Jira 검색 페이지 | `src/pages/jira-search/JiraSearchPage.tsx` |
| 5-3 | route-map 등록 | `src/app/layouts/route-map.ts` 수정 |
| 5-4 | Sidebar 네비게이션 추가 | `src/widgets/sidebar/Sidebar.tsx` 수정 |

### Phase 6: 기존 페이지 연동 + 강화 — 예상 0.5일

| 순서 | 작업 | 파일 |
|------|------|------|
| 6-1 | InternalSearchPage Mock → 실제 API 연동 | `src/pages/internal-search/InternalSearchPage.tsx` 수정 |
| 6-2 | ToolIntegrationSection 연결 테스트 강화 | `src/pages/settings/ToolIntegrationSection.tsx` 수정 |
| 6-3 | ToolSelector에서 전용 검색 페이지 링크 추가 | `src/widgets/prompt-input/ToolSelector.tsx` 수정 (선택) |

### Phase 7: 테스트 — 예상 1일

| 순서 | 작업 | 목표 |
|------|------|------|
| 7-1 | 타입 + API 클라이언트 단위 테스트 | 매핑 함수, API 호출 mock |
| 7-2 | Zustand store 테스트 | 검색/요약/분석 액션 |
| 7-3 | 컴포넌트 렌더링 테스트 | PageCard, TicketCard, AiBlock |
| 7-4 | 페이지 통합 테스트 | 검색 플로우 E2E |
| 7-5 | 기존 테스트 회귀 확인 | `npm test` 전체 통과 |

**총 예상 소요: 5일**

---

## I. 위험 요소 및 대응

### I-1. 자격증명 보안

| 위험 | 심각도 | 대응 |
|------|--------|------|
| API 토큰이 IndexedDB에 평문 저장 | **HIGH** | `db.ts`의 `encrypt()`/`decrypt()` 활용하여 암호화 저장. 또는 sessionStorage 사용 (탭 종료 시 소멸) |
| 네트워크 요청에 자격증명 노출 | **MEDIUM** | HTTPS 필수. 자격증명은 백엔드로만 전달, 프론트에서 직접 Atlassian API 호출 금지 |

### I-2. 필드명 불일치

| 위험 | 심각도 | 대응 |
|------|--------|------|
| hchat-pwa `baseUrl`/`apiToken` vs app2 `domain`/`api_token` | **MEDIUM** | `atlassian-creds-mapper.ts` 매핑 유틸로 일관성 보장. 기존 Settings UI는 변경 없이 유지 |
| `AtlassianConfig.baseUrl`에 `/wiki` 포함 여부 | **LOW** | 입력 placeholder에 `https://company.atlassian.net` 명시. 백엔드에서 trailing slash 제거 |

### I-3. Bedrock 인증 방식 차이

| 위험 | 심각도 | 대응 |
|------|--------|------|
| app2는 클라이언트에서 Bedrock 키를 전달하지만 hchat-pwa는 서버 사이드 | **HIGH** | 백엔드 엔드포인트 설계 시 `bedrock` 파라미터를 선택적으로 처리. 없으면 서버 환경변수 사용 |
| Modal Secrets 미설정 시 AI 요약 실패 | **MEDIUM** | API 응답에서 `ai_summary: false` 옵션 지원. 프론트에서 AI 기능 비활성화 UI 제공 |

### I-4. 기존 코드 충돌

| 위험 | 심각도 | 대응 |
|------|--------|------|
| `ViewState` union 타입 변경 → 기존 타입 가드/switch 문 영향 | **LOW** | `ROUTE_MAP`이 `Partial<Record<ViewState, ...>>` 이므로 추가만 하면 안전 |
| `backend/routes/tools.py`와 신규 `confluence.py`/`jira_routes.py` URL 충돌 | **MEDIUM** | 기존 `/api/tools/search`는 유지, 신규는 `/api/confluence/search`, `/api/jira/search`로 분리. 점진적 마이그레이션 후 기존 엔드포인트 deprecated |
| i18n 키 충돌 | **LOW** | 기존 `tools.*`, `internalSearch.*` 키 유지. 신규 `confluence.*`, `jira.*`, `atlassian.*` 네임스페이스 사용 |

### I-5. 성능

| 위험 | 심각도 | 대응 |
|------|--------|------|
| AI 요약/분석 요청이 느림 (Bedrock invoke 2-10초) | **MEDIUM** | 로딩 스피너 + 개별 카드 단위 로딩 상태. 전체 검색과 AI 개요는 병렬 불가 (순차) |
| 대량 검색 결과 렌더링 | **LOW** | `max_results: 8` 기본 제한. 필요 시 `react-window` 가상화 적용 |

### I-6. 백엔드 배포

| 위험 | 심각도 | 대응 |
|------|--------|------|
| Modal 서버에 `beautifulsoup4`, `lxml` 의존성 필요 | **MEDIUM** | `requirements.txt`에 추가. Modal의 `image.pip_install()` 확인 |
| Atlassian Cloud/Server API 버전 차이 | **LOW** | Cloud REST API v3 기준으로 구현. Server는 미지원 명시 |

---

## 부록: 파일 경로 전체 목록

### 신규 생성 (16개 파일)

```
src/shared/types/atlassian.ts
src/shared/lib/api/atlassian-client.ts
src/shared/lib/api/atlassian-creds-mapper.ts
src/entities/confluence-search/confluence-search.store.ts
src/entities/jira-search/jira-search.store.ts
src/pages/confluence-search/ConfluenceSearchPage.tsx
src/pages/jira-search/JiraSearchPage.tsx
src/widgets/atlassian/AiBlock.tsx
src/widgets/atlassian/PageCard.tsx
src/widgets/atlassian/TicketCard.tsx
src/widgets/atlassian/LockScreen.tsx
src/widgets/atlassian/index.ts
backend/services/atlassian.py
backend/routes/verify.py
backend/routes/confluence.py
backend/routes/jira_routes.py
```

### 수정 (10개 파일)

```
src/shared/types/index.ts                              — ViewState 2개 추가
src/app/layouts/route-map.ts                            — lazy import + ROUTE_MAP 2개 추가
src/widgets/sidebar/Sidebar.tsx                         — SidebarItem 2개 추가
src/shared/i18n/ko.ts                                   — i18n 키 ~25개 추가
src/shared/i18n/en.ts                                   — i18n 키 ~25개 추가
src/entities/tool-integration/tool-integration.store.ts — testConnection 실제 API 호출로 교체
src/pages/internal-search/InternalSearchPage.tsx        — Mock → 실제 API 연동
src/pages/settings/ToolIntegrationSection.tsx           — 연결 테스트 강화 (선택)
backend/app.py                                          — 라우터 3개 등록
backend/requirements.txt (또는 Modal image)              — beautifulsoup4, lxml 추가
```

### 테스트 파일 (7개)

```
src/entities/confluence-search/__tests__/confluence-search.store.test.ts
src/entities/jira-search/__tests__/jira-search.store.test.ts
src/shared/lib/api/__tests__/atlassian-client.test.ts
src/pages/confluence-search/__tests__/ConfluenceSearchPage.test.tsx
src/pages/jira-search/__tests__/JiraSearchPage.test.tsx
src/widgets/atlassian/__tests__/PageCard.test.tsx
src/widgets/atlassian/__tests__/TicketCard.test.tsx
```
