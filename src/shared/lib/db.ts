import Dexie, { type EntityTable } from 'dexie'
import type {
  Message, Session, Project, UsageEntry, SavedPrompt, Persona, Folder, Tag,
  MemoryEntry, Schedule, SwarmAgent, SwarmConnection, ChannelConfig, Artifact,
  PinnedMessage, InsightReport, Plugin, CustomTheme, BatchJob, CacheEntry, AuditEntry,
  DashboardLayout, Workspace, CodeSnippet, ApiRequest, ApiCollection, RegexPattern,
  ConversionHistory, Diagram, GraphNode, GraphEdge, Canvas, CanvasNode, CanvasEdge,
  WorkflowSuggestion, McpServer, AgentRun, DataConnector, Notebook,
  LearningGoal, DataPipeline, CodeReviewSession, AppNotification, VisualPrompt,
  MeetingNote, Report, LearningPath, Bookmark, TranslationPair, GlossaryTerm,
  Presentation, FeedEntry, EmailDraft, TimelineSegment, MindMap,
} from '@/shared/types'

const db = new Dexie('hchat-desktop') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  messages: EntityTable<Message, 'id'>
  projects: EntityTable<Project, 'id'>
  usages: EntityTable<UsageEntry, 'id'>
  prompts: EntityTable<SavedPrompt, 'id'>
  personas: EntityTable<Persona, 'id'>
  folders: EntityTable<Folder, 'id'>
  tags: EntityTable<Tag, 'id'>
  memories: EntityTable<MemoryEntry, 'id'>
  schedules: EntityTable<Schedule, 'id'>
  swarmAgents: EntityTable<SwarmAgent, 'id'>
  swarmConnections: EntityTable<SwarmConnection, 'id'>
  channelConfigs: EntityTable<ChannelConfig & { id: string }, 'id'>
  artifacts: EntityTable<Artifact, 'id'>
  pinnedMessages: EntityTable<PinnedMessage, 'id'>
  insightReports: EntityTable<InsightReport, 'id'>
  plugins: EntityTable<Plugin, 'id'>
  customThemes: EntityTable<CustomTheme, 'id'>
  batchJobs: EntityTable<BatchJob, 'id'>
  cacheEntries: EntityTable<CacheEntry, 'id'>
  auditEntries: EntityTable<AuditEntry, 'id'>
  dashboardLayouts: EntityTable<DashboardLayout, 'id'>
  workspaces: EntityTable<Workspace, 'id'>
  snippets: EntityTable<CodeSnippet, 'id'>
  apiRequests: EntityTable<ApiRequest, 'id'>
  apiCollections: EntityTable<ApiCollection, 'id'>
  regexPatterns: EntityTable<RegexPattern, 'id'>
  conversionHistory: EntityTable<ConversionHistory, 'id'>
  diagrams: EntityTable<Diagram, 'id'>
  graphNodes: EntityTable<GraphNode, 'id'>
  graphEdges: EntityTable<GraphEdge, 'id'>
  canvases: EntityTable<Canvas, 'id'>
  canvasNodes: EntityTable<CanvasNode, 'id'>
  canvasEdges: EntityTable<CanvasEdge, 'id'>
  workflowSuggestions: EntityTable<WorkflowSuggestion, 'id'>
  mcpServers: EntityTable<McpServer, 'id'>
  agentRuns: EntityTable<AgentRun, 'id'>
  dataConnectors: EntityTable<DataConnector, 'id'>
  notebooks: EntityTable<Notebook, 'id'>
  learningGoals: EntityTable<LearningGoal, 'id'>
  dataPipelines: EntityTable<DataPipeline, 'id'>
  codeReviewSessions: EntityTable<CodeReviewSession, 'id'>
  appNotifications: EntityTable<AppNotification, 'id'>
  visualPrompts: EntityTable<VisualPrompt, 'id'>
  meetingNotes: EntityTable<MeetingNote, 'id'>
  reports: EntityTable<Report, 'id'>
  learningPaths: EntityTable<LearningPath, 'id'>
  bookmarks: EntityTable<Bookmark, 'id'>
  translationPairs: EntityTable<TranslationPair, 'id'>
  glossaryTerms: EntityTable<GlossaryTerm, 'id'>
  presentations: EntityTable<Presentation, 'id'>
  feedEntries: EntityTable<FeedEntry, 'id'>
  emailDrafts: EntityTable<EmailDraft, 'id'>
  timelineSegments: EntityTable<TimelineSegment, 'id'>
  mindMaps: EntityTable<MindMap, 'id'>
}

