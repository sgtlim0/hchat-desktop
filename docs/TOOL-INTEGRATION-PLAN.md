# 도구 연동 (Tool Integration) 구현 방안

> 기존 "채널 연동" (Slack/Telegram) -> "도구 연동" (Confluence/Jira + 기존) 변경
> 새 채팅에서 도구 추가 -> Confluence/Jira 활성화

---

## 1. 현재 -> 변경 구조

### Before (채널 연동)
```
Settings > 채널 연동
  ├── Slack (Webhook URL, 채널, 알림 규칙)
  └── Telegram (Bot Token, Chat ID)
```

### After (도구 연동)
```
Settings > 도구 연동
  ├── Confluence (Base URL, Email, API Token)
  ├── Jira (Base URL, Email, API Token)
  ├── Slack (기존 유지)
  └── Telegram (기존 유지)

New Chat > 도구 추가 버튼
  ├── [x] Confluence 검색 활성화
  ├── [x] Jira 검색 활성화
  └── 검색 시 자동으로 사내 문서 참조
```

---

## 2. 파일 변경 계획

### 2-1. 타입 정의 (src/shared/types/index.ts)
```typescript
// 기존 SlackConfig, TelegramConfig 유지

export interface AtlassianConfig {
  baseUrl: string      // https://company.atlassian.net
  email: string        // user@company.com
  apiToken: string     // ATAT...
  connected: boolean
}

export interface ToolConfig {
  confluence: AtlassianConfig
  jira: AtlassianConfig
  slack: SlackConfig
  telegram: TelegramConfig
}

// 채팅별 활성 도구
export interface ActiveTools {
  confluence: boolean
  jira: boolean
}
```

### 2-2. 도구 스토어 (src/entities/tool-integration/tool-integration.store.ts)
기존 channel.store.ts를 확장하거나 새 스토어 생성:
- confluence/jira 설정 CRUD
- 연결 테스트 (POST /api/tools/test-connection)
- 세션별 activeTools 상태 관리

### 2-3. 백엔드 엔드포인트 (backend/routes/tools.py)
```python
POST /api/tools/test-connection  # Atlassian API 연결 테스트
POST /api/tools/search           # Confluence + Jira 통합 검색
GET  /api/tools/confluence/page  # 페이지 내용 가져오기
GET  /api/tools/jira/issue       # 이슈 상세 가져오기
```

### 2-4. 설정 UI (Settings > Tool Integration 탭)
- Confluence 설정 폼 (Base URL, Email, API Token, 연결 테스트)
- Jira 설정 폼 (같은 Atlassian 계정 공유 옵션)
- 기존 Slack/Telegram 유지

### 2-5. 채팅 UI 도구 추가
- PromptInput 옆에 도구 아이콘 버튼
- 클릭 시 도구 선택 팝오버 (Confluence ON/OFF, Jira ON/OFF)
- 활성화 시 메시지 전송 전 자동 검색 + RAG 컨텍스트 주입

---

## 3. 구현 순서

### Phase 54: Tool Integration Store + Types
- T1: AtlassianConfig 타입 정의
- T2: tool-integration.store.ts (설정 CRUD + 연결 테스트)
- T3: ActiveTools 세션별 상태
- T4: i18n 키 추가

### Phase 55: Backend Atlassian Endpoints
- T5: backend/routes/tools.py (Atlassian client)
- T6: Confluence CQL 검색
- T7: Jira JQL 검색
- T8: 통합 검색 엔드포인트

### Phase 56: Settings UI + Chat Integration
- T9: Settings Tool Integration 탭 UI
- T10: PromptInput 도구 추가 버튼
- T11: 자동 검색 + RAG 컨텍스트 주입
