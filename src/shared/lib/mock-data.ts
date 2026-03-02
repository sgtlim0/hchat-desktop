import type { Session, Message, Project } from '../types'

const now = new Date()
const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

export const mockSessions: Session[] = [
  {
    id: 'session-1',
    title: 'React 컴포넌트 리팩토링',
    modelId: 'claude-sonnet-4',
    projectId: 'project-1',
    isFavorite: true,
    isStreaming: false,
    pinned: true,
    tags: ['react', 'refactoring'],
    lastMessage: '컴포넌트를 작은 단위로 분리하는 것이 좋겠습니다.',
    createdAt: hourAgo,
    updatedAt: hourAgo,
  },
  {
    id: 'session-2',
    title: 'API 에러 핸들링 개선',
    modelId: 'claude-opus-4',
    isFavorite: false,
    isStreaming: true,
    pinned: false,
    tags: ['api', 'error-handling'],
    lastMessage: '에러 바운더리를 추가하고 있습니다...',
    createdAt: dayAgo,
    updatedAt: now.toISOString(),
  },
  {
    id: 'session-3',
    title: 'TypeScript 제네릭 질문',
    modelId: 'claude-haiku-3.5',
    isFavorite: false,
    isStreaming: false,
    pinned: false,
    tags: ['typescript'],
    lastMessage: '제네릭 타입 추론이 잘 됩니다.',
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
  {
    id: 'session-4',
    title: '데이터베이스 스키마 설계',
    modelId: 'claude-sonnet-4',
    projectId: 'project-2',
    isFavorite: false,
    isStreaming: false,
    pinned: false,
    tags: ['database', 'schema'],
    lastMessage: 'ERD를 기반으로 마이그레이션을 작성했습니다.',
    createdAt: weekAgo,
    updatedAt: weekAgo,
  },
  {
    id: 'session-5',
    title: 'Docker Compose 설정',
    modelId: 'claude-sonnet-4',
    isFavorite: false,
    isStreaming: false,
    pinned: true,
    tags: ['docker', 'devops'],
    lastMessage: 'docker-compose.yml 파일을 생성했습니다.',
    createdAt: twoWeeksAgo,
    updatedAt: twoWeeksAgo,
  },
  {
    id: 'session-6',
    title: '성능 최적화 분석',
    modelId: 'claude-opus-4',
    projectId: 'project-1',
    isFavorite: false,
    isStreaming: false,
    pinned: false,
    tags: ['performance'],
    lastMessage: '번들 사이즈를 40% 줄일 수 있습니다.',
    createdAt: monthAgo,
    updatedAt: monthAgo,
  },
]

export const mockMessages: Record<string, Message[]> = {
  'session-1': [
    {
      id: 'msg-1-1',
      sessionId: 'session-1',
      role: 'user',
      segments: [{ type: 'text', content: 'React 컴포넌트가 너무 커졌어요. 리팩토링 도와주세요.' }],
      createdAt: hourAgo,
    },
    {
      id: 'msg-1-2',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [
        {
          type: 'tool',
          toolCalls: [
            { id: 'tc-1', toolName: 'read_file', args: { path: 'src/components/Dashboard.tsx' }, result: '// 450 lines...', status: 'done' },
            { id: 'tc-2', toolName: 'search_files', args: { query: 'useState' }, result: '12 matches found', status: 'done' },
          ],
        },
        {
          type: 'text',
          content: `컴포넌트를 분석해 보았습니다. 몇 가지 리팩토링 제안을 드립니다:\n\n## 1. 컴포넌트 분리\n\n현재 \`Dashboard.tsx\`가 450줄로 너무 큽니다. 다음과 같이 분리하는 것을 추천합니다:\n\n\`\`\`typescript\n// DashboardHeader.tsx\nexport function DashboardHeader({ title, onRefresh }: Props) {\n  return (\n    <header className="flex items-center justify-between p-4">\n      <h1>{title}</h1>\n      <button onClick={onRefresh}>새로고침</button>\n    </header>\n  )\n}\n\`\`\`\n\n## 2. 커스텀 훅 추출\n\n상태 로직을 커스텀 훅으로 분리하세요:\n\n\`\`\`typescript\n// useDashboardData.ts\nexport function useDashboardData() {\n  const [data, setData] = useState<DashboardData | null>(null)\n  const [loading, setLoading] = useState(true)\n  // ...\n  return { data, loading, refresh }\n}\n\`\`\`\n\n컴포넌트를 작은 단위로 분리하는 것이 좋겠습니다.`,
        },
      ],
      createdAt: hourAgo,
    },
  ],
  'session-2': [
    {
      id: 'msg-2-1',
      sessionId: 'session-2',
      role: 'user',
      segments: [{ type: 'text', content: 'API 호출 시 에러 처리가 제대로 안 되고 있어요. 개선해 주세요.' }],
      createdAt: dayAgo,
    },
    {
      id: 'msg-2-2',
      sessionId: 'session-2',
      role: 'assistant',
      segments: [
        {
          type: 'tool',
          toolCalls: [
            { id: 'tc-3', toolName: 'search_files', args: { query: 'catch' }, result: '8 matches', status: 'done' },
          ],
        },
        {
          type: 'text',
          content: '에러 핸들링 패턴을 개선하겠습니다. 먼저 현재 코드를 분석했습니다.\n\n주요 문제점:\n1. `catch` 블록에서 에러를 무시하고 있음\n2. 사용자에게 에러 메시지를 표시하지 않음\n3. 재시도 로직이 없음',
        },
        {
          type: 'tool',
          toolCalls: [
            { id: 'tc-4', toolName: 'write_file', args: { path: 'src/lib/api-client.ts' }, status: 'running' },
          ],
        },
      ],
      createdAt: now.toISOString(),
    },
  ],
  'session-3': [
    {
      id: 'msg-3-1',
      sessionId: 'session-3',
      role: 'user',
      segments: [{ type: 'text', content: 'TypeScript에서 제네릭 타입 추론은 어떻게 작동하나요?' }],
      createdAt: twoDaysAgo,
    },
    {
      id: 'msg-3-2',
      sessionId: 'session-3',
      role: 'assistant',
      segments: [
        {
          type: 'text',
          content: 'TypeScript의 제네릭 타입 추론은 함수 호출 시 전달된 인자의 타입을 기반으로 자동으로 타입 파라미터를 결정하는 메커니즘입니다.\n\n```typescript\nfunction identity<T>(arg: T): T {\n  return arg\n}\n\n// T는 자동으로 string으로 추론됨\nconst result = identity("hello")\n```\n\n제네릭 타입 추론이 잘 됩니다.',
        },
      ],
      createdAt: twoDaysAgo,
    },
  ],
}

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'H Chat Desktop',
    description: 'AI 채팅 데스크톱 애플리케이션',
    instructions: '이 프로젝트는 React + TypeScript + Tailwind CSS를 사용합니다. 컴포넌트는 함수형으로 작성하고, 상태 관리는 Zustand를 사용합니다.',
    memories: [
      { id: 'mem-1', key: '기술 스택', value: 'React 18, TypeScript 5, Tailwind CSS 3.4, Zustand 5' },
      { id: 'mem-2', key: '코딩 컨벤션', value: '함수형 컴포넌트, 불변 패턴, FSD 아키텍처' },
    ],
    sessionIds: ['session-1', 'session-6'],
    createdAt: monthAgo,
    updatedAt: hourAgo,
  },
  {
    id: 'project-2',
    name: 'Backend API',
    description: 'Express.js 백엔드 서버',
    instructions: 'Express.js + TypeScript + SQLite를 사용하는 REST API 서버입니다. 헥사고날 아키텍처를 따릅니다.',
    memories: [
      { id: 'mem-3', key: 'DB', value: 'better-sqlite3' },
      { id: 'mem-4', key: '포트', value: '3001' },
    ],
    sessionIds: ['session-4'],
    createdAt: weekAgo,
    updatedAt: weekAgo,
  },
  {
    id: 'project-3',
    name: '문서 자동화',
    description: 'API 문서 자동 생성 시스템',
    instructions: 'OpenAPI 스펙에서 자동으로 문서를 생성합니다.',
    memories: [],
    sessionIds: [],
    createdAt: twoWeeksAgo,
    updatedAt: twoWeeksAgo,
  },
  {
    id: 'project-4',
    name: '테스트 자동화',
    description: 'E2E 및 단위 테스트 프레임워크',
    instructions: 'Vitest + Playwright를 사용한 테스트 자동화 프로젝트입니다.',
    memories: [
      { id: 'mem-5', key: '테스트 프레임워크', value: 'Vitest, Playwright' },
    ],
    sessionIds: [],
    createdAt: monthAgo,
    updatedAt: twoWeeksAgo,
  },
  {
    id: 'project-5',
    name: 'DevOps 파이프라인',
    description: 'CI/CD 파이프라인 구축',
    instructions: 'GitHub Actions를 사용한 CI/CD 파이프라인을 구축합니다.',
    memories: [],
    sessionIds: ['session-5'],
    createdAt: monthAgo,
    updatedAt: monthAgo,
  },
]
