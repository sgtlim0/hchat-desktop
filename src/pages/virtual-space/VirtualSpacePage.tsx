// @ts-nocheck
import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useVirtualSpaceStore } from '@/entities/virtual-space/virtual-space.store'
import { useTranslation } from '@/shared/i18n'
export function VirtualSpacePage() {
  const { t } = useTranslation()
  const hydrate = useVirtualSpaceStore((s) => s.hydrate)
  useEffect(() => { hydrate?.() }, [hydrate])
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary">{t('virtualSpace.title')}</h1>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('common.create')}</button>
      </div>
      <div className="flex-1 p-6"><p className="text-text-tertiary text-sm text-center py-12">{t('virtualSpace.empty')}</p></div>
    </div>
  )
}
