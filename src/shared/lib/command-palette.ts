export interface CommandAction {
  id: string
  label: string
  shortcut?: string
  category: 'navigation' | 'action' | 'settings' | 'tool'
  execute: () => void
  keywords?: string[]
}

const commands = new Map<string, CommandAction>()

export function registerCommand(command: CommandAction): void {
  commands.set(command.id, command)
}

export function unregisterCommand(id: string): void {
  commands.delete(id)
}

export function getCommands(): readonly CommandAction[] {
  return Array.from(commands.values())
}

export function searchCommands(query: string): readonly CommandAction[] {
  if (!query.trim()) return getCommands()

  const q = query.toLowerCase()
  return getCommands()
    .filter((cmd) => {
      const searchable = [cmd.label, ...(cmd.keywords ?? [])].join(' ').toLowerCase()
      return searchable.includes(q)
    })
    .sort((a, b) => {
      const aExact = a.label.toLowerCase().startsWith(q) ? 1 : 0
      const bExact = b.label.toLowerCase().startsWith(q) ? 1 : 0
      return bExact - aExact
    })
}

export function getCommandsByCategory(category: CommandAction['category']): readonly CommandAction[] {
  return getCommands().filter((cmd) => cmd.category === category)
}

export function executeCommand(id: string): boolean {
  const cmd = commands.get(id)
  if (!cmd) return false
  cmd.execute()
  return true
}

export function clearCommands(): void {
  commands.clear()
}
