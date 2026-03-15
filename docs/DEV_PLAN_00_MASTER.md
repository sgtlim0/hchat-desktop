# H Chat 에이전틱 엔터프라이즈 — 마스터 개발 계획

> 작성일: 2026-03-14 | PM 총괄 | Worker A~D 병렬 작성 통합
> 기반: The Agentic Enterprise + Autonomous Browser OS 설계 문서 11건

---

## 1. 프로젝트 개요

### 비전
> "The Browser is the New OS" + "To move fast but to govern faster"

기업 내부 데이터 주권을 보장하면서, 웹을 데이터베이스로 활용하는 자율형 AI 에이전트 플랫폼을 구축한다.

### 범위

| 영역 | 설계 문서 | 핵심 산출물 |
|------|----------|-----------|
| Browser OS 4-Layer | IMPL_BROWSER_OS_01~04 | Extension + Smart DOM + DataFrame + MARS |
| 소버린 데이터 | IMPL_01 | RAG 파이프라인 (Qdrant + Kafka + Flink) |
| 에이전트 오케스트레이션 | IMPL_02 (블루프린트) | LangGraph + CrewAI 멀티 에이전트 |
| Self-Healing | IMPL_04 | 자가 치유 루프 (진단→치유→검증→배포) |
| 보안 거버넌스 | IMPL_05 | Zero Trust + Kill Switch + 감사 |
| Multi-Model | IMPL_BROWSER_OS_03 | Orchestrator Node 동적 라우팅 |

---

## 2. 통합 로드맵 총괄

```mermaid
gantt
    title H Chat 에이전틱 엔터프라이즈 마스터 로드맵 (30주)
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section Sprint 0: MVP (2주)
    14-Day MVP                :s0, 2026-04-01, 14d

    section Phase 1: 기반 (8주)
    Sprint 1 소버린 데이터 기반 :p1s1, 2026-04-15, 14d
    Sprint 2 Smart DOM 고도화  :p1s2, 2026-04-29, 14d
    Sprint 3 단일 에이전트      :p1s3, 2026-05-13, 14d
    Sprint 4 CDP + Stealth     :p1s4, 2026-05-27, 14d

    section Phase 2: 핵심 (8주)
    Sprint 5 MARS 멀티에이전트   :p2s5, 2026-06-10, 14d
    Sprint 6 데이터 커넥터       :p2s6, 2026-06-24, 14d
    Sprint 7 HITL + Teams       :p2s7, 2026-07-08, 14d
    Sprint 8 DataFrame 프로덕션  :p2s8, 2026-07-22, 14d

    section Phase 3: 통합 (8주)
    Sprint 9 Multi-Model        :p3s9, 2026-08-05, 14d
    Sprint 10 Self-Healing      :p3s10, 2026-08-19, 14d
    Sprint 11 AutoResearch      :p3s11, 2026-09-02, 14d
    Sprint 12 보안 거버넌스      :p3s12, 2026-09-16, 14d

    section Phase 4: 프로덕션 (4주)
    Sprint 13 통합 테스트 + 심사  :p4s13, 2026-09-30, 14d
    Sprint 14 Canary + GA        :p4s14, 2026-10-14, 14d
```

---

## 3. Phase 요약

| Phase | 기간 | 스프린트 | 핵심 목표 | 상세 계획 |
|-------|------|---------|----------|----------|
| **Sprint 0** | 2주 | — | Browser OS 14일 MVP, 기술 검증 | [DEV_PLAN_01](./DEV_PLAN_01_SPRINT_0.md) |
| **Phase 1** | 8주 | S1~S4 | 소버린 데이터, 3 Pillars, 단일 에이전트 | [DEV_PLAN_02](./DEV_PLAN_02_PHASE_1_2.md) |
| **Phase 2** | 8주 | S5~S8 | MARS 멀티 에이전트, HITL, 커넥터 | [DEV_PLAN_02](./DEV_PLAN_02_PHASE_1_2.md) |
| **Phase 3** | 8주 | S9~S12 | Multi-Model, Self-Healing, 거버넌스 | [DEV_PLAN_03](./DEV_PLAN_03_PHASE_3_4.md) |
| **Phase 4** | 4주 | S13~S14 | 통합 테스트, Canary 배포, GA | [DEV_PLAN_03](./DEV_PLAN_03_PHASE_3_4.md) |
| **Cross-cutting** | 전 구간 | — | 테스트, CI/CD, 팀 구성 | [DEV_PLAN_04](./DEV_PLAN_04_TEST_CICD_TEAM.md) |