db.version(1).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
})

db.version(2).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
})

db.version(3).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
  folders: 'id',
  tags: 'id',
})

db.version(4).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
  folders: 'id',
  tags: 'id',
  memories: 'id, scope, updatedAt',
  schedules: 'id, status, updatedAt',
  swarmAgents: 'id, role',
  swarmConnections: 'id, from, to',
  channelConfigs: 'id',
})

db.version(5).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
  folders: 'id',
  tags: 'id',
  memories: 'id, scope, updatedAt',
  schedules: 'id, status, updatedAt',
  swarmAgents: 'id, role',
  swarmConnections: 'id, from, to',
  channelConfigs: 'id',
  artifacts: 'id, sessionId, messageId, updatedAt',
})

db.version(7).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
  folders: 'id',
  tags: 'id',
  memories: 'id, scope, updatedAt',
  schedules: 'id, status, updatedAt',
  swarmAgents: 'id, role',
  swarmConnections: 'id, from, to',
  channelConfigs: 'id',
  artifacts: 'id, sessionId, messageId, updatedAt',
  pinnedMessages: 'id, sessionId',
  insightReports: 'id, type, createdAt',
  plugins: 'id, status',
  customThemes: 'id, isActive',
  batchJobs: 'id, status, priority, createdAt',
  cacheEntries: 'id, promptHash, createdAt, expiresAt',
  auditEntries: 'id, action, createdAt',
  dashboardLayouts: 'id, updatedAt',
  workspaces: 'id, updatedAt',
  snippets: 'id, language, updatedAt',
  apiRequests: 'id, collectionId, updatedAt',
  apiCollections: 'id',
  regexPatterns: 'id, updatedAt',
  conversionHistory: 'id, createdAt',
  diagrams: 'id, type, updatedAt',
})

db.version(8).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
  folders: 'id',
  tags: 'id',
  memories: 'id, scope, updatedAt',
  schedules: 'id, status, updatedAt',
  swarmAgents: 'id, role',
  swarmConnections: 'id, from, to',
  channelConfigs: 'id',
  artifacts: 'id, sessionId, messageId, updatedAt',
  pinnedMessages: 'id, sessionId',
  insightReports: 'id, type, createdAt',
  plugins: 'id, status',
  customThemes: 'id, isActive',
  batchJobs: 'id, status, priority, createdAt',
  cacheEntries: 'id, promptHash, createdAt, expiresAt',
  auditEntries: 'id, action, createdAt',
  dashboardLayouts: 'id, updatedAt',
  workspaces: 'id, updatedAt',
  snippets: 'id, language, updatedAt',
  apiRequests: 'id, collectionId, updatedAt',
  apiCollections: 'id',
  regexPatterns: 'id, updatedAt',
  conversionHistory: 'id, createdAt',
  diagrams: 'id, type, updatedAt',
  graphNodes: 'id, type, sourceId, createdAt',
  graphEdges: 'id, source, target',
  canvases: 'id, updatedAt',
  canvasNodes: 'id, canvasId, type',
  canvasEdges: 'id, canvasId, source, target',
  workflowSuggestions: 'id, status, createdAt',
})

db.version(9).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
  folders: 'id',
  tags: 'id',
  memories: 'id, scope, updatedAt',
  schedules: 'id, status, updatedAt',
  swarmAgents: 'id, role',
  swarmConnections: 'id, from, to',
  channelConfigs: 'id',
  artifacts: 'id, sessionId, messageId, updatedAt',
  pinnedMessages: 'id, sessionId',
  insightReports: 'id, type, createdAt',
  plugins: 'id, status',
  customThemes: 'id, isActive',
  batchJobs: 'id, status, priority, createdAt',
  cacheEntries: 'id, promptHash, createdAt, expiresAt',
  auditEntries: 'id, action, createdAt',
  dashboardLayouts: 'id, updatedAt',
  workspaces: 'id, updatedAt',
  snippets: 'id, language, updatedAt',
  apiRequests: 'id, collectionId, updatedAt',
  apiCollections: 'id',
  regexPatterns: 'id, updatedAt',
  conversionHistory: 'id, createdAt',
  diagrams: 'id, type, updatedAt',
  graphNodes: 'id, type, sourceId, createdAt',
  graphEdges: 'id, source, target',
  canvases: 'id, updatedAt',
  canvasNodes: 'id, canvasId, type',
  canvasEdges: 'id, canvasId, source, target',
  workflowSuggestions: 'id, status, createdAt',
  mcpServers: 'id, status, createdAt',
  agentRuns: 'id, status, createdAt',
  dataConnectors: 'id, type, status',
  notebooks: 'id, updatedAt',
})

