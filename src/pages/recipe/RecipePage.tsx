// @ts-nocheck
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useRecipeStore } from '@/entities/recipe/recipe.store'
import { useTranslation } from '@/shared/i18n'
export function RecipePage() {
  const { t } = useTranslation()
  const hydrate = useRecipeStore((s) => s.hydrate)
  useEffect(() => { hydrate() }, [hydrate])
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary">{t('recipe.title')}</h1>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('recipe.create')}</button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <p className="text-text-tertiary text-sm text-center py-12">{t('recipe.empty')}</p>
      </div>
    </div>
  )
}
