# TODO: Desktop 문서 심층분석 결과

> 분석일: 2026-03-08 | 소스: ~/Desktop/ 3개 문서
> 대상: hchat-pwa (Phase 52 완료, 1555+ tests)

---

## 분석 문서 목록

| # | 파일 | 핵심 주제 | 우선순위 |
|---|------|----------|---------|
| 1 | gemini-hchat-integration-analysis.md | Gemini 통합 플랫폼 설계 분석 | 참조 |
| 2 | smart-chunking-citation-implementation.md | 스마트 청킹 + Citation 시스템 | **HIGH** |
| 3 | HChat_Atlassian_Confluence_Jira.md | Confluence/Jira 검색 통합 | **MEDIUM** |

---

## TODO Items (우선순위순)

### Phase 53: Smart Chunking + Citation System (HIGH)

- [ ] **T1: Smart Chunking Engine** (src/shared/lib/)
  - 재귀적 구분자 분할 (단락 -> 문장 -> 단어)
  - 10-20% 오버랩
  - 페이지별 메타데이터 보존 (page, startOffset)
  - PdfChunk, PdfChunkedAttachment 타입 정의
  - 기존 extractPdfText 하위 호환 유지

- [ ] **T2: Citation Prompt Builder** (src/shared/lib/)
  - `[chunk-N, Page M] 텍스트` 형식 프롬프트 생성
  - 인용 규칙 시스템 프롬프트 주입
  - 쿼리 관련도 기반 청크 랭킹 (키워드 매칭)
  - MAX_CONTEXT_CHARS 제한

- [ ] **T3: Citation Parser** (src/shared/lib/)
  - LLM 응답에서 [N] 패턴 파싱
  - 환각 검증 (존재하지 않는 청크 번호 필터링)
  - CitationMeta 매핑 (index, chunkId, page, snippet)

- [ ] **T4: Citation Badge UI** (src/widgets/message-list/)
  - 클릭 가능 인용 배지 컴포넌트
  - 호버/클릭 시 출처 프리뷰 팝업
  - 외부 클릭 닫기
  - MessageBubble MarkdownSegment 확장

### Phase 54: Atlassian Integration (MEDIUM)

- [ ] **T5: Atlassian Client** (backend/)
  - AtlassianClient 클래스 (Basic Auth, REST API)
  - 환경변수: ATLASSIAN_BASE_URL, EMAIL, API_TOKEN
  - Modal Secret 연동

- [ ] **T6: Confluence Search** (backend/)
  - CQL 쿼리 기반 페이지 검색
  - HTML 태그 제거, excerpt 생성
  - 페이지 전체 내용 가져오기 (LLM 분석용)

- [ ] **T7: Jira Search** (backend/)
  - JQL 쿼리 기반 이슈 검색
  - ADF (Atlassian Document Format) 텍스트 추출
  - 이슈 상세 + 댓글 수집

- [ ] **T8: Atlassian Search Endpoint** (backend/)
  - POST /api/search/atlassian (통합 검색)
  - Confluence + Jira 결과 통합
  - LLM 요약 + 출처 링크 포함

- [ ] **T9: Atlassian Search Page** (src/pages/)
  - Confluence/Jira 토글 필터
  - 검색 결과 카드 (출처 링크 포함)
  - ViewState + route-map 추가

### Phase 55+: Server-side PDF Enhancement (LOW)

- [ ] **T10: PyMuPDF Backend Endpoint** (backend/)
  - Modal에 PyMuPDF 의존성 추가
  - POST /api/pdf/analyze (표 추출 + 레이아웃 보존)
  - 클라이언트/서버 하이브리드 라우팅

- [ ] **T11: PDF Table Extraction**
  - page.find_tables() -> pandas -> markdown
  - 표 구조 보존 변환

### 장기 과제 (BACKLOG)

- [ ] **T12: Electron Desktop App**
  - Auto-Claude Electron 패턴 재사용
  - Vite 빌드 -> Electron 로딩
  - Modal 백엔드 그대로 사용 (로컬 서버 불필요)

- [ ] **T13: PDF Viewer Integration**
  - Citation 클릭 시 PDF 해당 페이지 이동
  - react-pdf 또는 pdfjs-dist viewer

- [ ] **T14: Cross-encoder Reranking**
  - ONNX Web Worker 기반 청크-쿼리 관련도 재순위화

---

## 비용/효과 분석

| TODO | 효과 | 복잡도 | ROI |
|------|------|--------|-----|
| T1-T4 (Citation) | AI 신뢰도 대폭 향상 | 3일 | **HIGH** |
| T5-T9 (Atlassian) | 사내 문서 통합 검색 | 4일 | **MEDIUM** |
| T10-T11 (PyMuPDF) | 표 추출 정밀도 | 2일 | MEDIUM |
| T12 (Electron) | 데스크탑 앱 | 5일 | LOW |

---

## 결론

3개 문서에서 가장 실질적 가치가 높은 항목은:
1. **스마트 청킹 + Citation** (문서 2) - PDF 분석 품질 + AI 신뢰도
2. **Atlassian 통합** (문서 3) - 사내 검색 연동 (Enterprise 가치)
3. **Gemini 분석** (문서 1) - 대부분 이미 구현됨, PDF 정밀도만 참고

Phase 53부터 Citation 시스템 구현 권장.
