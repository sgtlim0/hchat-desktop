import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  registerCommand,
  unregisterCommand,
  getCommands,
  searchCommands,
  getCommandsByCategory,
  executeCommand,
  clearCommands,
} from '../command-palette'

describe('command-palette', () => {
  beforeEach(() => {
    clearCommands()
  })

  it('registers a command', () => {
    registerCommand({ id: 'test', label: 'Test', category: 'action', execute: vi.fn() })
    expect(getCommands()).toHaveLength(1)
  })

  it('unregisters a command', () => {
    registerCommand({ id: 'test', label: 'Test', category: 'action', execute: vi.fn() })
    unregisterCommand('test')
    expect(getCommands()).toHaveLength(0)
  })

  it('searches by label', () => {
    registerCommand({ id: 'a', label: 'New Chat', category: 'action', execute: vi.fn() })
    registerCommand({ id: 'b', label: 'Settings', category: 'settings', execute: vi.fn() })
    const results = searchCommands('chat')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('a')
  })

  it('searches by keywords', () => {
    registerCommand({
      id: 'dm',
      label: 'Toggle Dark Mode',
      category: 'settings',
      execute: vi.fn(),
      keywords: ['theme', 'night'],
    })
    expect(searchCommands('night')).toHaveLength(1)
  })

  it('returns all on empty query', () => {
    registerCommand({ id: 'a', label: 'A', category: 'action', execute: vi.fn() })
    registerCommand({ id: 'b', label: 'B', category: 'tool', execute: vi.fn() })
    expect(searchCommands('')).toHaveLength(2)
  })

  it('search is case insensitive', () => {
    registerCommand({ id: 'a', label: 'New Chat', category: 'action', execute: vi.fn() })
    expect(searchCommands('NEW CHAT')).toHaveLength(1)
  })

  it('filters by category', () => {
    registerCommand({ id: 'a', label: 'A', category: 'action', execute: vi.fn() })
    registerCommand({ id: 'b', label: 'B', category: 'tool', execute: vi.fn() })
    registerCommand({ id: 'c', label: 'C', category: 'action', execute: vi.fn() })
    expect(getCommandsByCategory('action')).toHaveLength(2)
    expect(getCommandsByCategory('tool')).toHaveLength(1)
  })

  it('executes command and returns true', () => {
    const fn = vi.fn()
    registerCommand({ id: 'test', label: 'Test', category: 'action', execute: fn })
    expect(executeCommand('test')).toBe(true)
    expect(fn).toHaveBeenCalled()
  })

  it('returns false for unknown command', () => {
    expect(executeCommand('nonexistent')).toBe(false)
  })

  it('clears all commands', () => {
    registerCommand({ id: 'a', label: 'A', category: 'action', execute: vi.fn() })
    registerCommand({ id: 'b', label: 'B', category: 'tool', execute: vi.fn() })
    clearCommands()
    expect(getCommands()).toHaveLength(0)
  })

  it('prioritizes label-start matches in search', () => {
    registerCommand({ id: 'a', label: 'Search Modal', category: 'action', execute: vi.fn() })
    registerCommand({ id: 'b', label: 'Web Search', category: 'tool', execute: vi.fn() })
    const results = searchCommands('search')
    expect(results[0].id).toBe('a')
  })

  it('supports shortcut metadata', () => {
    registerCommand({
      id: 'search',
      label: 'Search',
      shortcut: '⌘K',
      category: 'action',
      execute: vi.fn(),
    })
    expect(getCommands()[0].shortcut).toBe('⌘K')
  })
})