db.version(10).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
  folders: 'id', tags: 'id',
  memories: 'id, scope, updatedAt',
  schedules: 'id, status, updatedAt',
  swarmAgents: 'id, role', swarmConnections: 'id, from, to',
  channelConfigs: 'id',
  artifacts: 'id, sessionId, messageId, updatedAt',
  pinnedMessages: 'id, sessionId',
  insightReports: 'id, type, createdAt',
  plugins: 'id, status',
  customThemes: 'id, isActive',
  batchJobs: 'id, status, priority, createdAt',
  cacheEntries: 'id, promptHash, createdAt, expiresAt',
  auditEntries: 'id, action, createdAt',
  dashboardLayouts: 'id, updatedAt',
  workspaces: 'id, updatedAt',
  snippets: 'id, language, updatedAt',
  apiRequests: 'id, collectionId, updatedAt',
  apiCollections: 'id',
  regexPatterns: 'id, updatedAt',
  conversionHistory: 'id, createdAt',
  diagrams: 'id, type, updatedAt',
  graphNodes: 'id, type, sourceId, createdAt',
  graphEdges: 'id, source, target',
  canvases: 'id, updatedAt',
  canvasNodes: 'id, canvasId, type',
  canvasEdges: 'id, canvasId, source, target',
  workflowSuggestions: 'id, status, createdAt',
  mcpServers: 'id, status, createdAt',
  agentRuns: 'id, status, createdAt',
  dataConnectors: 'id, type, status',
  notebooks: 'id, updatedAt',
  learningGoals: 'id, status, updatedAt',
  dataPipelines: 'id, status, updatedAt',
  codeReviewSessions: 'id, status, createdAt',
  appNotifications: 'id, category, isRead, createdAt',
  visualPrompts: 'id, updatedAt',
  meetingNotes: 'id, template, updatedAt',
  reports: 'id, template, updatedAt',
  learningPaths: 'id, updatedAt',
  bookmarks: 'id, sessionId, messageId, createdAt',
  translationPairs: 'id, sourceLang, targetLang, domain',
  glossaryTerms: 'id, domain',
  presentations: 'id, updatedAt',
  feedEntries: 'id, period, createdAt',
  emailDrafts: 'id, createdAt',
  timelineSegments: 'id, sessionId',
  mindMaps: 'id, updatedAt',
})

db.version(6).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
  usages: 'id, sessionId, modelId, createdAt',
  prompts: 'id, category, isFavorite, updatedAt',
  personas: 'id, isDefault, updatedAt',
  folders: 'id',
  tags: 'id',
  memories: 'id, scope, updatedAt',
  schedules: 'id, status, updatedAt',
  swarmAgents: 'id, role',
  swarmConnections: 'id, from, to',
  channelConfigs: 'id',
  artifacts: 'id, sessionId, messageId, updatedAt',
  pinnedMessages: 'id, sessionId',
  insightReports: 'id, type, createdAt',
  plugins: 'id, status',
  customThemes: 'id, isActive',
  batchJobs: 'id, status, priority, createdAt',
  cacheEntries: 'id, promptHash, createdAt, expiresAt',
  auditEntries: 'id, action, createdAt',
})

// Session CRUD

export async function getAllSessions(): Promise<Session[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray()
}

export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id)
}

export async function putSession(session: Session): Promise<void> {
  await db.sessions.put(session)
}

export async function deleteSessionFromDb(id: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.messages, db.artifacts], async () => {
    await db.sessions.delete(id)
    await db.messages.where('sessionId').equals(id).delete()
    await db.artifacts.where('sessionId').equals(id).delete()
  })
}

// Message CRUD

export async function getMessagesBySession(sessionId: string): Promise<Message[]> {
  return db.messages.where('sessionId').equals(sessionId).sortBy('createdAt')
}

export async function putMessage(message: Message): Promise<void> {
  await db.messages.put(message)
}

export async function putMessages(messages: Message[]): Promise<void> {
  await db.messages.bulkPut(messages)
}

