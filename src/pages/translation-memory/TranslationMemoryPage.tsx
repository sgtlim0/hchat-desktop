import { useEffect, useState, useMemo } from 'react'
import { Languages, Plus, Trash2, Search, BookOpen, ArrowRightLeft } from 'lucide-react'
import { useTranslationMemoryStore } from '@/entities/translation-memory/translation-memory.store'
import { useTranslation } from '@/shared/i18n'

type Tab = 'pairs' | 'glossary'

export function TranslationMemoryPage() {
  const { t } = useTranslation()
  const pairs = useTranslationMemoryStore((s) => s.pairs)
  const glossary = useTranslationMemoryStore((s) => s.glossary)
  const hydrate = useTranslationMemoryStore((s) => s.hydrate)
  const addPair = useTranslationMemoryStore((s) => s.addPair)
  const removePair = useTranslationMemoryStore((s) => s.removePair)
  const addGlossaryTerm = useTranslationMemoryStore((s) => s.addGlossaryTerm)
  const removeGlossaryTerm = useTranslationMemoryStore((s) => s.removeGlossaryTerm)

  const [tab, setTab] = useState<Tab>('pairs')
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  // Pair form
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [sourceLang, setSourceLang] = useState('ko')
  const [targetLang, setTargetLang] = useState('en')
  const [domain, setDomain] = useState('general')

  // Glossary form
  const [gTerm, setGTerm] = useState('')
  const [gTranslation, setGTranslation] = useState('')
  const [gDomain, setGDomain] = useState('general')

  useEffect(() => { hydrate() }, [hydrate])

  const domains = useMemo(() => {
    const set = new Set<string>()
    for (const p of pairs) set.add(p.domain)
    for (const g of glossary) set.add(g.domain)
    return Array.from(set).sort()
  }, [pairs, glossary])

  const filteredPairs = useMemo(() => {
    let result = pairs
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.source.toLowerCase().includes(q) || p.target.toLowerCase().includes(q))
    }
    if (domainFilter) result = result.filter((p) => p.domain === domainFilter)
    return result
  }, [pairs, search, domainFilter])

  const filteredGlossary = useMemo(() => {
    let result = glossary
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((g) => g.term.toLowerCase().includes(q) || g.translation.toLowerCase().includes(q))
    }
    if (domainFilter) result = result.filter((g) => g.domain === domainFilter)
    return result
  }, [glossary, search, domainFilter])

  const handleAddPair = async () => {
    if (!source.trim() || !target.trim()) return
    await addPair(source.trim(), target.trim(), sourceLang, targetLang, domain)
    setSource('')
    setTarget('')
    setShowAdd(false)
  }

  const handleAddGlossary = async () => {
    if (!gTerm.trim() || !gTranslation.trim()) return
    await addGlossaryTerm(gTerm.trim(), gTranslation.trim(), gDomain)
    setGTerm('')
    setGTranslation('')
    setShowAdd(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Languages className="w-5 h-5 text-primary" />{t('translationMemory.title')}
        </h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('common.add')}
        </button>
      </div>

      {/* Tabs + Filters */}
      <div className="px-6 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-4">
          <button onClick={() => setTab('pairs')}
            className={`flex items-center gap-1.5 text-sm pb-1 border-b-2 ${tab === 'pairs' ? 'border-primary text-primary font-semibold' : 'border-transparent text-text-secondary'}`}>
            <ArrowRightLeft className="w-4 h-4" />{t('translationMemory.pairs')} ({pairs.length})
          </button>
          <button onClick={() => setTab('glossary')}
            className={`flex items-center gap-1.5 text-sm pb-1 border-b-2 ${tab === 'glossary' ? 'border-primary text-primary font-semibold' : 'border-transparent text-text-secondary'}`}>
            <BookOpen className="w-4 h-4" />{t('translationMemory.glossary')} ({glossary.length})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('translationMemory.search')} className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border" />
          </div>
          <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}
            className="text-sm rounded-lg bg-surface-secondary border border-border px-3 py-1.5">
            <option value="">{t('translationMemory.allDomains')}</option>
            {domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'pairs' && (
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-text-secondary font-medium">{t('translationMemory.source')}</th>
                <th className="text-left px-4 py-2 text-text-secondary font-medium">{t('translationMemory.target')}</th>
                <th className="text-left px-4 py-2 text-text-secondary font-medium w-20">{t('translationMemory.lang')}</th>
                <th className="text-left px-4 py-2 text-text-secondary font-medium w-24">{t('translationMemory.domain')}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredPairs.length === 0 && (
                <tr><td colSpan={5} className="text-center text-text-tertiary py-12">{t('translationMemory.emptyPairs')}</td></tr>
              )}
              {filteredPairs.map((pair) => (
                <tr key={pair.id} className="border-b border-border hover:bg-surface-secondary/50">
                  <td className="px-4 py-2.5 text-text-primary">{pair.source}</td>
                  <td className="px-4 py-2.5 text-text-primary">{pair.target}</td>
                  <td className="px-4 py-2.5 text-text-tertiary text-xs">{pair.sourceLang} &rarr; {pair.targetLang}</td>
                  <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{pair.domain}</span></td>
                  <td className="px-2">
                    <button onClick={() => removePair(pair.id)} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'glossary' && (
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-text-secondary font-medium">{t('translationMemory.term')}</th>
                <th className="text-left px-4 py-2 text-text-secondary font-medium">{t('translationMemory.translation')}</th>
                <th className="text-left px-4 py-2 text-text-secondary font-medium w-24">{t('translationMemory.domain')}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredGlossary.length === 0 && (
                <tr><td colSpan={4} className="text-center text-text-tertiary py-12">{t('translationMemory.emptyGlossary')}</td></tr>
              )}
              {filteredGlossary.map((term) => (
                <tr key={term.id} className="border-b border-border hover:bg-surface-secondary/50">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{term.term}</td>
                  <td className="px-4 py-2.5 text-text-primary">{term.translation}</td>
                  <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{term.domain}</span></td>
                  <td className="px-2">
                    <button onClick={() => removeGlossaryTerm(term.id)} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-surface rounded-xl p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">
              {tab === 'pairs' ? t('translationMemory.addPair') : t('translationMemory.addTerm')}
            </h3>
            {tab === 'pairs' ? (
              <>
                <textarea value={source} onChange={(e) => setSource(e.target.value)}
                  placeholder={t('translationMemory.sourcePlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" rows={2} autoFocus />
                <textarea value={target} onChange={(e) => setTarget(e.target.value)}
                  placeholder={t('translationMemory.targetPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" rows={2} />
                <div className="flex gap-2">
                  <input value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}
                    placeholder="ko" className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" />
                  <input value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
                    placeholder="en" className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" />
                </div>
                <input value={domain} onChange={(e) => setDomain(e.target.value)}
                  placeholder={t('translationMemory.domainPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary">{t('common.cancel')}</button>
                  <button onClick={handleAddPair} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">{t('common.add')}</button>
                </div>
              </>
            ) : (
              <>
                <input value={gTerm} onChange={(e) => setGTerm(e.target.value)}
                  placeholder={t('translationMemory.termPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" autoFocus />
                <input value={gTranslation} onChange={(e) => setGTranslation(e.target.value)}
                  placeholder={t('translationMemory.translationPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" />
                <input value={gDomain} onChange={(e) => setGDomain(e.target.value)}
                  placeholder={t('translationMemory.domainPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGlossary()} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary">{t('common.cancel')}</button>
                  <button onClick={handleAddGlossary} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">{t('common.add')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
