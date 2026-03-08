import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp'

describe('KeyboardShortcutsHelp', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<KeyboardShortcutsHelp open={false} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders dialog when open', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('shows title', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />)
    expect(screen.getByText('shortcuts.title')).toBeTruthy()
  })

  it('shows all shortcut actions', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />)
    expect(screen.getByText('shortcuts.search')).toBeTruthy()
    expect(screen.getByText('shortcuts.sidebar')).toBeTruthy()
    expect(screen.getByText('shortcuts.settings')).toBeTruthy()
    expect(screen.getByText('shortcuts.copilot')).toBeTruthy()
    expect(screen.getByText('shortcuts.close')).toBeTruthy()
  })

  it('shows keyboard keys', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />)
    const kbds = screen.getAllByText('⌘')
    expect(kbds.length).toBeGreaterThanOrEqual(4)
  })

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close when dialog content clicked', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('shortcuts.title'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows hint text', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />)
    expect(screen.getByText('shortcuts.hint')).toBeTruthy()
  })
})