// Project CRUD

export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function putProject(project: Project): Promise<void> {
  await db.projects.put(project)
}

export async function deleteProjectFromDb(id: string): Promise<void> {
  await db.projects.delete(id)
}

// Bulk operations for initial hydration

export async function hydrateFromDb() {
  const [sessions, projects] = await Promise.all([
    getAllSessions(),
    getAllProjects(),
  ])

  const messagesMap: Record<string, Message[]> = {}
  for (const session of sessions) {
    messagesMap[session.id] = await getMessagesBySession(session.id)
  }

  return { sessions, projects, messagesMap }
}

// Usage CRUD

export async function putUsage(usage: UsageEntry): Promise<void> {
  await db.usages.put(usage)
}

export async function getAllUsages(): Promise<UsageEntry[]> {
  return db.usages.orderBy('createdAt').reverse().toArray()
}

export async function clearAllUsages(): Promise<void> {
  await db.usages.clear()
}

// Prompt CRUD

export async function getAllPrompts(): Promise<SavedPrompt[]> {
  return db.prompts.orderBy('updatedAt').reverse().toArray()
}

export async function putPrompt(prompt: SavedPrompt): Promise<void> {
  await db.prompts.put(prompt)
}

export async function deletePromptFromDb(id: string): Promise<void> {
  await db.prompts.delete(id)
}

// Persona CRUD

export async function getAllPersonas(): Promise<Persona[]> {
  return db.personas.orderBy('updatedAt').reverse().toArray()
}

export async function putPersona(persona: Persona): Promise<void> {
  await db.personas.put(persona)
}

export async function deletePersonaFromDb(id: string): Promise<void> {
  await db.personas.delete(id)
}

// Folder CRUD

export async function getAllFolders(): Promise<Folder[]> {
  return db.folders.toArray()
}

export async function putFolder(folder: Folder): Promise<void> {
  await db.folders.put(folder)
}

export async function deleteFolderFromDb(id: string): Promise<void> {
  await db.folders.delete(id)
}

// Tag CRUD

export async function getAllTags(): Promise<Tag[]> {
  return db.tags.toArray()
}

export async function putTag(tag: Tag): Promise<void> {
  await db.tags.put(tag)
}

export async function deleteTagFromDb(id: string): Promise<void> {
  await db.tags.delete(id)
}

// Memory CRUD

export async function getAllMemories(): Promise<MemoryEntry[]> {
  return db.memories.orderBy('updatedAt').reverse().toArray()
}

export async function putMemory(entry: MemoryEntry): Promise<void> {
  await db.memories.put(entry)
}

export async function deleteMemoryFromDb(id: string): Promise<void> {
  await db.memories.delete(id)
}

// Schedule CRUD

export async function getAllSchedules(): Promise<Schedule[]> {
  return db.schedules.orderBy('updatedAt').reverse().toArray()
}

export async function putSchedule(schedule: Schedule): Promise<void> {
  await db.schedules.put(schedule)
}

export async function deleteScheduleFromDb(id: string): Promise<void> {
  await db.schedules.delete(id)
}

// Swarm CRUD

export async function getAllSwarmAgents(): Promise<SwarmAgent[]> {
  return db.swarmAgents.toArray()
}

export async function putSwarmAgent(agent: SwarmAgent): Promise<void> {
  await db.swarmAgents.put(agent)
}

export async function deleteSwarmAgentFromDb(id: string): Promise<void> {
  await db.swarmAgents.delete(id)
}

export async function getAllSwarmConnections(): Promise<SwarmConnection[]> {
  return db.swarmConnections.toArray()
}

export async function putSwarmConnection(connection: SwarmConnection): Promise<void> {
  await db.swarmConnections.put(connection)
}

export async function deleteSwarmConnectionFromDb(id: string): Promise<void> {
  await db.swarmConnections.delete(id)
}

export async function clearSwarmData(): Promise<void> {
  await db.transaction('rw', [db.swarmAgents, db.swarmConnections], async () => {
    await db.swarmAgents.clear()
    await db.swarmConnections.clear()
  })
}

export async function bulkPutSwarmAgents(agents: SwarmAgent[]): Promise<void> {
  await db.swarmAgents.bulkPut(agents)
}

// Channel Config CRUD

export async function getChannelConfig(): Promise<(ChannelConfig & { id: string }) | undefined> {
  return db.channelConfigs.get('default')
}

