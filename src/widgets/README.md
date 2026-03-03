# src/widgets/ — 위젯 레이어

FSD 아키텍처의 위젯 레이어. 여러 엔티티와 UI 컴포넌트를 조합한 복합 기능 컴포넌트입니다. 페이지에서 조립하여 사용합니다.

## 파일 구조

```
widgets/
├── sidebar/
│   ├── Sidebar.tsx              # 네비게이션 사이드바
│   └── SessionContextMenu.tsx   # 세션 우클릭 메뉴
├── message-list/
│   ├── MessageList.tsx          # 메시지 목록 컨테이너
│   ├── MessageBubble.tsx        # 개별 메시지 버블
│   ├── ToolCallBlock.tsx        # 도구 호출 표시
│   ├── ToolCallGroup.tsx        # 도구 호출 그룹
│   └── CodeBlock.tsx            # 코드 구문 강조
├── prompt-input/
│   ├── PromptInput.tsx          # 메시지 입력 컴포넌트
│   ├── ModelSelector.tsx        # 모델 선택 드롭다운
│   └── PromptMenu.tsx           # 입력 메뉴 (첨부, 옵션)
├── search/
│   └── SearchModal.tsx          # 전역 검색 모달
├── header-tabs/
│   └── HeaderTabs.tsx           # 도구 탭 바 (4탭 전환)
└── artifact-panel/
    ├── ArtifactPanel.tsx        # Canvas 사이드 패널 (헤더, 툴바, 콘텐츠)
    ├── ArtifactPreview.tsx      # 타입별 프리뷰 디스패처
    ├── ArtifactCodeView.tsx     # SyntaxHighlighter 코드 뷰
    ├── ArtifactHtmlPreview.tsx  # sandboxed iframe (HTML/SVG)
    ├── ArtifactMermaidPreview.tsx # Mermaid 다이어그램 렌더링
    └── ResizeHandle.tsx         # 드래그 리사이즈 핸들
```

## 위젯별 상세

### Sidebar

좌측 네비게이션 패널. 세션 목록, 네비게이션 메뉴, 설정 바로가기를 포함합니다.

| 기능 | 설명 |
|------|------|
| 세션 목록 | 시간순 정렬, 클릭 시 해당 세션으로 이동 |
| 새 대화 | 새 채팅 세션 생성 |
| 네비게이션 | 홈, 전체 대화, 프로젝트, 그룹 채팅 등 |
| 컨텍스트 메뉴 | 우클릭 시 이름 변경, 삭제, 내보내기 |
| 설정 바로가기 | 하단에 설정 접근 버튼 |

`Cmd/Ctrl + B`로 토글 가능합니다.

### MessageList / MessageBubble

채팅 메시지를 렌더링하는 핵심 위젯입니다.

**MessageList**: 스크롤 컨테이너. 자동 스크롤, 메시지 그룹핑을 처리합니다.

**MessageBubble**: 개별 메시지 렌더링. 세그먼트 기반 구조를 처리합니다:
- `text` 세그먼트 → 마크다운 렌더링 (react-markdown + remark-gfm)
- `tool` 세그먼트 → ToolCallBlock/ToolCallGroup으로 렌더링

**CodeBlock**: 코드 블록 구문 강조. react-syntax-highlighter를 사용하며 복사 버튼을 제공합니다.

**ToolCallBlock / ToolCallGroup**: AI 도구 호출 결과를 시각적으로 표시합니다. 접기/펼치기 가능합니다.

### PromptInput

사용자 메시지 입력 영역. 자동 높이 조절(`react-textarea-autosize`), 파일 첨부 UI, 전송 버튼을 포함합니다.

**ModelSelector**: 드롭다운으로 AI 모델을 선택합니다. 프로바이더별 그룹핑, 모델 아이콘을 표시합니다.

**PromptMenu**: 추가 입력 옵션 (이미지 첨부, 시스템 프롬프트 등)을 제공합니다.

### SearchModal

`Cmd/Ctrl + K`로 열리는 전역 검색 오버레이. 세션 제목과 메시지 내용에서 검색합니다.

### HeaderTabs

상단 도구 탭 바. 업무 비서(home)/문서 번역(translate)/문서 작성(docWriter)/텍스트 추출(ocr) 4개 탭으로 빠른 전환. 도구 관련 뷰(home, translate, docWriter, ocr)에서만 표시됩니다.

### ArtifactPanel (Canvas/Artifacts)

채팅 오른쪽에 표시되는 코드/HTML/SVG/Mermaid 미리보기 사이드 패널 (Claude Artifacts 스타일).

| 파일 | 설명 |
|------|------|
| `ArtifactPanel.tsx` | 메인 패널 — 아티팩트 선택기 드롭다운, 프리뷰/코드 토글, 버전 히스토리, 복사/다운로드/삭제 |
| `ArtifactPreview.tsx` | 타입별 디스패처: html/svg → iframe, mermaid → 다이어그램, code → 코드뷰 |
| `ArtifactCodeView.tsx` | react-syntax-highlighter + vscDarkPlus 코드 표시 |
| `ArtifactHtmlPreview.tsx` | sandboxed iframe 렌더링 (XSS 방지) |
| `ArtifactMermaidPreview.tsx` | mermaid lazy import, 다이어그램 렌더링 |
| `ResizeHandle.tsx` | 마우스 드래그 리사이즈 (320-960px) |

- ChatPage에서 `flex-row` split layout으로 조합
- 모바일 (< 768px): `fixed inset-0 z-50` 오버레이 모드
- 드래그 리사이즈, localStorage 패널 너비 영속

## 의존성 관계

```
Pages → Widgets → Entities (stores) + Shared (UI, lib)
```

위젯은 Zustand 스토어에 직접 접근하고, `shared/ui`의 기본 컴포넌트를 조합합니다.
