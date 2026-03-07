// @ts-nocheck
import { useEffect } from 'react'
import { Music, Play, Pause, Plus, Trash2, Timer } from 'lucide-react'
import { useSoundscapeStore } from '@/entities/soundscape/soundscape.store'
import { useTranslation } from '@/shared/i18n'
export function SoundscapePage() {
  const { t } = useTranslation()
  const layers = useSoundscapeStore((s) => s.layers)
  const pomodoroState = useSoundscapeStore((s) => s.pomodoroState)
  const focusSessions = useSoundscapeStore((s) => s.focusSessions)
  const addLayer = useSoundscapeStore((s) => s.addLayer)
  const removeLayer = useSoundscapeStore((s) => s.removeLayer)
  const setVolume = useSoundscapeStore((s) => s.setVolume)
  const togglePlay = useSoundscapeStore((s) => s.togglePlay)
  const startPomodoro = useSoundscapeStore((s) => s.startPomodoro)
  const pausePomodoro = useSoundscapeStore((s) => s.pausePomodoro)
  const hydrate = useSoundscapeStore((s) => s.hydrate)
  useEffect(() => { hydrate() }, [hydrate])
  const mins = Math.floor(pomodoroState.timeLeft / 60)
  const secs = pomodoroState.timeLeft % 60
  return (
    <div className="flex-1 flex flex-col items-center gap-8 p-6">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2"><Music className="w-6 h-6 text-primary" />{t('soundscape.title')}</h1>
      <div className="w-40 h-40 rounded-full border-4 border-primary flex items-center justify-center">
        <span className="text-3xl font-mono text-text-primary">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</span>
      </div>
      <p className="text-sm text-text-secondary">{pomodoroState.isBreak ? t('soundscape.relax') : t('soundscape.focus')}</p>
      <button onClick={pomodoroState.isRunning ? pausePomodoro : startPomodoro} className="px-6 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
        {pomodoroState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{pomodoroState.isRunning ? t('soundscape.pause') : t('soundscape.start')}
      </button>
      <div className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{t('soundscape.title')}</h3>
          <div className="flex gap-1">{(['nature','lofi','whitenoise','cafe'] as const).map((type) => (
            <button key={type} onClick={() => addLayer(type, type)} className="px-2 py-1 text-xs bg-surface-secondary rounded hover:bg-surface-tertiary">{type}</button>
          ))}</div>
        </div>
        {layers.map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
            <button onClick={() => togglePlay(l.id)} className="p-1">{l.isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4" />}</button>
            <span className="text-sm flex-1">{l.label}</span>
            <input type="range" min={0} max={100} value={l.volume * 100} onChange={(e) => setVolume(l.id, Number(e.target.value) / 100)} className="w-24" />
            <button onClick={() => removeLayer(l.id)} className="p-1 hover:bg-red-500/10 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-tertiary">{t('soundscape.stats')}: {focusSessions.length} sessions</p>
    </div>
  )
}
