import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isCredentialsComplete, buildAtlassianContext } from '../tool-connector'
import type { AtlassianCredentials, ToolSearchResult } from '../tool-connector'

describe('tool-connector', () => {
  describe('isCredentialsComplete', () => {
    it('returns true when all fields filled', () => {
      const creds: AtlassianCredentials = {
        baseUrl: 'https://company.atlassian.net',
        email: 'user@company.com',
        apiToken: 'ATAT123',
      }
      expect(isCredentialsComplete(creds)).toBe(true)
    })

    it('returns false when baseUrl empty', () => {
      expect(isCredentialsComplete({ baseUrl: '', email: 'a@b.com', apiToken: 'x' })).toBe(false)
    })

    it('returns false when email empty', () => {
      expect(isCredentialsComplete({ baseUrl: 'https://x', email: '', apiToken: 'x' })).toBe(false)
    })

    it('returns false when token empty', () => {
      expect(isCredentialsComplete({ baseUrl: 'https://x', email: 'a@b.com', apiToken: '' })).toBe(false)
    })

    it('returns false for whitespace only', () => {
      expect(isCredentialsComplete({ baseUrl: '  ', email: '  ', apiToken: '  ' })).toBe(false)
    })
  })

  describe('buildAtlassianContext', () => {
    it('returns empty for no results', () => {
      expect(buildAtlassianContext([])).toBe('')
    })

    it('formats confluence results', () => {
      const results: ToolSearchResult[] = [{
        type: 'confluence',
        title: 'Deploy Guide',
        url: 'https://x.atlassian.net/wiki/123',
        excerpt: 'How to deploy...',
        space: 'Engineering',
      }]
      const ctx = buildAtlassianContext(results)
      expect(ctx).toContain('Confluence: Deploy Guide')
      expect(ctx).toContain('Engineering')
      expect(ctx).toContain('사내 검색 결과')
    })

    it('formats jira results', () => {
      const results: ToolSearchResult[] = [{
        type: 'jira',
        title: 'Fix login bug',
        url: 'https://x.atlassian.net/browse/PROJ-123',
        excerpt: 'Login fails when...',
        key: 'PROJ-123',
        status: 'In Progress',
        assignee: 'Kim',
      }]
      const ctx = buildAtlassianContext(results)
      expect(ctx).toContain('Jira PROJ-123')
      expect(ctx).toContain('In Progress')
      expect(ctx).toContain('Kim')
    })

    it('handles mixed results', () => {
      const results: ToolSearchResult[] = [
        { type: 'confluence', title: 'Doc', url: 'u1', excerpt: 'e1' },
        { type: 'jira', title: 'Issue', url: 'u2', excerpt: 'e2', key: 'X-1' },
      ]
      const ctx = buildAtlassianContext(results)
      expect(ctx).toContain('Confluence')
      expect(ctx).toContain('Jira')
    })
  })
})
