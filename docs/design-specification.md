# H Chat PWA — 화면 설계안 및 구현방안

> **문서 버전**: 2.0 | ✅ **Phase 1-5 전체 완료** (2026-03-03)
> **최종 수정**: 2026-03-03
> **설계 파일**: `pwa.pen` (28+ 프레임, Light/Dark 모드)
> **현재**: 18개 페이지, 18개 Zustand 스토어, Dexie v5 (16 테이블), 854 tests

---

## 목차

1. [개요](#1-개요)
2. [디자인 시스템](#2-디자인-시스템)
3. [화면 설계안](#3-화면-설계안)
4. [컴포넌트 구조](#4-컴포넌트-구조)
5. [구현방안](#5-구현방안)
6. [파일-화면 매핑](#6-파일-화면-매핑)

---

## 1. 개요

### 1.1 프로젝트 목적

H Chat Desktop을 AWS Bedrock 기반 **로컬 실행 PWA**로 전환한다.
브라우저 단독 실행이 가능하며, Vite 미들웨어를 통해 AWS Bedrock API에 연결한다.

### 1.2 기술 스택

| 항목 | 기술 |
|------|------|
| UI 프레임워크 | React 19, TypeScript, Vite 7 |
| 상태 관리 | Zustand (3개 스토어) |
| 스타일링 | Tailwind CSS 3 + CSS 변수 테마 |
| 데이터 영속화 | Dexie (IndexedDB), localStorage |
| AI 백엔드 | AWS Bedrock Runtime (Vite 미들웨어 프록시) |
| PWA | vite-plugin-pwa (Workbox) |

### 1.3 화면 구성 요약

```
┌─────────────────────────────────────────┐
│ pwa.pen 전체 화면 구성 (9개 프레임)     │
├─────────────────────────────────────────┤
│                                         │
│  [HomeScreen]  [ChatPage]  [Settings]   │  ← Light 모드 주요 화면
│                                         │
│  [AllChats]    [Projects]  [Search]     │  ← Light 모드 부가 화면
│                                         │
│  [Home-Dark]   [Chat-Dark] [Set-Dark]   │  ← Dark 모드 변형
│                                         │
└─────────────────────────────────────────┘
```

---

## 2. 디자인 시스템

### 2.1 색상 토큰 (CSS 변수)

모든 색상은 테마 변수로 관리되어 Light/Dark 자동 전환을 지원한다.

| 변수명 | Light | Dark | 용도 |
|--------|-------|------|------|
| `$bg-page` | `#FFFFFF` | `#0F172A` | 페이지 배경 |
| `$bg-sidebar` | `#F8FAFC` | `#1E293B` | 사이드바 배경 |
| `$bg-card` | `#FFFFFF` | `#1E293B` | 카드 배경 |
| `$bg-input` | `#FFFFFF` | `#1E293B` | 입력 필드 배경 |
| `$bg-hover` | `#F1F5F9` | `#334155` | 호버 상태 |
| `$primary` | `#2563EB` | `#3B82F6` | 기본 액센트 (blue-600/500) |
| `$primary-hover` | `#1D4ED8` | `#2563EB` | 기본 액센트 호버 |
| `$primary-light` | `#EFF6FF` | `#1E3A5F` | 기본 액센트 연한 배경 |
| `$text-primary` | `#0F172A` | `#F1F5F9` | 주요 텍스트 |
| `$text-secondary` | `#64748B` | `#94A3B8` | 보조 텍스트 |
| `$text-tertiary` | `#94A3B8` | `#64748B` | 3차 텍스트 |
| `$text-white` | `#FFFFFF` | `#FFFFFF` | 흰색 고정 |
| `$border` | `#E2E8F0` | `#334155` | 기본 테두리 |
| `$border-input` | `#CBD5E1` | `#475569` | 입력 필드 테두리 |
| `$amber-bg` | `#FFFBEB` | `#451A0333` | 경고 배너 배경 |
| `$amber-border` | `#FDE68A` | `#92400E` | 경고 배너 테두리 |
| `$amber-text` | `#92400E` | `#FDE68A` | 경고 배너 텍스트 |
| `$success` | `#22C55E` | — | 성공 색상 |
| `$danger` | `#EF4444` | — | 위험 색상 |
| `$warning` | `#F59E0B` | — | 경고 색상 |

### 2.2 타이포그래피

| 용도 | 폰트 | 크기 | 두께 |
|------|------|------|------|
| 페이지 제목 | Inter | 28px | 600 (SemiBold) |
| 섹션 제목 | Inter | 24px | 700 (Bold) |
| 서브 제목 | Inter | 18px | 600 (SemiBold) |
| 본문 | Inter | 14px | 400 (Regular) |
| 사이드바 항목 | Inter | 13px | 400/500 |
| 레이블 | Inter | 13px | 500 (Medium) |
| 캡션/힌트 | Inter | 12px | 400 (Regular) |
| 섹션 라벨 | Inter | 11px | 500 (Medium) |

### 2.3 레이아웃 상수

| 항목 | 값 |
|------|-----|
| 사이드바 너비 | 264px |
| 사이드바 헤더 높이 | 52px |
| 사이드바 푸터 높이 | 48px |
| 네비게이션 항목 높이 | 36px |
| 입력 필드 높이 | 40px |
| 버튼 높이 (소) | 32-36px |
| 모서리 반경 (카드) | 10-14px |
| 모서리 반경 (버튼) | 8px |
| 모서리 반경 (칩) | 20px (pill) |
| 모서리 반경 (입력) | 8px |

### 2.4 아이콘

**Lucide Icons** 사용. 기본 크기 16px, 강조 시 20px.

주요 아이콘 매핑:
- `search` — 검색
- `plus` — 새로 만들기
- `star` — 즐겨찾기
- `message-square` — 대화
- `pencil` — 편집/코드 작성
- `settings` — 설정
- `x` — 닫기
- `key` — API 키
- `user` — 프로필
- `sparkles` — 기능
- `palette` — 사용자 지정
- `shield` — 개인정보
- `folder` — 프로젝트
- `chevron-down` — 드롭다운
- `send` — 전송
- `square` — 중단 (Stop)

---

## 3. 화면 설계안

### 3.1 HomeScreen (홈 화면)

> **파일**: `src/pages/home/HomeScreen.tsx`
> **설계 노드**: `FAi76` (Light), `DRdXh` (Dark)

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (264px)        │           MainContent              │
│ ┌─────────────────┐    │                                     │
│ │ 🔍 검색 (⌘K)   │ 새 채팅│                                │
│ │ H Chat          │    │  ┌─────────────────────────────┐   │
│ │                 │    │  │ ⚠ AWS 자격증명이 설정되지   │   │
│ │ 즐겨찾기        │    │  │    않았습니다.     [설정하기]│   │
│ │ ☆ Claude API... │    │  └─────────────────────────────┘   │
│ │                 │    │                                     │
│ │ 최근 대화       │    │          ● (Hero Icon)              │
│ │ 💬 React 컴포...│    │     무엇을 도와드릴까요?            │
│ │ 💬 TypeScript...│    │                                     │
│ │ 💬 데이터베이...│    │  ┌─────────────────────────────┐   │
│ │ 💬 Docker Com...│    │  │ + 메시지를 입력하세요...  ▶ │   │
│ │                 │    │  └─────────────────────────────┘   │
│ │                 │    │                                     │
│ ├─────────────────┤    │  ◯코드작성 ◯문서요약 ◯번역하기    │
│ │ 👤 사용자       │    │  ◯브레인스토밍 ◯코드리뷰           │
│ └─────────────────┘    │                                     │
└─────────────────────────────────────────────────────────────┘
```

**구성 요소:**

| 영역 | 설명 |
|------|------|
| **Sidebar** | 검색 버튼, 새 채팅 버튼, 브랜드 로고, 즐겨찾기/최근 대화 목록, 사용자 프로필 |
| **CredentialsBanner** | AWS 자격증명 미설정 시 amber 경고 배너 (640px). "설정하기" 클릭 시 Settings 이동 |
| **Hero** | 원형 아이콘 + "무엇을 도와드릴까요?" 제목 |
| **PromptInput** | 파일 첨부 버튼 + 텍스트 입력 + 모델 선택 + 전송 버튼 (640px) |
| **QuickActions** | 5개 pill 형태 칩: 코드 작성, 문서 요약, 번역하기, 브레인스토밍, 코드 리뷰 |

**동작:**
- 메시지 입력 후 전송 → 새 세션 생성 → ChatPage로 전환
- 자격증명 미설정 시 → 배너 표시, 전송 클릭 시 Settings로 이동
- Quick Action 클릭 → 해당 프롬프트로 새 세션 생성

---

### 3.2 ChatPage (채팅 화면)

> **파일**: `src/pages/chat/ChatPage.tsx`
> **설계 노드**: `bLMTW` (Light), `FZ5xP` (Dark)

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (264px)        │ ChatHeader                         │
│ ┌─────────────────┐    │ Electron 웹 구조 설계  ✏️    ⋯ … │
│ │ H Chat          │    ├────────────────────────────────────│
│ │                 │    │                                     │
│ │ ■ Electron 웹..│    │        ┌──────────────────┐        │
│ │   React 컴포...│    │        │ User Bubble (blue)│        │
│ │                 │    │        └──────────────────┘        │
│ │                 │    │  ┌──┐                               │
│ │                 │    │  │H │ Assistant Response Text       │
│ │                 │    │  └──┘ 1. 메인 프로세스와 렌더러...  │
│ │                 │    │       2. IPC 통신 인터페이스를...    │
│ │                 │    │       3. Feature-Sliced Design...   │
│ │                 │    │                                     │
│ │                 │    │  ┌──┐                               │
│ │                 │    │  │H │ 프로젝트 구조를 분석하고...   │
│ │                 │    │  └──┘ █ (streaming cursor)          │
│ │                 │    ├────────────────────────────────────│
│ │                 │    │ + 메시지를 입력하세요...    ■ Stop │
│ └─────────────────┘    │                                     │
└─────────────────────────────────────────────────────────────┘
```

**구성 요소:**

| 영역 | 설명 |
|------|------|
| **ChatHeader** | 세션 제목 + 편집 아이콘 + 액션 버튼(공유, 더보기) |
| **Messages** | 스크롤 가능한 메시지 목록 (상단 → 하단 시간순) |
| **UserBubble** | 우측 정렬, blue 배경, 둥근 모서리 (16,16,4,16) |
| **AssistantMessage** | 좌측 정렬, 아바타(H) + 텍스트 응답 |
| **StreamingIndicator** | 응답 생성 중 커서 블링크 (`█`) |
| **InputArea** | 파일 첨부 + 텍스트 입력 + 모델 선택 + Stop/Send 버튼 |

**동작:**
- SSE 스트리밍으로 실시간 텍스트 업데이트
- 스트리밍 중 Stop 버튼 표시 → 클릭 시 AbortController로 중단
- 자동 스크롤 (새 메시지/스트리밍 시 하단으로)
- 세션 제목 인라인 편집 가능

**메시지 모델:**
```typescript
interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  segments: MessageSegment[]  // { type: 'text' | 'tool', content?, toolCalls? }
  attachments?: ImageAttachment[]
  createdAt: string
}
```

---

### 3.3 SettingsScreen (설정 화면)

> **파일**: `src/pages/settings/SettingsScreen.tsx`
> **설계 노드**: `fFzGE` (Light), `tVpQG` (Dark)

```
┌─────────────────────────────────────────────────────────────┐
│ SettingsSidebar (264px) │ SettingsContent                   │
│ ┌─────────────────┐     │                                    │
│ │ 설정          ✕ │     │  API 설정                          │
│ │                 │     │  AWS Bedrock을 통해 AI 모델에...   │
│ │ ■ API 설정     │     │                                    │
│ │   프로필       │     │  AWS 자격증명                      │
│ │   기능         │     │                                    │
│ │   사용자 지정  │     │  AWS Access Key ID                 │
│ │   개인정보     │     │  ┌──────────────────────────────┐  │
│ │                 │     │  │ AKIA...                       │  │
│ │                 │     │  └──────────────────────────────┘  │
│ │                 │     │                                    │
│ │                 │     │  AWS Secret Access Key             │
│ │                 │     │  ┌──────────────────────────────┐  │
│ │                 │     │  │ ••••••••••••••••              │  │
│ │                 │     │  └──────────────────────────────┘  │
│ │                 │     │                                    │
│ │                 │     │  리전                              │
│ │                 │     │  ┌──────────────────────────────┐  │
│ │                 │     │  │ us-east-1 — US East (N.V.) ▾ │  │
│ │                 │     │  └──────────────────────────────┘  │
│ │                 │     │                                    │
│ │                 │     │  [연결 테스트]  ✓ 연결 성공        │
│ │                 │     │                                    │
│ │                 │     │  ℹ 자격증명은 브라우저의           │
│ │                 │     │    localStorage에 저장됩니다.      │
│ └─────────────────┘     │                                    │
└─────────────────────────────────────────────────────────────┘
```

**구성 요소:**

| 영역 | 설명 |
|------|------|
| **SettingsSidebar** | 설정 탭 목록 (API설정, 프로필, 기능, 사용자지정, 개인정보) + 닫기 버튼 |
| **API 설정 탭** | AWS Access Key ID, Secret Access Key(마스킹), 리전 드롭다운 |
| **연결 테스트** | 버튼 클릭 시 `/api/chat/test` 호출, 성공/실패 뱃지 표시 |
| **사용자 지정 탭** | 다크 모드 토글 |

**설정 탭 목록:**

| 탭 ID | 아이콘 | 라벨 | 상태 |
|--------|--------|------|------|
| `api-keys` | `key` | API 설정 | 구현 완료 |
| `profile` | `user` | 프로필 | 준비 중 |
| `features` | `sparkles` | 기능 | 준비 중 |
| `customization` | `palette` | 사용자 지정 | 구현 완료 (다크 모드) |
| `privacy` | `shield` | 개인정보 | 준비 중 |

**리전 옵션:**

| 리전 ID | 이름 |
|---------|------|
| `us-east-1` | US East (N. Virginia) |
| `us-west-2` | US West (Oregon) |
| `eu-west-1` | EU (Ireland) |
| `ap-northeast-1` | Asia Pacific (Tokyo) |
| `ap-southeast-1` | Asia Pacific (Singapore) |

---

### 3.4 AllChatsScreen (모든 대화 화면)

> **파일**: `src/pages/all-chats/AllChatsScreen.tsx`
> **설계 노드**: `RyNBL`

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (264px)        │           MainContent              │
│ ┌─────────────────┐    │                                     │
│ │ H Chat          │    │     모든 대화                       │
│ │                 │    │                                     │
│ │ ■ 모든 대화    │    │  🔍 대화 검색...                    │
│ │                 │    │                                     │
│ │                 │    │  ┌─────────────────────────────────┐│
│ │                 │    │  │ Electron 웹 구조 설계     13시간││
│ │                 │    │  │ Electron + React로 데스크탑...  ││
│ │                 │    │  │                          Sonnet ││
│ │                 │    │  ├─────────────────────────────────┤│
│ │                 │    │  │ React 컴포넌트 리팩토링    1일전││
│ │                 │    │  │ React 컴포넌트의 구조를...      ││
│ │                 │    │  │                           Haiku ││
│ │                 │    │  ├─────────────────────────────────┤│
│ │                 │    │  │ TypeScript 제네릭 질문     1일전││
│ │                 │    │  │ TypeScript의 제네릭을 고급으... ││
│ │                 │    │  │                           Haiku ││
│ │                 │    │  └─────────────────────────────────┘│
│ └─────────────────┘    │                                     │
└─────────────────────────────────────────────────────────────┘
```

**구성 요소:**

| 영역 | 설명 |
|------|------|
| **PageHeader** | "모든 대화" 제목 |
| **SearchBox** | 대화 검색 입력 필드 |
| **ChatList** | 세션 목록 — 제목, 미리보기 텍스트, 시간, 모델 뱃지 |
| **ChatRow** | 클릭 시 해당 세션으로 이동 (border-bottom 구분선) |

**각 ChatRow 표시 정보:**
- 세션 제목 (bold)
- 마지막 메시지 미리보기 (1줄 truncate)
- 상대 시간 ("13시간 전", "1일 전")
- 사용 모델 이름 (Sonnet, Haiku 등)

---

### 3.5 ProjectsScreen (프로젝트 화면)

> **파일**: `src/pages/projects/ProjectsScreen.tsx`
> **설계 노드**: `ReGzm`

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (264px)        │           MainContent              │
│ ┌─────────────────┐    │                                     │
│ │ H Chat          │    │  프로젝트              [+ 새 프로젝트]│
│ │                 │    │                                     │
│ │ ■ 프로젝트     │    │  ┌──────────────┐ ┌──────────────┐ │
│ │                 │    │  │ 💻            │ │ 📄            │ │
│ │                 │    │  │               │ │               │ │
│ │                 │    │  │ H Chat Desktop│ │ Backend API   │ │
│ │                 │    │  │ React +       │ │ Express +     │ │
│ │                 │    │  │ TypeScript... │ │ TypeScript... │ │
│ │                 │    │  │               │ │               │ │
│ │                 │    │  │ 3개 세션·     │ │ 2개 세션·     │ │
│ │                 │    │  │ 14시간 전     │ │ 1일 전        │ │
│ │                 │    │  └──────────────┘ └──────────────┘ │
│ │                 │    │                                     │
│ └─────────────────┘    │                                     │
└─────────────────────────────────────────────────────────────┘
```

**구성 요소:**

| 영역 | 설명 |
|------|------|
| **PageHeader** | "프로젝트" 제목 + "새 프로젝트" 버튼 |
| **ProjectGrid** | 2열 그리드 카드 레이아웃 |
| **ProjectCard** | 아이콘 + 프로젝트명 + 설명(기술 스택) + 세션 수 + 마지막 활동 시간 |

**프로젝트 카드 스펙:**
- 배경: `$bg-card`
- 테두리: `$border` 1px, 라운드 14px
- 패딩: 24px
- 호버: 그림자 또는 테두리 강조

---

### 3.6 SearchModal (검색 모달)

> **파일**: `src/widgets/search/SearchModal.tsx`
> **설계 노드**: `h2aP5`

```
┌─────────────────────────────────────────────────────────────┐
│                    (반투명 오버레이)                          │
│                                                              │
│        ┌──────────────────────────────────────┐              │
│        │ 🔍 대화, 프로젝트 검색...        ESC │              │
│        ├──────────────────────────────────────┤              │
│        │ 최근 대화                            │              │
│        │  💬 Electron 웹 구조 설계            │  ← 활성 항목 │
│        │  💬 React 컴포넌트 리팩토링          │              │
│        │  💬 TypeScript 제네릭 질문           │              │
│        │                                      │              │
│        │ 프로젝트                              │              │
│        │  📁 H Chat Desktop                   │              │
│        ├──────────────────────────────────────┤              │
│        │ ↑↓ 탐색  ← 열기  esc 닫기           │              │
│        └──────────────────────────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**구성 요소:**

| 영역 | 설명 |
|------|------|
| **ModalOverlay** | 반투명 배경 (`#00000066`), 클릭 시 닫기 |
| **SearchDialog** | 560px 너비, 드롭 섀도우, 라운드 14px |
| **SearchInput** | 돋보기 아이콘 + 입력 필드 + ESC 힌트 |
| **ResultSections** | "최근 대화" / "프로젝트" 섹션별 결과 목록 |
| **KeyboardHints** | 하단 키보드 단축키 안내 (↑↓ 탐색, ← 열기, esc 닫기) |

**동작:**
- `Cmd/Ctrl+K`로 열기/닫기
- 실시간 필터링 (세션 제목 + 프로젝트 이름)
- 키보드 네비게이션 (↑↓ 이동, Enter 선택, Esc 닫기)

---

### 3.7 Dark 모드 변형

> **설계 노드**: `DRdXh` (Home), `FZ5xP` (Chat), `tVpQG` (Settings)

모든 화면은 **동일한 레이아웃**을 유지하며, CSS 변수 `theme: {"mode": "dark"}`에 의해 자동으로 다크 색상이 적용된다.

**주요 색상 변화:**

| 요소 | Light | Dark |
|------|-------|------|
| 페이지 배경 | 흰색 (`#FFFFFF`) | 네이비 (`#0F172A`) |
| 사이드바 | 연한 회색 (`#F8FAFC`) | 짙은 슬레이트 (`#1E293B`) |
| 텍스트 | 짙은 네이비 (`#0F172A`) | 밝은 회색 (`#F1F5F9`) |
| 테두리 | 연한 슬레이트 (`#E2E8F0`) | 중간 슬레이트 (`#334155`) |
| 입력 배경 | 흰색 | 짙은 슬레이트 (`#1E293B`) |
| 기본 액센트 | `#2563EB` | `#3B82F6` (약간 밝게) |

---

## 4. 컴포넌트 구조

### 4.1 공통 Sidebar 구조

모든 메인 화면에 공유되는 사이드바 컴포넌트.

```
Sidebar (264px, $bg-sidebar)
├── SidebarHeader (52px)
│   ├── SearchBox (검색 입력, ⌘K)
│   └── NewChatBtn (+ 새 채팅)
├── Brand
│   ├── BrandIcon (H, blue 28x28 rounded)
│   └── BrandName ("H Chat")
├── NavSection (즐겨찾기)
│   ├── SectionLabel ("즐겨찾기")
│   └── NavItem-active (선택된 항목, $primary-light 배경)
├── RecentSection (최근 대화, flex-grow)
│   ├── SectionLabel ("최근 대화")
│   └── NavItem[] (💬 아이콘 + 제목)
└── SidebarFooter (48px, border-top)
    ├── Avatar (28x28, 이니셜)
    └── UserName
```

### 4.2 PromptInput 구조

```
PromptInput (640px, rounded-12, border)
├── AttachButton (36x36, + 아이콘)
├── TextInput (flex-grow, placeholder)
└── RightActions
    ├── ModelSelector (드롭다운: Claude Sonnet ▾)
    └── SendButton (36x36, blue) / StopButton (스트리밍 중)
```

### 4.3 MessageBubble 구조

```
UserMessage (우측 정렬)
└── Bubble ($primary, white text, rounded 16,16,4,16)
    └── Text content

AssistantMessage (좌측 정렬)
├── Avatar (H, 32x32, $primary-light)
└── BubbleContent
    ├── Text segments (markdown 렌더링)
    ├── CodeBlock (구문 강조)
    └── StreamingCursor (█, 블링크 애니메이션)
```

---

## 5. 구현방안

### 5.1 아키텍처 개요

```
┌────────────────────────────────────────────────────┐
│  Browser (React 19 PWA)                             │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ Zustand   │  │ Dexie    │  │ Service Worker  │  │
│  │ 3 Stores  │  │ IndexedDB│  │ (Workbox PWA)   │  │
│  └─────┬────┘  └─────┬────┘  └─────────────────┘  │
│        │              │                              │
│  ┌─────▼──────────────▼─────┐                       │
│  │  fetch('/api/chat')      │                       │
│  │  SSE streaming           │                       │
│  └────────────┬─────────────┘                       │
└───────────────┼─────────────────────────────────────┘
                │ localhost
┌───────────────▼─────────────────────────────────────┐
│  Vite Middleware (bedrock-plugin.ts)                  │
│  ┌──────────────────────────────────────────────┐   │
│  │  POST /api/chat     → ConverseStreamCommand  │   │
│  │  POST /api/chat/test → 자격증명 검증         │   │
│  │  (요청별 Client 생성, 자격증명 미캐싱)       │   │
│  └──────────────────────┬───────────────────────┘   │
└─────────────────────────┼───────────────────────────┘
                          │ HTTPS (SigV4)
┌─────────────────────────▼───────────────────────────┐
│  AWS Bedrock Runtime                                 │
│  us.anthropic.claude-opus-4-0-20250514              │
│  us.anthropic.claude-sonnet-4-20250514              │
│  us.anthropic.claude-3-5-haiku-20241022             │
└─────────────────────────────────────────────────────┘
```

### 5.2 상태 관리 (Zustand 3개 스토어)

#### SessionStore (`session.store.ts`)

```typescript
interface SessionState {
  sessions: Session[]
  currentSessionId: string | null
  messages: Record<string, Message[]>
  view: ViewState
  searchOpen: boolean
  hydrated: boolean

  // Actions
  hydrate: () => Promise<void>          // IndexedDB → Zustand
  setView: (view: ViewState) => void
  selectSession: (id: string) => void
  createSession: (title?: string) => void
  deleteSession: (id: string) => void
  toggleFavorite: (id: string) => void
  renameSession: (id: string, title: string) => void
  addMessage: (sessionId: string, message: Message) => void
  updateLastMessage: (sessionId: string, messageId: string, updater: (msg: Message) => Message) => void
  setSessionStreaming: (sessionId: string, isStreaming: boolean) => void
  setSearchOpen: (open: boolean) => void
  goHome: () => void
}
```

#### SettingsStore (`settings.store.ts`)

```typescript
interface SettingsState {
  selectedModel: string
  darkMode: boolean
  sidebarOpen: boolean
  settingsOpen: boolean
  settingsTab: string
  credentials: AwsCredentials | null

  // Actions
  setSelectedModel: (model: string) => void
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setSettingsOpen: (open: boolean) => void
  setSettingsTab: (tab: string) => void
  setCredentials: (creds: AwsCredentials | null) => void
  hasCredentials: () => boolean
}
```

#### ProjectStore (`project.store.ts`)

```typescript
interface ProjectState {
  projects: Project[]
  selectedProjectId: string | null
  hydrated: boolean

  hydrate: () => Promise<void>
  selectProject: (id: string) => void
  createProject: (name: string, description: string) => void
  deleteProject: (id: string) => void
}
```

### 5.3 데이터 영속화

```
┌─────────────────────────────────────┐
│  IndexedDB (Dexie)                  │
│  ┌───────────────────────────────┐  │
│  │ sessions: id, projectId,      │  │
│  │           updatedAt, favorite │  │
│  ├───────────────────────────────┤  │
│  │ messages: id, sessionId,      │  │
│  │           createdAt           │  │
│  ├───────────────────────────────┤  │
│  │ projects: id, updatedAt       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  localStorage                       │
│  ┌───────────────────────────────┐  │
│  │ hchat:settings                │  │
│  │ { selectedModel, darkMode,    │  │
│  │   sidebarOpen, region }       │  │
│  ├───────────────────────────────┤  │
│  │ hchat:credentials             │  │
│  │ { accessKeyId, secretKey,     │  │
│  │   region }                    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**동기화 흐름:**
1. **앱 시작**: `MainLayout.useEffect` → `hydrate()` 호출 → IndexedDB에서 세션/메시지/프로젝트 로드
2. **상태 변경**: 각 Store action에서 Zustand 업데이트 후 IndexedDB에 비동기 저장
3. **스트리밍 중**: 메시지 완료 후 일괄 IndexedDB 저장

### 5.4 스트리밍 흐름

```
1. PromptInput.handleSend(text)
   ├── 자격증명 확인 (없으면 Settings로 이동)
   ├── User Message 생성 → addMessage()
   ├── 빈 Assistant Message 생성 (isStreaming: true)
   └── streamChat() AsyncGenerator 시작

2. streamChat({ credentials, modelId, messages })
   ├── POST /api/chat (fetch, ReadableStream)
   ├── SSE 파싱 (EventSource-like)
   └── yield ChatStreamEvent { type, content }

3. Vite Middleware (bedrock-plugin.ts)
   ├── 요청별 BedrockRuntimeClient 생성
   ├── ConverseStreamCommand 실행
   └── SSE 형식으로 청크 스트리밍

4. 브라우저 수신 루프
   ├── for await (const event of streamChat(...))
   │   ├── type: 'text' → updateLastMessage() (텍스트 누적)
   │   ├── type: 'error' → 에러 메시지 표시
   │   └── type: 'done' → 스트리밍 종료
   └── finally
       ├── setSessionStreaming(false)
       └── IndexedDB에 최종 메시지 저장
```

### 5.5 뷰 라우팅 (상태 기반)

React Router 없이 Zustand 상태로 뷰를 전환한다.

```typescript
// MainLayout.renderContent()
if (settingsOpen)    → <SettingsScreen />
if (view === 'projects')     → <ProjectsScreen />
if (view === 'projectDetail') → <ProjectDetailScreen />
if (view === 'allChats')      → <AllChatsScreen />
if (view === 'quickChat')     → <QuickChatPage />
if (currentSessionId && view === 'chat') → <ChatPage />
default              → <HomeScreen />
```

**전역 키보드 단축키 (MainLayout):**

| 단축키 | 동작 |
|--------|------|
| `Cmd/Ctrl + K` | 검색 모달 토글 |
| `Cmd/Ctrl + B` | 사이드바 토글 |
| `Cmd/Ctrl + ,` | 설정 화면 토글 |

### 5.6 모델 매핑

| UI ID | 표시 이름 | Bedrock 모델 ID |
|-------|-----------|-----------------|
| `claude-opus-4` | Claude 4 Opus | `us.anthropic.claude-opus-4-0-20250514` |
| `claude-sonnet-4` | Claude 4 Sonnet | `us.anthropic.claude-sonnet-4-20250514` |
| `claude-haiku-3.5` | Claude 3.5 Haiku | `us.anthropic.claude-3-5-haiku-20241022` |

Cross-region inference prefix (`us.`) 사용으로 리전 간 가용성 확보.

### 5.7 PWA 설정

```typescript
// vite.config.ts — VitePWA 플러그인
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'H Chat Desktop',
    short_name: 'H Chat',
    theme_color: '#2563EB',
    background_color: '#FFFFFF',
    display: 'standalone',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [{
      urlPattern: /^\/api\//,
      handler: 'NetworkOnly',     // API는 캐시하지 않음
    }],
  },
})
```

---

## 6. 파일-화면 매핑

### 6.1 화면별 소스 파일

| 화면 | 소스 파일 | 설계 노드 |
|------|-----------|-----------|
| HomeScreen | `src/pages/home/HomeScreen.tsx` | `FAi76` / `DRdXh` |
| ChatPage | `src/pages/chat/ChatPage.tsx` | `bLMTW` / `FZ5xP` |
| SettingsScreen | `src/pages/settings/SettingsScreen.tsx` | `fFzGE` / `tVpQG` |
| AllChatsScreen | `src/pages/all-chats/AllChatsScreen.tsx` | `RyNBL` |
| ProjectsScreen | `src/pages/projects/ProjectsScreen.tsx` | `ReGzm` |
| SearchModal | `src/widgets/search/SearchModal.tsx` | `h2aP5` |

### 6.2 전체 파일 구조

```
src/
├── app/
│   └── layouts/
│       └── MainLayout.tsx          # 뷰 라우팅, 키보드 단축키, hydration
├── pages/
│   ├── home/
│   │   └── HomeScreen.tsx          # 홈 화면 (자격증명 배너, 히어로, 입력)
│   ├── chat/
│   │   ├── ChatPage.tsx            # 채팅 화면 (메시지 목록, 입력)
│   │   └── ChatHeader.tsx          # 채팅 헤더 (제목, 액션)
│   ├── settings/
│   │   └── SettingsScreen.tsx      # 설정 화면 (AWS 자격증명)
│   ├── all-chats/
│   │   └── AllChatsScreen.tsx      # 모든 대화 목록
│   ├── projects/
│   │   ├── ProjectsScreen.tsx      # 프로젝트 목록 (그리드)
│   │   └── ProjectDetailScreen.tsx # 프로젝트 상세
│   └── quick-chat/
│       └── QuickChatPage.tsx       # 빠른 채팅
├── widgets/
│   ├── sidebar/
│   │   ├── Sidebar.tsx             # 공통 사이드바
│   │   └── SessionContextMenu.tsx  # 세션 컨텍스트 메뉴
│   ├── message-list/
│   │   ├── MessageList.tsx         # 메시지 목록 컨테이너
│   │   ├── MessageBubble.tsx       # 메시지 버블 (User/Assistant)
│   │   ├── CodeBlock.tsx           # 코드 블록 (구문 강조)
│   │   ├── ToolCallBlock.tsx       # 도구 호출 표시
│   │   └── ToolCallGroup.tsx       # 도구 호출 그룹
│   ├── prompt-input/
│   │   ├── PromptInput.tsx         # 프롬프트 입력 (스트리밍 연동)
│   │   ├── ModelSelector.tsx       # 모델 드롭다운
│   │   └── PromptMenu.tsx          # 프롬프트 메뉴
│   └── search/
│       └── SearchModal.tsx         # 검색 모달 (⌘K)
├── entities/
│   ├── session/
│   │   └── session.store.ts        # 세션/메시지 상태 + IndexedDB 영속화
│   ├── settings/
│   │   └── settings.store.ts       # 설정/자격증명 상태 + localStorage
│   └── project/
│       └── project.store.ts        # 프로젝트 상태 + IndexedDB 영속화
├── shared/
│   ├── ui/                         # 11개 재사용 컴포넌트
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── FormInput.tsx
│   │   ├── FormLabel.tsx
│   │   ├── IconButton.tsx
│   │   ├── InputField.tsx
│   │   ├── QuickActionChip.tsx
│   │   ├── SettingsTabItem.tsx
│   │   ├── SidebarItem.tsx
│   │   ├── Toggle.tsx
│   │   └── ToolCallBlockItem.tsx
│   ├── lib/
│   │   ├── db.ts                   # Dexie IndexedDB 스키마 + CRUD
│   │   ├── bedrock-client.ts       # SSE 기반 API 클라이언트
│   │   ├── model-meta.ts           # 모델 메타 유틸리티
│   │   └── time.ts                 # 시간 포맷팅
│   ├── types/
│   │   └── index.ts                # 전체 타입 정의
│   ├── constants.ts                # 모델, 리전, 레이아웃 상수
│   └── styles/
│       └── globals.css             # CSS 변수 테마 (Light/Dark)
├── server/
│   └── bedrock-plugin.ts           # Vite Bedrock 프록시 미들웨어
├── App.tsx
└── main.tsx
```

### 6.3 주요 의존성

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "zustand": "^5.0.5",
    "dexie": "^4.0.11",
    "@aws-sdk/client-bedrock-runtime": "^3.x",
    "lucide-react": "^0.x",
    "tailwindcss": "^3.x"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "vite-plugin-pwa": "^0.x",
    "typescript": "^5.x"
  }
}
```
