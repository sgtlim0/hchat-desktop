import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/shared/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => true),
}))

vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import { SyncStatusBadge } from '../SyncStatusBadge'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'

describe('SyncStatusBadge', () => {
  beforeEach(() => {
    vi.mocked(useOnlineStatus).mockReturnValue(true)
  })

  it('shows synced state when online', () => {
    render(<SyncStatusBadge />)
    expect(screen.getByText('sync.synced')).toBeTruthy()
  })

  it('shows pending state when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false)
    render(<SyncStatusBadge />)
    expect(screen.getByText('sync.pending')).toBeTruthy()
  })

  it('has green indicator when online', () => {
    const { container } = render(<SyncStatusBadge />)
    const dot = container.querySelector('.bg-green-500')
    expect(dot).toBeTruthy()
  })

  it('has amber indicator when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false)
    const { container } = render(<SyncStatusBadge />)
    const dot = container.querySelector('.bg-amber-500')
    expect(dot).toBeTruthy()
  })

  it('has tooltip with last sync time when online', () => {
    render(<SyncStatusBadge />)
    const badge = screen.getByText('sync.synced').closest('span')
    expect(badge?.getAttribute('title')).toContain('sync.lastSync')
  })
})
