# Git Worktree Agent Orchestration Plan

> Date: 2026-03-08 | For hchat-pwa parallel agent execution

---

## Overview

PM/Worker 분리 구조로 git worktree 기반 병렬 에이전트 실행.

| Role | Responsibility |
|------|---------------|
| **PM (Main Agent)** | 기획, 워크트리 생성, 에이전트 배정, 결과 검증, 머지 결정 |
| **Worker (Worktree Agent)** | 기능 구현, 테스트 작성, 자기 영역만 작업 |

---

## Conflict Zone Map

These files are modified by almost every feature and MUST NOT be assigned to worktree workers:

| File | Risk | Strategy |
|------|------|----------|
| `src/app/layouts/MainLayout.tsx` | HIGH | PM integration only |
| `src/shared/types/index.ts` | HIGH | PM integration only |
| `src/shared/i18n/ko.ts`, `en.ts` | HIGH | PM integration only |
| `src/shared/lib/db.ts` | MEDIUM | PM integration only |
| `src/app/layouts/route-map.ts` | MEDIUM | PM integration only |
| `vite.config.ts` | LOW | PM integration only |
| `package.json` | LOW | PM integration only |

---

## Parallelizable Zones (Safe for Workers)

| Zone | Files | Conflict Risk |
|------|-------|--------------|
| `src/shared/lib/` (new utils) | New files only | NONE |
| `src/shared/ui/` (new components) | New files only | NONE |
| `src/entities/*/` (new stores) | New directory | NONE |
| `src/pages/*/` (new pages) | New directory | NONE |
| `e2e/` (new specs) | New files only | NONE |
| `.github/workflows/` | Config files | NONE |
| `backend/routes/` (new endpoints) | New files | NONE |
| `src/shared/lib/__tests__/` | New test files | NONE |

---

## Worktree Creation Pattern

```bash
# PM creates worktrees
git worktree add .claude/worktrees/feat-name -b feat/phase-N-feature-name

# Worker agent assigned via Agent tool
Agent(
  isolation: "worktree",
  subagent_type: "tdd-guide",
  prompt: "...",
  run_in_background: true
)

# PM merges results
cp .claude/worktrees/feat-name/src/... src/...
git worktree remove .claude/worktrees/feat-name --force
```

---

## Agent Assignment Matrix Template

```
Phase N Execution:
  [Parallel Workers - no conflict zone files]
  ├── W1: feat/feature-a  (agent: tdd-guide)
  │   Scope: src/shared/lib/new-util.ts + tests
  │
  ├── W2: feat/feature-b  (agent: e2e-runner)
  │   Scope: e2e/new-spec.ts
  │
  └── W3: feat/feature-c  (agent: general-purpose)
      Scope: .github/workflows/new.yml

  [PM Integration - conflict zone files]
  ├── MainLayout.tsx modifications
  ├── i18n key additions (ko.ts, en.ts)
  ├── types/index.ts ViewState additions
  └── route-map.ts new page registrations
```

---

## Lessons Learned (Phase 41)

1. **Rate limiting**: Too many concurrent agents (4+) causes 503 errors
2. **Git config lock**: Concurrent worktree creation races on .git/config.lock
3. **PM fallback**: PM should implement directly if workers are slow/stalled
4. **Optimal concurrency**: 2-3 worktree agents max, stagger creation by 3s
5. **Copy > merge**: For small changes, cp files is safer than git merge

---

## Recommended Workflow

1. PM creates Phase plan (features, files, dependencies)
2. Identify features touching ONLY safe zones
3. Create 2-3 worktrees max (staggered by 3s to avoid lock race)
4. Assign worker agents with explicit file boundaries
5. PM works on conflict-zone integrations in parallel
6. Verify worker outputs, copy approved files to main
7. Clean up worktrees
8. Run full test suite
9. Commit and push
