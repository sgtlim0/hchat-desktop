// @ts-nocheck
import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useData3DStore } from '@/entities/data-3d/data-3d.store'
import { useTranslation } from '@/shared/i18n'
export function Data3DPage() {
  const { t } = useTranslation()
  const hydrate = useData3DStore((s) => s.hydrate)
  useEffect(() => { hydrate?.() }, [hydrate])
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary">{t('data3d.title')}</h1>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('common.create')}</button>
      </div>
      <div className="flex-1 p-6"><p className="text-text-tertiary text-sm text-center py-12">{t('data3d.empty')}</p></div>
    </div>
  )
}
