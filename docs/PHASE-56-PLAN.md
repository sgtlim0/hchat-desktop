# Phase 56: Settings Tool Integration UI + Chat Tool Injection

> Date: 2026-03-08 | Base: Phase 55 (c0e50a2)
> Goal: Settings에 도구 연동 탭 + 채팅에서 도구 활성화 버튼

---

## Features

### F1: Settings Tool Integration Tab (Worker - worktree)
**Zone**: src/pages/settings/ (new section in existing SettingsScreen)
**Scope**:
- Confluence 설정 폼 (Base URL, Email, API Token)
- Jira 설정 폼 (같은 계정 공유 옵션)
- 연결 테스트 버튼 + 상태 표시 (green/red dot)
- 기존 Slack/Telegram 하단에 배치
- tool-integration.store 연동

### F2: PromptInput Tool Selector (Worker - worktree)
**Zone**: src/widgets/prompt-input/ (new component)
**Scope**:
- PromptInput 옆에 도구 아이콘 버튼 (Wrench icon)
- 클릭 시 팝오버: Confluence ON/OFF, Jira ON/OFF 토글
- 활성화 상태를 세션별로 저장
- 비활성 시 "도구 연동 설정 필요" 안내

### F3: Chat Tool Context Injection (PM - main)
**Zone**: src/widgets/prompt-input/PromptInput.tsx (conflict zone)
**Scope**:
- 도구 활성화 시 메시지 전송 전 자동 사내 검색
- 검색 결과를 시스템 프롬프트에 RAG 컨텍스트로 주입
- buildAtlassianContext() 활용
- 검색 중 상태 표시

### F4: i18n + Tests (PM - main)
**Zone**: Conflict zone files
**Scope**:
- settings 관련 i18n 키 추가
- ToolSelector 컴포넌트 테스트
- Integration tests

---

## Worktree Agent Assignment

```
Phase 56 Execution:
  [Worker 1] feat/settings-tools (worktree)
    Agent: tdd-guide
    Files: src/pages/settings/ (new section only)

  [Worker 2] feat/tool-selector (worktree)
    Agent: tdd-guide
    Files: src/widgets/prompt-input/ToolSelector.tsx (new file)

  [PM] main
    Files: PromptInput.tsx (integration), i18n, tests
```

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Settings tabs | No tool section | Confluence/Jira config |
| Chat tools | None | Tool selector button |
| Context injection | Manual | Auto RAG from Atlassian |
| i18n keys | 1706 | ~1730 |
