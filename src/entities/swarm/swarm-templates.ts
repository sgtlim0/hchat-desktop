import type { SwarmTemplate } from '@/shared/types'

export type OrchestrationStrategy = 'pipeline' | 'parallel' | 'debate'

export interface SwarmWorkflow {
  id: string
  name: string
  nameKo: string
  description: string
  descriptionKo: string
  strategy: OrchestrationStrategy
  template: SwarmTemplate
}

export const SWARM_WORKFLOWS: SwarmWorkflow[] = [
  {
    id: 'code-review',
    name: 'Code Review',
    nameKo: '코드 리뷰',
    description: 'Plan → Code → Review → Synthesize',
    descriptionKo: '계획 → 코딩 → 리뷰 → 종합',
    strategy: 'pipeline',
    template: {
      id: 'code-review',
      name: 'Code Review',
      description: 'Sequential code review pipeline',
      agents: [
        { role: 'planner', label: 'Planner', x: 100, y: 200 },
        { role: 'coder', label: 'Coder', x: 300, y: 200 },
        { role: 'reviewer', label: 'Reviewer', x: 500, y: 200 },
        { role: 'synthesizer', label: 'Synthesizer', x: 700, y: 200 },
      ],
      connections: [
        { from: 'planner', to: 'coder' },
        { from: 'coder', to: 'reviewer' },
        { from: 'reviewer', to: 'synthesizer' },
      ],
    },
  },
  {
    id: 'deep-research',
    name: 'Deep Research',
    nameKo: '심층 리서치',
    description: 'Plan → Parallel Research → Synthesize',
    descriptionKo: '계획 → 병렬 조사 → 종합',
    strategy: 'parallel',
    template: {
      id: 'deep-research',
      name: 'Deep Research',
      description: 'Parallel research with synthesis',
      agents: [
        { role: 'planner', label: 'Planner', x: 100, y: 300 },
        { role: 'researcher', label: 'Researcher A', x: 350, y: 150 },
        { role: 'researcher', label: 'Researcher B', x: 350, y: 300 },
        { role: 'researcher', label: 'Researcher C', x: 350, y: 450 },
        { role: 'synthesizer', label: 'Synthesizer', x: 600, y: 300 },
      ],
      connections: [
        { from: 'planner', to: 'researcher-a' },
        { from: 'planner', to: 'researcher-b' },
        { from: 'planner', to: 'researcher-c' },
        { from: 'researcher-a', to: 'synthesizer' },
        { from: 'researcher-b', to: 'synthesizer' },
        { from: 'researcher-c', to: 'synthesizer' },
      ],
    },
  },
  {
    id: 'ai-debate',
    name: 'AI Debate',
    nameKo: 'AI 토론',
    description: 'Multiple perspectives → Consensus',
    descriptionKo: '다양한 관점 → 합의 도출',
    strategy: 'debate',
    template: {
      id: 'ai-debate',
      name: 'AI Debate',
      description: 'Multi-perspective debate',
      agents: [
        { role: 'researcher', label: 'Advocate', x: 200, y: 150 },
        { role: 'reviewer', label: 'Critic', x: 200, y: 350 },
        { role: 'synthesizer', label: 'Judge', x: 500, y: 250 },
      ],
      connections: [
        { from: 'advocate', to: 'judge' },
        { from: 'critic', to: 'judge' },
      ],
    },
  },
  {
    id: 'full-stack-dev',
    name: 'Full-Stack Dev',
    nameKo: '풀스택 개발',
    description: 'Plan → Frontend + Backend parallel → Review',
    descriptionKo: '계획 → 프론트+백엔드 병렬 → 리뷰',
    strategy: 'parallel',
    template: {
      id: 'full-stack-dev',
      name: 'Full-Stack Dev',
      description: 'Parallel frontend + backend development',
      agents: [
        { role: 'planner', label: 'Architect', x: 100, y: 250 },
        { role: 'coder', label: 'Frontend Dev', x: 350, y: 150 },
        { role: 'coder', label: 'Backend Dev', x: 350, y: 350 },
        { role: 'reviewer', label: 'Code Reviewer', x: 600, y: 250 },
      ],
      connections: [
        { from: 'architect', to: 'frontend' },
        { from: 'architect', to: 'backend' },
        { from: 'frontend', to: 'reviewer' },
        { from: 'backend', to: 'reviewer' },
      ],
    },
  },
  {
    id: 'content-creation',
    name: 'Content Creation',
    nameKo: '콘텐츠 제작',
    description: 'Research → Write → Review → Polish',
    descriptionKo: '조사 → 작성 → 검토 → 다듬기',
    strategy: 'pipeline',
    template: {
      id: 'content-creation',
      name: 'Content Creation',
      description: 'Content creation pipeline',
      agents: [
        { role: 'researcher', label: 'Researcher', x: 100, y: 200 },
        { role: 'coder', label: 'Writer', x: 300, y: 200 },
        { role: 'reviewer', label: 'Editor', x: 500, y: 200 },
        { role: 'synthesizer', label: 'Publisher', x: 700, y: 200 },
      ],
      connections: [
        { from: 'researcher', to: 'writer' },
        { from: 'writer', to: 'editor' },
        { from: 'editor', to: 'publisher' },
      ],
    },
  },
  {
    id: 'bug-fix',
    name: 'Bug Fix',
    nameKo: '버그 수정',
    description: 'Analyze → Fix → Test → Verify',
    descriptionKo: '분석 → 수정 → 테스트 → 검증',
    strategy: 'pipeline',
    template: {
      id: 'bug-fix',
      name: 'Bug Fix',
      description: 'Bug investigation and fix pipeline',
      agents: [
        { role: 'researcher', label: 'Debugger', x: 100, y: 200 },
        { role: 'coder', label: 'Fixer', x: 300, y: 200 },
        { role: 'reviewer', label: 'Tester', x: 500, y: 200 },
      ],
      connections: [
        { from: 'debugger', to: 'fixer' },
        { from: 'fixer', to: 'tester' },
      ],
    },
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    nameKo: '데이터 분석',
    description: 'Parallel data exploration → Insight synthesis',
    descriptionKo: '병렬 데이터 탐색 → 인사이트 종합',
    strategy: 'parallel',
    template: {
      id: 'data-analysis',
      name: 'Data Analysis',
      description: 'Multi-angle data analysis',
      agents: [
        { role: 'planner', label: 'Analyst Lead', x: 100, y: 250 },
        { role: 'researcher', label: 'Stats Analyst', x: 350, y: 150 },
        { role: 'researcher', label: 'Trend Analyst', x: 350, y: 350 },
        { role: 'synthesizer', label: 'Report Writer', x: 600, y: 250 },
      ],
      connections: [
        { from: 'lead', to: 'stats' },
        { from: 'lead', to: 'trends' },
        { from: 'stats', to: 'report' },
        { from: 'trends', to: 'report' },
      ],
    },
  },
  {
    id: 'translation-review',
    name: 'Translation Review',
    nameKo: '번역 검수',
    description: 'Translate → Back-translate → Compare',
    descriptionKo: '번역 → 역번역 → 비교 검증',
    strategy: 'pipeline',
    template: {
      id: 'translation-review',
      name: 'Translation Review',
      description: 'Translation with back-translation verification',
      agents: [
        { role: 'coder', label: 'Translator', x: 100, y: 200 },
        { role: 'coder', label: 'Back-Translator', x: 350, y: 200 },
        { role: 'reviewer', label: 'Verifier', x: 600, y: 200 },
      ],
      connections: [
        { from: 'translator', to: 'back-translator' },
        { from: 'back-translator', to: 'verifier' },
      ],
    },
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    nameKo: '브레인스토밍',
    description: 'Parallel idea generation → Best idea selection',
    descriptionKo: '병렬 아이디어 생성 → 최적안 선정',
    strategy: 'parallel',
    template: {
      id: 'brainstorm',
      name: 'Brainstorm',
      description: 'Parallel creative brainstorming',
      agents: [
        { role: 'researcher', label: 'Creative A', x: 200, y: 100 },
        { role: 'researcher', label: 'Creative B', x: 200, y: 250 },
        { role: 'researcher', label: 'Creative C', x: 200, y: 400 },
        { role: 'synthesizer', label: 'Curator', x: 500, y: 250 },
      ],
      connections: [
        { from: 'creative-a', to: 'curator' },
        { from: 'creative-b', to: 'curator' },
        { from: 'creative-c', to: 'curator' },
      ],
    },
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    nameKo: '보안 감사',
    description: 'Scan → Analyze → Recommend → Report',
    descriptionKo: '스캔 → 분석 → 권고 → 보고서',
    strategy: 'pipeline',
    template: {
      id: 'security-audit',
      name: 'Security Audit',
      description: 'Security audit pipeline',
      agents: [
        { role: 'researcher', label: 'Scanner', x: 100, y: 200 },
        { role: 'reviewer', label: 'Analyzer', x: 300, y: 200 },
        { role: 'planner', label: 'Advisor', x: 500, y: 200 },
        { role: 'synthesizer', label: 'Reporter', x: 700, y: 200 },
      ],
      connections: [
        { from: 'scanner', to: 'analyzer' },
        { from: 'analyzer', to: 'advisor' },
        { from: 'advisor', to: 'reporter' },
      ],
    },
  },
]

export function getWorkflow(id: string): SwarmWorkflow | undefined {
  return SWARM_WORKFLOWS.find((w) => w.id === id)
}

export function getWorkflowsByStrategy(strategy: OrchestrationStrategy): SwarmWorkflow[] {
  return SWARM_WORKFLOWS.filter((w) => w.strategy === strategy)
}