export async function putChannelConfig(config: ChannelConfig): Promise<void> {
  await db.channelConfigs.put({ ...config, id: 'default' })
}

// Artifact CRUD

export async function getArtifactsBySession(sessionId: string): Promise<Artifact[]> {
  return db.artifacts.where('sessionId').equals(sessionId).sortBy('updatedAt')
}

export async function putArtifact(artifact: Artifact): Promise<void> {
  await db.artifacts.put(artifact)
}

export async function deleteArtifactFromDb(id: string): Promise<void> {
  await db.artifacts.delete(id)
}

// Pinned Message CRUD

export async function getPinnedMessagesBySession(sessionId: string): Promise<PinnedMessage[]> {
  return db.pinnedMessages.where('sessionId').equals(sessionId).toArray()
}

export async function putPinnedMessage(pin: PinnedMessage): Promise<void> {
  await db.pinnedMessages.put(pin)
}

export async function deletePinnedMessageFromDb(id: string): Promise<void> {
  await db.pinnedMessages.delete(id)
}

// Insight Report CRUD

export async function getAllInsightReports(): Promise<InsightReport[]> {
  return db.insightReports.orderBy('createdAt').reverse().toArray()
}

export async function putInsightReport(report: InsightReport): Promise<void> {
  await db.insightReports.put(report)
}

export async function deleteInsightReportFromDb(id: string): Promise<void> {
  await db.insightReports.delete(id)
}

// Plugin CRUD

export async function getAllPlugins(): Promise<Plugin[]> {
  return db.plugins.toArray()
}

export async function putPlugin(plugin: Plugin): Promise<void> {
  await db.plugins.put(plugin)
}

export async function deletePluginFromDb(id: string): Promise<void> {
  await db.plugins.delete(id)
}

// Custom Theme CRUD

export async function getAllCustomThemes(): Promise<CustomTheme[]> {
  return db.customThemes.toArray()
}

export async function putCustomTheme(theme: CustomTheme): Promise<void> {
  await db.customThemes.put(theme)
}

export async function deleteCustomThemeFromDb(id: string): Promise<void> {
  await db.customThemes.delete(id)
}

// Batch Job CRUD

export async function getAllBatchJobs(): Promise<BatchJob[]> {
  return db.batchJobs.orderBy('createdAt').reverse().toArray()
}

export async function putBatchJob(job: BatchJob): Promise<void> {
  await db.batchJobs.put(job)
}

export async function deleteBatchJobFromDb(id: string): Promise<void> {
  await db.batchJobs.delete(id)
}

// Cache Entry CRUD

export async function getAllCacheEntries(): Promise<CacheEntry[]> {
  return db.cacheEntries.orderBy('createdAt').reverse().toArray()
}

export async function putCacheEntry(entry: CacheEntry): Promise<void> {
  await db.cacheEntries.put(entry)
}

export async function deleteCacheEntryFromDb(id: string): Promise<void> {
  await db.cacheEntries.delete(id)
}

export async function clearAllCacheEntries(): Promise<void> {
  await db.cacheEntries.clear()
}

// Audit Entry CRUD

export async function getAllAuditEntries(): Promise<AuditEntry[]> {
  return db.auditEntries.orderBy('createdAt').reverse().toArray()
}

export async function putAuditEntry(entry: AuditEntry): Promise<void> {
  await db.auditEntries.put(entry)
}

export async function clearAllAuditEntries(): Promise<void> {
  await db.auditEntries.clear()
}

// Dashboard Layout CRUD

export async function getAllDashboardLayouts(): Promise<DashboardLayout[]> {
  return db.dashboardLayouts.toArray()
}

export async function putDashboardLayout(layout: DashboardLayout): Promise<void> {
  await db.dashboardLayouts.put(layout)
}

export async function deleteDashboardLayoutFromDb(id: string): Promise<void> {
  await db.dashboardLayouts.delete(id)
}

// Workspace CRUD

export async function getAllWorkspaces(): Promise<Workspace[]> {
  return db.workspaces.orderBy('updatedAt').reverse().toArray()
}

export async function putWorkspace(workspace: Workspace): Promise<void> {
  await db.workspaces.put(workspace)
}

export async function deleteWorkspaceFromDb(id: string): Promise<void> {
  await db.workspaces.delete(id)
}

// Code Snippet CRUD (Phase 14)