---

## 4. 에픽 총괄 (15개 에픽)

| # | 에픽 | Phase | 스토리 수 | 핵심 기술 |
|---|------|-------|----------|----------|
| E01 | Chrome Extension Hybrid + Stealth | S0+P1 | 5 | MV3, CDP, Stealth |
| E02 | Smart DOM (Readability.js + RQFP) | S0+P1 | 4 | Readability.js, RQFP |
| E03 | DataFrame Engine | S0+P2 | 4 | HTML→JSON, Pandas |
| E04 | MARS 기본 파이프라인 | S0+P2 | 5 | LangGraph, CrewAI |
| E05 | 소버린 데이터 파이프라인 | P1 | 5 | Kafka, Flink, Qdrant |
| E06 | RAG 통합 | P1 | 4 | Embedding, Retrieval |
| E07 | 단일 에이전트 오케스트레이션 | P1 | 3 | LangGraph StateGraph |
| E08 | MARS 멀티 에이전트 (5종) | P2 | 5 | CrewAI, LangGraph |
| E09 | Human-in-the-Loop | P2 | 4 | Teams, 승인 플로우 |
| E10 | 데이터 커넥터 (Confluence/SharePoint/ERP) | P2 | 4 | Kafka Connect |
| E11 | Dynamic Multi-Model Orchestrator | P3 | 5 | Orchestrator Node |
| E12 | Self-Healing 루프 | P3 | 5 | AST, Tree-sitter, OTel |
| E13 | 보안 거버넌스 프레임워크 | P3 | 5 | OPA, Vault, Zero Trust |
| E14 | 통합 테스트 + 보안 심사 | P4 | 3 | Playwright, k6, OWASP |
| E15 | Canary 배포 + GA | P4 | 3 | Docker, Actions, Grafana |

---

## 5. 마일스톤 및 판정 기준

| 마일스톤 | 시점 | 판정 기준 |
|---------|------|----------|
| **M0: MVP 완료** | Day 14 | Smart DOM 작동, 단일 에이전트 보고서 생성, 데모 가능 |
| **M1: P1 완료** | Week 10 | RAG 정확도 85%+, 자동화 성공률 60%+, 단일 에이전트 안정 |
| **M2: P2 완료** | Week 18 | 5종 에이전트 가동, HITL Teams 연동, DataFrame 프로덕션 |
| **M3: P3 완료** | Week 26 | Multi-Model 동적 라우팅, Self-Healing 55%+, Kill Switch |
| **M4: GA 릴리스** | Week 30 | 보안 심사 통과, Canary 100%, SLA 달성 |

---

## 6. 팀 구성 요약

| 역할 | 인원 | 주요 책임 | 필요 스킬 |
|------|------|---------|----------|
| PM | 1 | 전체 조율, 스프린트 관리, 이해관계자 소통 | Agile, 기술 이해 |
| FE 엔지니어 | 2 | Extension, Desktop, Admin UI | React 19, TypeScript, MV3 |
| BE 엔지니어 | 3 | ai-core, 에이전트, 파이프라인 | Python, FastAPI, LangGraph |
| ML 엔지니어 | 1 | 임베딩, RAG, Self-Healing 진단 | LLM, Tree-sitter, pgvector |
| Infra/DevOps | 1 | CI/CD, Docker, 모니터링 | Actions, OTel, Grafana |
| QA | 1 | 테스트 전략, E2E, 보안 테스트 | Playwright, k6, OWASP |
| **합계** | **9명** | | |

---

## 7. 예산 총괄

