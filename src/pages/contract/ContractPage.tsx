// @ts-nocheck
import { useEffect, useState } from 'react'
import { Plus, Trash2, FileText, AlertTriangle } from 'lucide-react'
import { useContractStore } from '@/entities/contract/contract.store'
import { useTranslation } from '@/shared/i18n'
export function ContractPage() {
  const { t } = useTranslation()
  const contracts = useContractStore((s) => s.contracts)
  const hydrate = useContractStore((s) => s.hydrate)
  const createContract = useContractStore((s) => s.createContract)
  const deleteContract = useContractStore((s) => s.deleteContract)
  const selectedContractId = useContractStore((s) => s.selectedContractId)
  const selectContract = useContractStore((s) => s.selectContract)
  useEffect(() => { hydrate() }, [hydrate])
  const selected = contracts.find((c) => c.id === selectedContractId)
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />{t('contract.title')}</h1>
        <button onClick={() => createContract('New Contract', 'nda')} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('contract.create')}</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-border overflow-y-auto">
          {contracts.map((c) => (
            <div key={c.id} onClick={() => selectContract(c.id)} className={`p-3 border-b border-border cursor-pointer hover:bg-surface-secondary ${c.id === selectedContractId ? 'bg-surface-secondary' : ''}`}>
              <p className="text-sm text-text-primary truncate">{c.title}</p>
              <p className="text-[10px] text-text-tertiary">{c.template} · {c.clauses.length} clauses</p>
            </div>
          ))}
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {!selected ? <p className="text-text-tertiary text-sm">{t('contract.selectContract')}</p> : (
            <div className="space-y-4">
              <div className="flex justify-between"><h2 className="font-semibold">{selected.title}</h2><button onClick={() => deleteContract(selected.id)} className="p-1 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button></div>
              <div className="space-y-2">{selected.clauses.map((cl) => (
                <div key={cl.id} className={`p-3 rounded-lg border ${cl.isRisky ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-border bg-surface'}`}>
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">{cl.title}</span>{cl.isRisky && <AlertTriangle className="w-4 h-4 text-red-500" />}</div>
                  <p className="text-xs text-text-secondary mt-1">{cl.content}</p>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
