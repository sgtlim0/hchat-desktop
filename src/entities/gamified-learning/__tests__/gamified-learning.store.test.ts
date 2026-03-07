import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGamifiedLearningStore } from '../gamified-learning.store'
import type { QuizQuestion } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllLearningChallenges: vi.fn(() => Promise.resolve([])),
  putLearningChallenge: vi.fn(() => Promise.resolve()),
  deleteLearningChallengeFromDb: vi.fn(() => Promise.resolve()),
}))

const makeQuestions = (): QuizQuestion[] => [
  { id: 'q1', question: 'What is 1+1?', options: ['1', '2', '3', '4'], correctIndex: 1 },
  { id: 'q2', question: 'What is 2+2?', options: ['2', '3', '4', '5'], correctIndex: 2 },
  { id: 'q3', question: 'What is 3+3?', options: ['5', '6', '7', '8'], correctIndex: 1 },
]

describe('GamifiedLearningStore', () => {
  beforeEach(() => {
    useGamifiedLearningStore.setState({
      challenges: [],
      profile: { xp: 0, level: 1, streak: 0, badges: [], lastActiveDate: '' },
    })
  })

  it('should create a challenge', () => {
    const questions = makeQuestions()
    useGamifiedLearningStore.getState().createChallenge('Math Quiz', 'math', questions)

    const challenges = useGamifiedLearningStore.getState().challenges
    expect(challenges).toHaveLength(1)
    expect(challenges[0].title).toBe('Math Quiz')
    expect(challenges[0].topic).toBe('math')
    expect(challenges[0].questions).toHaveLength(3)
    expect(challenges[0].score).toBe(0)
    expect(challenges[0].xpEarned).toBe(0)
  })

  it('should answer a question', () => {
    const questions = makeQuestions()
    useGamifiedLearningStore.getState().createChallenge('Quiz', 'math', questions)
    const challengeId = useGamifiedLearningStore.getState().challenges[0].id

    useGamifiedLearningStore.getState().answerQuestion(challengeId, 'q1', 1)

    const q = useGamifiedLearningStore.getState().challenges[0].questions[0]
    expect(q.userAnswer).toBe(1)
  })

  it('should complete a challenge and calculate score and xp', () => {
    const questions = makeQuestions()
    useGamifiedLearningStore.getState().createChallenge('Quiz', 'math', questions)
    const id = useGamifiedLearningStore.getState().challenges[0].id

    // Answer 2 out of 3 correctly
    useGamifiedLearningStore.getState().answerQuestion(id, 'q1', 1) // correct
    useGamifiedLearningStore.getState().answerQuestion(id, 'q2', 2) // correct
    useGamifiedLearningStore.getState().answerQuestion(id, 'q3', 0) // wrong

    useGamifiedLearningStore.getState().completeChallenge(id)

    const challenge = useGamifiedLearningStore.getState().challenges[0]
    expect(challenge.score).toBe(67) // Math.round(2/3 * 100)
    expect(challenge.xpEarned).toBe(20) // 2 * 10
    expect(challenge.completedAt).toBeDefined()

    const profile = useGamifiedLearningStore.getState().profile
    expect(profile.xp).toBe(20)
    expect(profile.level).toBe(1) // floor(20/100) + 1 = 1
  })

  it('should delete a challenge', () => {
    useGamifiedLearningStore.getState().createChallenge('Quiz', 'math', makeQuestions())
    const id = useGamifiedLearningStore.getState().challenges[0].id

    useGamifiedLearningStore.getState().deleteChallenge(id)

    expect(useGamifiedLearningStore.getState().challenges).toHaveLength(0)
  })

  it('should add xp and update level', () => {
    useGamifiedLearningStore.getState().addXp(150)

    const profile = useGamifiedLearningStore.getState().profile
    expect(profile.xp).toBe(150)
    expect(profile.level).toBe(2) // floor(150/100) + 1 = 2
  })

  it('should add a badge and prevent duplicates', () => {
    useGamifiedLearningStore.getState().addBadge('first-quiz')
    expect(useGamifiedLearningStore.getState().profile.badges).toEqual(['first-quiz'])

    useGamifiedLearningStore.getState().addBadge('first-quiz')
    expect(useGamifiedLearningStore.getState().profile.badges).toEqual(['first-quiz'])

    useGamifiedLearningStore.getState().addBadge('streak-7')
    expect(useGamifiedLearningStore.getState().profile.badges).toEqual(['first-quiz', 'streak-7'])
  })

  it('should update streak correctly', () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    // First activation
    useGamifiedLearningStore.getState().updateStreak()
    expect(useGamifiedLearningStore.getState().profile.streak).toBe(1)
    expect(useGamifiedLearningStore.getState().profile.lastActiveDate).toBe(today)

    // Same day — no change
    useGamifiedLearningStore.getState().updateStreak()
    expect(useGamifiedLearningStore.getState().profile.streak).toBe(1)

    // Simulate yesterday active
    useGamifiedLearningStore.setState((state) => ({
      profile: { ...state.profile, lastActiveDate: yesterday, streak: 3 },
    }))
    useGamifiedLearningStore.getState().updateStreak()
    expect(useGamifiedLearningStore.getState().profile.streak).toBe(4)
  })

  it('should reset streak when not consecutive', () => {
    useGamifiedLearningStore.setState((state) => ({
      profile: { ...state.profile, lastActiveDate: '2025-01-01', streak: 5 },
    }))

    useGamifiedLearningStore.getState().updateStreak()
    expect(useGamifiedLearningStore.getState().profile.streak).toBe(1)
  })

  it('should hydrate from db', async () => {
    const { getAllLearningChallenges } = await import('@/shared/lib/db')
    vi.mocked(getAllLearningChallenges).mockResolvedValueOnce([
      {
        id: 'ch-db-1',
        title: 'DB Quiz',
        topic: 'db',
        questions: [],
        score: 0,
        xpEarned: 0,
        createdAt: new Date().toISOString(),
      },
    ])

    useGamifiedLearningStore.getState().hydrate()
    await vi.waitFor(() => {
      expect(useGamifiedLearningStore.getState().challenges).toHaveLength(1)
      expect(useGamifiedLearningStore.getState().challenges[0].id).toBe('ch-db-1')
    })
  })
})