| 항목 | Sprint 0 | Phase 1-2 | Phase 3-4 | 총계 |
|------|---------|----------|----------|------|
| 인건비 (9명) | $30K | $240K | $180K | **$450K** |
| LLM API | $1K | $15K | $20K | **$36K** |
| 인프라 (클라우드/DB) | $1K | $10K | $15K | **$26K** |
| 도구/라이선스 | $0 | $5K | $5K | **$10K** |
| **합계** | **$32K** | **$270K** | **$220K** | **$522K** |

### 연간 기대 절감

| 항목 | 절감액 |
|------|--------|
| 웹 리서치 자동화 | $200K |
| IT 헬프데스크 자동화 | $150K |
| 인시던트 자동 복구 | $100K |
| 데이터 입력 자동화 | $100K |
| **총 절감** | **$550K/년** |
| **투자 회수** | **~12개월** |
| **3년 ROI** | **~270%** |

---

## 8. Worker 결과 통합 요약

### 8.1 Sprint 0 상세 (Worker A — 475줄)

| 항목 | 수치 |
|------|------|
| 총 태스크 | **42개** (T01~T42) |
| 총 공수 | ~125시간 |
| 담당 분포 | FE 22건 / BE 5건 / Full-stack 15건 |
| 체크포인트 | Day 3, 5, **7(중간데모)**, 10, 12, **14(최종데모)** |
| Go/No-Go | Must 4개 + Should 4개 (6/8 이상 통과 시 Go) |
| Scope 축소 | Level 1(1~2일) → Level 2(3~4일) → Level 3(5일+) 3단계 |

**Day 7 중간 데모 (3분)**: Extension 활성화 → 뉴스 페이지 분석 → AI 요약 → 도메인 전환 테스트
**Day 14 최종 데모 (5분)**: "See → Extract → Act" E2E — L1 Extension → L2 Smart DOM → L3 DataFrame → L4 MARS 자율 실행

### 8.2 Phase 1-2 상세 (Worker B — 393줄)

| Phase | 에픽 | 스토리 | SP | 핵심 |
|-------|------|--------|-----|------|
| Phase 1 (S1~S4) | 4개 | 15개 | 70 SP | 소버린 데이터, 3 Pillars, 에이전트 기본, 인프라 |
| Phase 2 (S5~S8) | 4개 | 16개 | 83 SP | MARS 멀티에이전트, DataFrame, HITL, 커넥터 |
| **합계** | **8개** | **31개** | **153 SP** | |

**핵심 병렬화 포인트**: FE(Extension UI) / BE(에이전트 엔진) / Infra(Kafka+Qdrant) 동시 진행
**고부하 리스크**: Sprint 6~7 (HITL + 커넥터 동시 개발) → 인력 재배치 필요

### 8.3 Phase 3-4 상세 (Worker C — 407줄)

| Phase | 에픽 | 스토리 | SP | 핵심 |
|-------|------|--------|-----|------|
| Phase 3 (S9~S12) | 4개 | 17개 | 112 SP | Multi-Model, Self-Healing, AutoResearch, 보안 |
| Phase 4 (S13~S15) | 3개 | 11개 | 50 SP | 통합테스트, 보안심사, 프로덕션 |
| **합계** | **7개** | **28개** | **162 SP** | |

**Canary 배포**: 5% → 25% → 100% (3단계, 자동 롤백 조건 4가지)
**보안 심사**: OWASP Top 10 + 에이전트 보안 6항목 + 데이터 주권 5항목 = **21개 체크리스트**
**프로덕션 Runbook**: 배포 전(D-3~D-1) 8단계 → 배포 중(D-Day) 9단계 → 배포 후(D+1~D+7) 5단계, 롤백 목표 **10분 이내**

### 8.4 테스트 + CI/CD + 팀 (Worker D — 352줄)

**테스트 피라미드**:

| 계층 | 목표 수 | 도구 |
|------|--------|------|
| Unit | 12,000+ | Vitest |
| Integration | 1,800+ | Vitest + MSW |
| E2E | 120+ 파일 | Playwright |
| Performance | 30+ 시나리오 | k6 |
| Security | 50+ 체크 | OWASP ZAP |
| **총계** | **14,500+** | |

