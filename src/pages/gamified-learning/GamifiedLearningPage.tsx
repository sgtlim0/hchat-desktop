// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Trophy, Star, Flame, Award, ChevronRight, Check, X } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useGamifiedLearningStore } from '@/entities/gamified-learning/gamified-learning.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

export function GamifiedLearningPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)

  const {
    profile,
    challenges,
    activeChallengeId,
    currentQuiz,
    hydrate,
    selectChallenge,
    startQuiz,
    answerQuiz,
    nextQuestion,
    resetChallenge,
  } = useGamifiedLearningStore(
    useShallow((s) => ({
      profile: s.profile,
      challenges: s.challenges,
      activeChallengeId: s.activeChallengeId,
      currentQuiz: s.currentQuiz,
      hydrate: s.hydrate,
      selectChallenge: s.selectChallenge,
      startQuiz: s.startQuiz,
      answerQuiz: s.answerQuiz,
      nextQuestion: s.nextQuestion,
      resetChallenge: s.resetChallenge,
    }))
  )

  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const activeChallenge = challenges.find((c) => c.id === activeChallengeId) ?? null

  function handleAnswer(optionIndex: number) {
    if (answered) return
    setSelectedOption(optionIndex)
    setAnswered(true)
    answerQuiz(optionIndex)
  }

  function handleNext() {
    setSelectedOption(null)
    setAnswered(false)
    nextQuestion()
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('home')}
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Trophy className="w-5 h-5 text-[var(--color-accent)]" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {(t as any)('gamifiedLearning.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {(t as any)('gamifiedLearning.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Profile + Challenges */}
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col overflow-hidden">
          {/* Profile Card */}
          <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-lg">
                {profile.level}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {(t as any)('gamifiedLearning.level')} {profile.level}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {profile.xp} / {profile.xpToNext} XP
                </p>
              </div>
            </div>
            {/* XP Progress Bar */}
            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 mb-3">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                style={{ width: `${Math.min((profile.xp / profile.xpToNext) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                {profile.streak} {(t as any)('gamifiedLearning.streak')}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" />
                {profile.badges.length} {(t as any)('gamifiedLearning.badges')}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-blue-500" />
                {profile.totalScore}
              </span>
            </div>
          </div>

          {/* Badge Display */}
          {profile.badges.length > 0 && (
            <div className="p-3 border-b border-[var(--color-border)]">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                {(t as any)('gamifiedLearning.earnedBadges')}
              </p>
              <div className="flex flex-wrap gap-1">
                {profile.badges.map((badge) => (
                  <span
                    key={badge.id}
                    className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    title={badge.description}
                  >
                    {badge.icon} {badge.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Challenge List */}
          <div className="flex-1 overflow-auto">
            {challenges.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <Trophy className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {(t as any)('gamifiedLearning.noChallenges')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {challenges.map((challenge) => (
                  <button
                    key={challenge.id}
                    onClick={() => selectChallenge(challenge.id)}
                    className={`w-full text-left p-3 hover:bg-[var(--color-bg-secondary)] ${
                      activeChallengeId === challenge.id ? 'bg-[var(--color-bg-secondary)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate flex-1">{challenge.title}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span className={`px-1.5 py-0.5 rounded ${
                        challenge.difficulty === 'hard'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                          : challenge.difficulty === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      }`}>
                        {challenge.difficulty}
                      </span>
                      <span>+{challenge.xpReward} XP</span>
                      <span>{challenge.questionCount} Q</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Quiz View */}
        <div className="flex-1 overflow-auto">
          {activeChallenge && currentQuiz ? (
            <div className="p-6 max-w-2xl mx-auto space-y-6">
              {/* Challenge Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {activeChallenge.title}
                </h2>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {currentQuiz.currentIndex + 1} / {currentQuiz.totalQuestions}
                </span>
              </div>

              {/* Progress */}
              <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                  style={{
                    width: `${((currentQuiz.currentIndex + 1) / currentQuiz.totalQuestions) * 100}%`,
                  }}
                />
              </div>

              {/* Score */}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" /> {currentQuiz.correctCount}
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <X className="w-4 h-4" /> {currentQuiz.wrongCount}
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  {(t as any)('gamifiedLearning.score')}: {currentQuiz.score}
                </span>
              </div>

              {/* Question */}
              <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <p className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
                  {currentQuiz.question.text}
                </p>
                <div className="space-y-2">
                  {currentQuiz.question.options.map((option, idx) => {
                    const isCorrect = idx === currentQuiz.question.correctIndex
                    const isSelected = selectedOption === idx
                    let optionClass =
                      'w-full text-left p-3 rounded-lg border transition-colors text-sm'

                    if (answered) {
                      if (isCorrect) {
                        optionClass +=
                          ' border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      } else if (isSelected && !isCorrect) {
                        optionClass +=
                          ' border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      } else {
                        optionClass +=
                          ' border-[var(--color-border)] opacity-50'
                      }
                    } else {
                      optionClass +=
                        ' border-[var(--color-border)] hover:bg-[var(--color-bg-primary)] cursor-pointer'
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={optionClass}
                        disabled={answered}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {option}
                        {answered && isCorrect && (
                          <Check className="inline w-4 h-4 ml-2" />
                        )}
                        {answered && isSelected && !isCorrect && (
                          <X className="inline w-4 h-4 ml-2" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Next / Finish */}
              {answered && (
                <div className="flex justify-center">
                  {currentQuiz.currentIndex < currentQuiz.totalQuestions - 1 ? (
                    <Button onClick={handleNext}>
                      {(t as any)('gamifiedLearning.next')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={() => resetChallenge(activeChallenge.id)}>
                      {(t as any)('gamifiedLearning.finish')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : activeChallenge ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-4">
                <Trophy className="w-16 h-16 mx-auto text-[var(--color-accent)]" />
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {activeChallenge.title}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {activeChallenge.description}
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <span>{activeChallenge.questionCount} {(t as any)('gamifiedLearning.questions')}</span>
                  <span>+{activeChallenge.xpReward} XP</span>
                </div>
                <Button onClick={() => startQuiz(activeChallenge.id)}>
                  {(t as any)('gamifiedLearning.startQuiz')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Trophy className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-[var(--color-text-secondary)]">
                  {(t as any)('gamifiedLearning.selectChallenge')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