export async function getAllSnippets(): Promise<CodeSnippet[]> {
  return db.snippets.orderBy('updatedAt').reverse().toArray()
}

export async function putSnippet(snippet: CodeSnippet): Promise<void> {
  await db.snippets.put(snippet)
}

export async function deleteSnippetFromDb(id: string): Promise<void> {
  await db.snippets.delete(id)
}

// API Tester CRUD (Phase 14)

export async function getAllApiRequests(): Promise<ApiRequest[]> {
  return db.apiRequests.orderBy('updatedAt').reverse().toArray()
}

export async function putApiRequest(request: ApiRequest): Promise<void> {
  await db.apiRequests.put(request)
}

export async function deleteApiRequestFromDb(id: string): Promise<void> {
  await db.apiRequests.delete(id)
}

export async function getAllApiCollections(): Promise<ApiCollection[]> {
  return db.apiCollections.toArray()
}

export async function putApiCollection(collection: ApiCollection): Promise<void> {
  await db.apiCollections.put(collection)
}

export async function deleteApiCollectionFromDb(id: string): Promise<void> {
  await db.apiCollections.delete(id)
}

// Regex Pattern CRUD (Phase 14)

export async function getAllRegexPatterns(): Promise<RegexPattern[]> {
  return db.regexPatterns.orderBy('updatedAt').reverse().toArray()
}

export async function putRegexPattern(pattern: RegexPattern): Promise<void> {
  await db.regexPatterns.put(pattern)
}

export async function deleteRegexPatternFromDb(id: string): Promise<void> {
  await db.regexPatterns.delete(id)
}

// Conversion History CRUD (Phase 14)

export async function getAllConversionHistory(): Promise<ConversionHistory[]> {
  return db.conversionHistory.orderBy('createdAt').reverse().toArray()
}

export async function putConversionHistory(entry: ConversionHistory): Promise<void> {
  await db.conversionHistory.put(entry)
}

export async function clearConversionHistory(): Promise<void> {
  await db.conversionHistory.clear()
}

// Diagram CRUD (Phase 14)

export async function getAllDiagrams(): Promise<Diagram[]> {
  return db.diagrams.orderBy('updatedAt').reverse().toArray()
}

export async function putDiagram(diagram: Diagram): Promise<void> {
  await db.diagrams.put(diagram)
}

export async function deleteDiagramFromDb(id: string): Promise<void> {
  await db.diagrams.delete(id)
}

// Knowledge Graph CRUD (Phase 15)

export async function getAllGraphNodes(): Promise<GraphNode[]> {
  return db.graphNodes.orderBy('createdAt').reverse().toArray()
}

export async function putGraphNode(node: GraphNode): Promise<void> {
  await db.graphNodes.put(node)
}

export async function deleteGraphNodeFromDb(id: string): Promise<void> {
  await db.transaction('rw', [db.graphNodes, db.graphEdges], async () => {
    await db.graphNodes.delete(id)
    await db.graphEdges.where('source').equals(id).delete()
    await db.graphEdges.where('target').equals(id).delete()
  })
}

export async function getAllGraphEdges(): Promise<GraphEdge[]> {
  return db.graphEdges.toArray()
}

export async function putGraphEdge(edge: GraphEdge): Promise<void> {
  await db.graphEdges.put(edge)
}

export async function deleteGraphEdgeFromDb(id: string): Promise<void> {
  await db.graphEdges.delete(id)
}

// Canvas CRUD (Phase 15)

export async function getAllCanvases(): Promise<Canvas[]> {
  return db.canvases.orderBy('updatedAt').reverse().toArray()
}

export async function putCanvas(canvas: Canvas): Promise<void> {
  await db.canvases.put(canvas)
}

export async function deleteCanvasFromDb(id: string): Promise<void> {
  await db.transaction('rw', [db.canvases, db.canvasNodes, db.canvasEdges], async () => {
    await db.canvases.delete(id)
    await db.canvasNodes.where('canvasId').equals(id).delete()
    await db.canvasEdges.where('canvasId').equals(id).delete()
  })
}

export async function getCanvasNodes(canvasId: string): Promise<CanvasNode[]> {
  return db.canvasNodes.where('canvasId').equals(canvasId).toArray()
}

export async function putCanvasNode(node: CanvasNode): Promise<void> {
  await db.canvasNodes.put(node)
}