**CI/CD**: 기존 5 + 신규 10 = **15개 워크플로우** (agent-test, healing-verify, canary-deploy, security-gate, chaos-test 등)
**팀 구성**: **11명** (PM 1, FE 3, BE 3, ML/AI 2, Infra 1, QA 1) + 6회 교차 교육
**Top 10 리스크**: 심각 1건(Browser OS 복잡도), 높음 3건(LLM 비용, 에이전트 안정성, 보안)
**품질 게이트**: Phase 전환 시 10개 기준 (커버리지, 보안, 성능, Flaky 테스트율, 기술 부채)

---

## 9. 전체 수치 총괄

| 항목 | 수치 |
|------|------|
| 총 기간 | **30주** |
| 총 스프린트 | **15개** (Sprint 0 + S1~S14) |
| 총 에픽 | **15개** |
| 총 유저 스토리 | **59+개** |
| Sprint 0 태스크 | **42개** (T01~T42) |
| Phase 1-2 SP | **153 SP** |
| Phase 3-4 SP | **162 SP** |
| **총 스토리 포인트** | **315+ SP** |
| 테스트 목표 | **14,500+개** |
| CI/CD 워크플로우 | **15개** |
| 팀 규모 | **11명** |
| 총 예산 | **$522K** |
| 연간 절감 | **$550K** |
| 투자 회수 | **~12개월** |
| 3년 ROI | **~270%** |

---

## 10. 상세 계획 문서 인덱스

| # | 문서 | Worker | 크기 | 라인 | 핵심 내용 |
|---|------|--------|------|------|---------|
| 01 | [DEV_PLAN_01_SPRINT_0.md](./DEV_PLAN_01_SPRINT_0.md) | A | 23K | 475줄 | 42 태스크, Day별 Gantt, Go/No-Go |
| 02 | [DEV_PLAN_02_PHASE_1_2.md](./DEV_PLAN_02_PHASE_1_2.md) | B | 19K | 393줄 | Sprint 1~8, 31 스토리, 153 SP |
| 03 | [DEV_PLAN_03_PHASE_3_4.md](./DEV_PLAN_03_PHASE_3_4.md) | C | 20K | 407줄 | Sprint 9~15, 28 스토리, 162 SP, Runbook |
| 04 | [DEV_PLAN_04_TEST_CICD_TEAM.md](./DEV_PLAN_04_TEST_CICD_TEAM.md) | D | 17K | 352줄 | 14,500 테스트, 15 CI/CD, 11명 RACI |
| 00 | [DEV_PLAN_00_MASTER.md](./DEV_PLAN_00_MASTER.md) (본 문서) | PM | — | — | 마스터 플랜 통합 |

---

## 9. 설계 문서 → 개발 계획 연결 맵

```mermaid
graph LR
    subgraph "설계 문서 (11건)"
        A[Agentic Enterprise 분석]
        B[Browser OS 분석]
        C[IMPL_00 블루프린트]
        D[IMPL_01 소버린 데이터]
        E[IMPL_04 Self-Healing]
        F[IMPL_05 보안 거버넌스]
        G[IMPL_BOS_01 Browser Layer]
        H[IMPL_BOS_02 Intelligence]
        I[IMPL_BOS_03 Multi-Model]
        J[IMPL_BOS_04 Governance MVP]
    end

    subgraph "개발 계획 (5건)"
        P0[DEV_PLAN_00 마스터]
        P1[DEV_PLAN_01 Sprint 0]
        P2[DEV_PLAN_02 Phase 1-2]
        P3[DEV_PLAN_03 Phase 3-4]
        P4[DEV_PLAN_04 Test/CI/CD]
    end

    G & H & J --> P1
    D & C & G --> P2
    E & F & I --> P3
    A & B --> P4
    P1 & P2 & P3 & P4 --> P0
```

---

> **"검색을 넘어선 자율형 리서치의 시대. 30주 후, H Chat은 에이전틱 엔터프라이즈의 핵심 플랫폼이 됩니다."**
