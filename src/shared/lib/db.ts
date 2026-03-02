import Dexie, { type EntityTable } from 'dexie'
import type { Message, Session, Project } from '@/shared/types'

const db = new Dexie('hchat-desktop') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  messages: EntityTable<Message, 'id'>
  projects: EntityTable<Project, 'id'>
}

db.version(1).stores({
  sessions: 'id, projectId, updatedAt, isFavorite',
  messages: 'id, sessionId, createdAt',
  projects: 'id, updatedAt',
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

export { db }