export async function deleteCanvasNodeFromDb(id: string): Promise<void> {
  await db.canvasNodes.delete(id)
}

export async function getCanvasEdges(canvasId: string): Promise<CanvasEdge[]> {
  return db.canvasEdges.where('canvasId').equals(canvasId).toArray()
}

export async function putCanvasEdge(edge: CanvasEdge): Promise<void> {
  await db.canvasEdges.put(edge)
}

export async function deleteCanvasEdgeFromDb(id: string): Promise<void> {
  await db.canvasEdges.delete(id)
}

// Workflow Suggestion CRUD (Phase 15)

export async function getAllWorkflowSuggestions(): Promise<WorkflowSuggestion[]> {
  return db.workflowSuggestions.orderBy('createdAt').reverse().toArray()
}

export async function putWorkflowSuggestion(suggestion: WorkflowSuggestion): Promise<void> {
  await db.workflowSuggestions.put(suggestion)
}

export async function deleteWorkflowSuggestionFromDb(id: string): Promise<void> {
  await db.workflowSuggestions.delete(id)
}

// MCP Server CRUD (Phase 10)

export async function getAllMcpServers(): Promise<McpServer[]> {
  return db.mcpServers.orderBy('createdAt').reverse().toArray()
}

export async function putMcpServer(server: McpServer): Promise<void> {
  await db.mcpServers.put(server)
}

export async function deleteMcpServerFromDb(id: string): Promise<void> {
  await db.mcpServers.delete(id)
}

// Agent Run CRUD (Phase 10)

export async function getAllAgentRuns(): Promise<AgentRun[]> {
  return db.agentRuns.orderBy('createdAt').reverse().toArray()
}

export async function putAgentRun(run: AgentRun): Promise<void> {
  await db.agentRuns.put(run)
}

export async function deleteAgentRunFromDb(id: string): Promise<void> {
  await db.agentRuns.delete(id)
}

// Data Connector CRUD (Phase 10)

export async function getAllDataConnectors(): Promise<DataConnector[]> {
  return db.dataConnectors.toArray()
}

export async function putDataConnector(connector: DataConnector): Promise<void> {
  await db.dataConnectors.put(connector)
}

export async function deleteDataConnectorFromDb(id: string): Promise<void> {
  await db.dataConnectors.delete(id)
}

// Notebook CRUD (Phase 10)

export async function getAllNotebooks(): Promise<Notebook[]> {
  return db.notebooks.orderBy('updatedAt').reverse().toArray()
}

export async function putNotebook(notebook: Notebook): Promise<void> {
  await db.notebooks.put(notebook)
}

export async function deleteNotebookFromDb(id: string): Promise<void> {
  await db.notebooks.delete(id)
}

// Learning Goal CRUD (Phase 11)
export async function getAllLearningGoals(): Promise<LearningGoal[]> { return db.learningGoals.orderBy('updatedAt').reverse().toArray() }
export async function putLearningGoal(g: LearningGoal): Promise<void> { await db.learningGoals.put(g) }
export async function deleteLearningGoalFromDb(id: string): Promise<void> { await db.learningGoals.delete(id) }

// Data Pipeline CRUD (Phase 11)
export async function getAllDataPipelines(): Promise<DataPipeline[]> { return db.dataPipelines.orderBy('updatedAt').reverse().toArray() }
export async function putDataPipeline(p: DataPipeline): Promise<void> { await db.dataPipelines.put(p) }
export async function deleteDataPipelineFromDb(id: string): Promise<void> { await db.dataPipelines.delete(id) }

// Code Review CRUD (Phase 11)
export async function getAllCodeReviewSessions(): Promise<CodeReviewSession[]> { return db.codeReviewSessions.orderBy('createdAt').reverse().toArray() }
export async function putCodeReviewSession(s: CodeReviewSession): Promise<void> { await db.codeReviewSessions.put(s) }
export async function deleteCodeReviewSessionFromDb(id: string): Promise<void> { await db.codeReviewSessions.delete(id) }

// Notification CRUD (Phase 11)
export async function getAllAppNotifications(): Promise<AppNotification[]> { return db.appNotifications.orderBy('createdAt').reverse().toArray() }
export async function putAppNotification(n: AppNotification): Promise<void> { await db.appNotifications.put(n) }
export async function deleteAppNotificationFromDb(id: string): Promise<void> { await db.appNotifications.delete(id) }
export async function clearAllNotifications(): Promise<void> { await db.appNotifications.clear() }

