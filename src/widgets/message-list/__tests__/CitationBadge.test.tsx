import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CitationBadge } from '../CitationBadge'

const mockCitation = {
  index: 1,
  chunkId: 'chunk-1',
  page: 3,
  snippet: 'Revenue increased by 15% in Q3 2025.',
}

describe('CitationBadge', () => {
  it('renders badge with index number', () => {
    render(<CitationBadge citation={mockCitation} />)
    expect(screen.getByText('1')).toBeTruthy()
  })

  it('shows popup on click', () => {
    render(<CitationBadge citation={mockCitation} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Page 3')).toBeTruthy()
    expect(screen.getByText(mockCitation.snippet)).toBeTruthy()
  })

  it('hides popup on second click', () => {
    render(<CitationBadge citation={mockCitation} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(screen.getByText('Page 3')).toBeTruthy()
    fireEvent.click(btn)
    expect(screen.queryByText('Page 3')).toBeNull()
  })

  it('has accessible label', () => {
    render(<CitationBadge citation={mockCitation} />)
    expect(screen.getByLabelText('Source 1 - Page 3')).toBeTruthy()
  })

  it('does not show popup initially', () => {
    render(<CitationBadge citation={mockCitation} />)
    expect(screen.queryByText('Page 3')).toBeNull()
  })
})
