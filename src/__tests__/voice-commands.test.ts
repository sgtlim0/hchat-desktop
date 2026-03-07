import { describe, it, expect } from 'vitest'
import { matchCommand, getAvailableCommands, registerCommand } from '@/shared/lib/voice-commands'

describe('voice-commands', () => {
  describe('matchCommand', () => {
    it('should match Korean summarize command', () => {
      const match = matchCommand('요약해줘')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('summarize')
    })

    it('should match Korean translate command', () => {
      const match = matchCommand('번역해줘')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('translate')
    })

    it('should match English commands', () => {
      const match = matchCommand('summarize this')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('summarize')
    })

    it('should match new chat command', () => {
      const match = matchCommand('새 대화')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('newChat')
    })

    it('should match search command with target', () => {
      const match = matchCommand('머신러닝 검색')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('search')
    })

    it('should match stop command', () => {
      const match = matchCommand('멈춰')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('stop')
    })

    it('should match meeting start command', () => {
      const match = matchCommand('회의 시작')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('meetingStart')
    })

    it('should match meeting end command', () => {
      const match = matchCommand('회의 끝')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('meetingEnd')
    })

    it('should match note command', () => {
      const match = matchCommand('메모')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('takeNote')
    })

    it('should return null for empty input', () => {
      expect(matchCommand('')).toBeNull()
      expect(matchCommand('   ')).toBeNull()
    })

    it('should return null for unrecognized input', () => {
      const match = matchCommand('오늘 날씨 어때')
      expect(match).toBeNull()
    })

    it('should have confidence score', () => {
      const match = matchCommand('요약해줘')
      expect(match!.confidence).toBeGreaterThan(0)
      expect(match!.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('getAvailableCommands', () => {
    it('should return all commands', () => {
      const commands = getAvailableCommands()
      expect(commands.length).toBeGreaterThan(5)
      expect(commands[0]).toHaveProperty('id')
      expect(commands[0]).toHaveProperty('action')
      expect(commands[0]).toHaveProperty('description')
    })
  })

  describe('registerCommand', () => {
    it('should register a custom command', () => {
      const before = getAvailableCommands().length
      registerCommand({
        id: 'custom',
        patterns: [/테스트 명령/],
        action: 'customAction',
        description: '커스텀 테스트',
      })
      expect(getAvailableCommands().length).toBe(before + 1)

      const match = matchCommand('테스트 명령')
      expect(match).not.toBeNull()
      expect(match!.command.action).toBe('customAction')
    })
  })
})
