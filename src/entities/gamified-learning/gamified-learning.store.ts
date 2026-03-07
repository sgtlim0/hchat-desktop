import { create } from 'zustand'
import type { LearningChallenge, QuizQuestion, LearnerProfile } from '@/shared/types'
import {
  getAllLearningChallenges,
  putLearningChallenge,
  deleteLearningChallengeFromDb,
} from '@/shared/lib/db'

interface GamifiedLearningState {
  challenges: LearningChallenge[]
  profile: LearnerProfile

  hydrate: () => void
  createChallenge: (title: string, topic: string, questions: QuizQuestion[]) => void
  answerQuestion: (challengeId: string, questionId: string, answer: number) => void
  completeChallenge: (id: string) => void
  deleteChallenge: (id: string) => void
  addXp: (amount: number) => void
  addBadge: (badge: string) => void
  updateStreak: () => void
}

const initialProfile: LearnerProfile = {
  xp: 0,
  level: 1,
  streak: 0,
  badges: [],
  lastActiveDate: '',
}

export const useGamifiedLearningStore = create<GamifiedLearningState>((set) => ({
  challenges: [],
  profile: { ...initialProfile },

  hydrate: () => {
    getAllLearningChallenges()
      .then((challenges) => {
        set({ challenges })
      })
      .catch(console.error)
  },

  createChallenge: (title, topic, questions) => {
    const challenge: LearningChallenge = {
      id: crypto.randomUUID(),
      title,
      topic,
      questions,
      score: 0,
      xpEarned: 0,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      challenges: [challenge, ...state.challenges],
    }))

    putLearningChallenge(challenge).catch(console.error)
  },

  answerQuestion: (challengeId, questionId, answer) => {
    set((state) => ({
      challenges: state.challenges.map((c) => {
        if (c.id !== challengeId) return c
        const updated = {
          ...c,
          questions: c.questions.map((q) => {
            if (q.id !== questionId) return q
            return { ...q, userAnswer: answer }
          }),
        }
        putLearningChallenge(updated).catch(console.error)
        return updated
      }),
    }))
  },

  completeChallenge: (id) => {
    set((state) => {
      const challenge = state.challenges.find((c) => c.id === id)
      if (!challenge) return state

      const correctCount = challenge.questions.filter(
        (q) => q.userAnswer === q.correctIndex,
      ).length
      const score = Math.round((correctCount / challenge.questions.length) * 100)
      const xpEarned = correctCount * 10

      const updatedChallenge: LearningChallenge = {
        ...challenge,
        score,
        xpEarned,
        completedAt: new Date().toISOString(),
      }

      putLearningChallenge(updatedChallenge).catch(console.error)

      const newXp = state.profile.xp + xpEarned

      return {
        challenges: state.challenges.map((c) => (c.id === id ? updatedChallenge : c)),
        profile: {
          ...state.profile,
          xp: newXp,
          level: Math.floor(newXp / 100) + 1,
        },
      }
    })
  },

  deleteChallenge: (id) => {
    set((state) => ({
      challenges: state.challenges.filter((c) => c.id !== id),
    }))

    deleteLearningChallengeFromDb(id).catch(console.error)
  },

  addXp: (amount) => {
    set((state) => {
      const newXp = state.profile.xp + amount
      return {
        profile: {
          ...state.profile,
          xp: newXp,
          level: Math.floor(newXp / 100) + 1,
        },
      }
    })
  },

  addBadge: (badge) => {
    set((state) => {
      if (state.profile.badges.includes(badge)) return state
      return {
        profile: {
          ...state.profile,
          badges: [...state.profile.badges, badge],
        },
      }
    })
  },

  updateStreak: () => {
    set((state) => {
      const today = new Date().toISOString().slice(0, 10)
      const lastDate = state.profile.lastActiveDate

      if (lastDate === today) return state

      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const newStreak = lastDate === yesterday ? state.profile.streak + 1 : 1

      return {
        profile: {
          ...state.profile,
          streak: newStreak,
          lastActiveDate: today,
        },
      }
    })
  },
}))
