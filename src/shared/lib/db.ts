import Dexie, { type EntityTable } from 'dexie'
import type { Message, Session, Project, UsageEntry, SavedPrompt, Persona, Folder, Tag } from '@/shared/types'

const db = new Dexie('hchat-desktop') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  messages: EntityTable<Message, 'id'>
  projects: EntityTable<Project, 'id'>
  usages: EntityTable<UsageEntry, 'id'>
  prompts: EntityTable<SavedPrompt, 'id'>
  personas: EntityTable<Persona, 'id'>
  folders: EntityTable<Folder, 'id'>
  tags: EntityTable<Tag, 'id'>
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
  await db.transaction('rw', [db.sessions, db.messages], async () => {
    await db.sessions.delete(id)
    await db.messages.where('sessionId').equals(id).delete()
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

export { db }
