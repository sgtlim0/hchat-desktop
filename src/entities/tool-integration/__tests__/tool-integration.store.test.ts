import { describe, it, expect, beforeEach } from 'vitest'
import { useToolIntegrationStore } from '../tool-integration.store'

describe('ToolIntegrationStore', () => {
  beforeEach(() => {
    useToolIntegrationStore.getState().clearConfig()
  })

  it('초기 상태에 빈 config를 가진다', () => {
    const state = useToolIntegrationStore.getState()

    expect(state.confluence).toEqual({
      baseUrl: '',
      email: '',
      apiToken: '',
      connected: false
    })

    expect(state.jira).toEqual({
      baseUrl: '',
      email: '',
      apiToken: '',
      connected: false
    })

    expect(state.activeToolsBySession).toEqual({})
  })

  it('updateConfluence가 config를 설정한다', () => {
    const { updateConfluence } = useToolIntegrationStore.getState()

    updateConfluence({
      baseUrl: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      connected: true
    })

    const newState = useToolIntegrationStore.getState()
    expect(newState.confluence).toEqual({
      baseUrl: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      connected: true
    })
  })

  it('updateJira가 config를 설정한다', () => {
    const { updateJira } = useToolIntegrationStore.getState()

    updateJira({
      baseUrl: 'https://jira.example.com',
      email: 'jira@example.com',
      apiToken: 'jira-token',
      connected: true
    })

    const newState = useToolIntegrationStore.getState()
    expect(newState.jira).toEqual({
      baseUrl: 'https://jira.example.com',
      email: 'jira@example.com',
      apiToken: 'jira-token',
      connected: true
    })
  })

  it('부분 업데이트가 작동한다', () => {
    const { updateConfluence } = useToolIntegrationStore.getState()

    updateConfluence({ baseUrl: 'https://test.atlassian.net' })
    updateConfluence({ email: 'test@example.com' })

    const state = useToolIntegrationStore.getState()
    expect(state.confluence.baseUrl).toBe('https://test.atlassian.net')
    expect(state.confluence.email).toBe('test@example.com')
    expect(state.confluence.apiToken).toBe('')
    expect(state.confluence.connected).toBe(false)
  })

  it('isConfluenceConfigured가 연결 상태를 확인한다', () => {
    const { isConfluenceConfigured, updateConfluence } = useToolIntegrationStore.getState()

    expect(isConfluenceConfigured()).toBe(false)

    updateConfluence({
      baseUrl: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'token',
      connected: true
    })

    expect(isConfluenceConfigured()).toBe(true)
  })

  it('isJiraConfigured가 연결 상태를 확인한다', () => {
    const { isJiraConfigured, updateJira } = useToolIntegrationStore.getState()

    expect(isJiraConfigured()).toBe(false)

    updateJira({
      baseUrl: 'https://jira.example.com',
      email: 'test@example.com',
      apiToken: 'token',
      connected: true
    })

    expect(isJiraConfigured()).toBe(true)
  })

  it('setActiveTools가 세션별 도구를 설정한다', () => {
    const { setActiveTools, getActiveTools } = useToolIntegrationStore.getState()

    setActiveTools('session-1', { confluence: true, jira: false })

    const tools = getActiveTools('session-1')
    expect(tools).toEqual({ confluence: true, jira: false })
  })

  it('getActiveTools가 기본값을 반환한다', () => {
    const { getActiveTools } = useToolIntegrationStore.getState()

    const tools = getActiveTools('non-existent')
    expect(tools).toEqual({ confluence: false, jira: false })
  })

  it('setActiveTools가 부분 업데이트를 지원한다', () => {
    const { setActiveTools, getActiveTools } = useToolIntegrationStore.getState()

    setActiveTools('session-1', { confluence: true })
    expect(getActiveTools('session-1')).toEqual({ confluence: true, jira: false })

    setActiveTools('session-1', { jira: true })
    expect(getActiveTools('session-1')).toEqual({ confluence: true, jira: true })
  })

  it('clearConfig가 기본값으로 재설정한다', () => {
    const { updateConfluence, updateJira, setActiveTools, clearConfig } = useToolIntegrationStore.getState()

    // 설정 추가
    updateConfluence({ baseUrl: 'https://test.atlassian.net', connected: true })
    updateJira({ email: 'test@example.com', connected: true })
    setActiveTools('session-1', { confluence: true, jira: true })

    // 초기화
    clearConfig()

    const state = useToolIntegrationStore.getState()
    expect(state.confluence).toEqual({
      baseUrl: '',
      email: '',
      apiToken: '',
      connected: false
    })
    expect(state.jira).toEqual({
      baseUrl: '',
      email: '',
      apiToken: '',
      connected: false
    })
    expect(state.activeToolsBySession).toEqual({})
  })

  it('shareCredentials가 confluence 자격증명을 jira로 복사한다', () => {
    const { updateConfluence, shareCredentials } = useToolIntegrationStore.getState()

    updateConfluence({
      baseUrl: 'https://shared.atlassian.net',
      email: 'shared@example.com',
      apiToken: 'shared-token',
      connected: true
    })

    shareCredentials()

    const state = useToolIntegrationStore.getState()
    expect(state.jira).toEqual({
      baseUrl: 'https://shared.atlassian.net',
      email: 'shared@example.com',
      apiToken: 'shared-token',
      connected: false // 연결 상태는 복사하지 않음
    })
  })

  it('testConnection이 빈 필드에 대해 false를 반환한다', async () => {
    const { testConnection } = useToolIntegrationStore.getState()

    const result = await testConnection('confluence')
    expect(result).toBe(false)
  })

  it('testConnection이 모든 필드가 있을 때 true를 반환한다', async () => {
    const { updateConfluence, testConnection } = useToolIntegrationStore.getState()

    updateConfluence({
      baseUrl: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token'
    })

    const result = await testConnection('confluence')
    expect(result).toBe(true)
  })

  it('testConnection이 jira에 대해서도 작동한다', async () => {
    const { updateJira, testConnection } = useToolIntegrationStore.getState()

    updateJira({
      baseUrl: 'https://jira.example.com',
      email: 'test@example.com',
      apiToken: 'test-token'
    })

    const result = await testConnection('jira')
    expect(result).toBe(true)
  })
})