// Visual Prompt CRUD (Phase 11)
export async function getAllVisualPrompts(): Promise<VisualPrompt[]> { return db.visualPrompts.orderBy('updatedAt').reverse().toArray() }
export async function putVisualPrompt(p: VisualPrompt): Promise<void> { await db.visualPrompts.put(p) }
export async function deleteVisualPromptFromDb(id: string): Promise<void> { await db.visualPrompts.delete(id) }

// Phase 12 CRUD
export async function getAllMeetingNotes(): Promise<MeetingNote[]> { return db.meetingNotes.orderBy('updatedAt').reverse().toArray() }
export async function putMeetingNote(n: MeetingNote): Promise<void> { await db.meetingNotes.put(n) }
export async function deleteMeetingNoteFromDb(id: string): Promise<void> { await db.meetingNotes.delete(id) }

export async function getAllReports(): Promise<Report[]> { return db.reports.orderBy('updatedAt').reverse().toArray() }
export async function putReport(r: Report): Promise<void> { await db.reports.put(r) }
export async function deleteReportFromDb(id: string): Promise<void> { await db.reports.delete(id) }

export async function getAllLearningPaths(): Promise<LearningPath[]> { return db.learningPaths.orderBy('updatedAt').reverse().toArray() }
export async function putLearningPath(p: LearningPath): Promise<void> { await db.learningPaths.put(p) }
export async function deleteLearningPathFromDb(id: string): Promise<void> { await db.learningPaths.delete(id) }

export async function getAllBookmarks(): Promise<Bookmark[]> { return db.bookmarks.orderBy('createdAt').reverse().toArray() }
export async function putBookmark(b: Bookmark): Promise<void> { await db.bookmarks.put(b) }
export async function deleteBookmarkFromDb(id: string): Promise<void> { await db.bookmarks.delete(id) }

export async function getAllTranslationPairs(): Promise<TranslationPair[]> { return db.translationPairs.toArray() }
export async function putTranslationPair(p: TranslationPair): Promise<void> { await db.translationPairs.put(p) }
export async function deleteTranslationPairFromDb(id: string): Promise<void> { await db.translationPairs.delete(id) }

export async function getAllGlossaryTerms(): Promise<GlossaryTerm[]> { return db.glossaryTerms.toArray() }
export async function putGlossaryTerm(t: GlossaryTerm): Promise<void> { await db.glossaryTerms.put(t) }
export async function deleteGlossaryTermFromDb(id: string): Promise<void> { await db.glossaryTerms.delete(id) }

// Phase 13 CRUD
export async function getAllPresentations(): Promise<Presentation[]> { return db.presentations.orderBy('updatedAt').reverse().toArray() }
export async function putPresentation(p: Presentation): Promise<void> { await db.presentations.put(p) }
export async function deletePresentationFromDb(id: string): Promise<void> { await db.presentations.delete(id) }

export async function getAllFeedEntries(): Promise<FeedEntry[]> { return db.feedEntries.orderBy('createdAt').reverse().toArray() }
export async function putFeedEntry(e: FeedEntry): Promise<void> { await db.feedEntries.put(e) }
export async function deleteFeedEntryFromDb(id: string): Promise<void> { await db.feedEntries.delete(id) }

export async function getAllEmailDrafts(): Promise<EmailDraft[]> { return db.emailDrafts.orderBy('createdAt').reverse().toArray() }
export async function putEmailDraft(d: EmailDraft): Promise<void> { await db.emailDrafts.put(d) }
export async function deleteEmailDraftFromDb(id: string): Promise<void> { await db.emailDrafts.delete(id) }

export async function getTimelineSegments(sessionId: string): Promise<TimelineSegment[]> { return db.timelineSegments.where('sessionId').equals(sessionId).toArray() }
export async function putTimelineSegment(s: TimelineSegment): Promise<void> { await db.timelineSegments.put(s) }
export async function deleteTimelineSegmentFromDb(id: string): Promise<void> { await db.timelineSegments.delete(id) }

export async function getAllMindMaps(): Promise<MindMap[]> { return db.mindMaps.orderBy('updatedAt').reverse().toArray() }
export async function putMindMap(m: MindMap): Promise<void> { await db.mindMaps.put(m) }
export async function deleteMindMapFromDb(id: string): Promise<void> { await db.mindMaps.delete(id) }

export { db }
