import { describe, it, expect, beforeEach } from 'vitest'
import { useMobileUxStore } from '../mobile-ux.store'

describe('MobileUxStore', () => {
  beforeEach(() => {
    useMobileUxStore.setState({
      activeTab: 'home',
      isFullscreenChat: false,
      swipeEnabled: true,
      bottomNavVisible: true,
    })
  })

  it('should have correct initial state', () => {
    const state = useMobileUxStore.getState()
    expect(state.activeTab).toBe('home')
    expect(state.isFullscreenChat).toBe(false)
    expect(state.swipeEnabled).toBe(true)
    expect(state.bottomNavVisible).toBe(true)
  })

  it('should set active tab', () => {
    const { setActiveTab } = useMobileUxStore.getState()

    setActiveTab('chat')
    expect(useMobileUxStore.getState().activeTab).toBe('chat')

    setActiveTab('tools')
    expect(useMobileUxStore.getState().activeTab).toBe('tools')

    setActiveTab('settings')
    expect(useMobileUxStore.getState().activeTab).toBe('settings')

    setActiveTab('home')
    expect(useMobileUxStore.getState().activeTab).toBe('home')
  })

  it('should toggle fullscreen chat', () => {
    const { toggleFullscreenChat } = useMobileUxStore.getState()

    expect(useMobileUxStore.getState().isFullscreenChat).toBe(false)

    toggleFullscreenChat()
    expect(useMobileUxStore.getState().isFullscreenChat).toBe(true)

    toggleFullscreenChat()
    expect(useMobileUxStore.getState().isFullscreenChat).toBe(false)
  })

  it('should set fullscreen chat directly', () => {
    const { setFullscreenChat } = useMobileUxStore.getState()

    setFullscreenChat(true)
    expect(useMobileUxStore.getState().isFullscreenChat).toBe(true)

    setFullscreenChat(false)
    expect(useMobileUxStore.getState().isFullscreenChat).toBe(false)
  })

  it('should toggle swipe', () => {
    const { toggleSwipe } = useMobileUxStore.getState()

    expect(useMobileUxStore.getState().swipeEnabled).toBe(true)

    toggleSwipe()
    expect(useMobileUxStore.getState().swipeEnabled).toBe(false)

    toggleSwipe()
    expect(useMobileUxStore.getState().swipeEnabled).toBe(true)
  })

  it('should set bottom nav visibility', () => {
    const { setBottomNavVisible } = useMobileUxStore.getState()

    setBottomNavVisible(false)
    expect(useMobileUxStore.getState().bottomNavVisible).toBe(false)

    setBottomNavVisible(true)
    expect(useMobileUxStore.getState().bottomNavVisible).toBe(true)
  })

  it('should reset to initial state', () => {
    const { setActiveTab, setFullscreenChat, toggleSwipe, setBottomNavVisible, reset } = useMobileUxStore.getState()

    // Change all values
    setActiveTab('settings')
    setFullscreenChat(true)
    toggleSwipe() // false
    setBottomNavVisible(false)

    // Verify changes
    let state = useMobileUxStore.getState()
    expect(state.activeTab).toBe('settings')
    expect(state.isFullscreenChat).toBe(true)
    expect(state.swipeEnabled).toBe(false)
    expect(state.bottomNavVisible).toBe(false)

    // Reset
    reset()

    // Verify reset
    state = useMobileUxStore.getState()
    expect(state.activeTab).toBe('home')
    expect(state.isFullscreenChat).toBe(false)
    expect(state.swipeEnabled).toBe(true)
    expect(state.bottomNavVisible).toBe(true)
  })
})