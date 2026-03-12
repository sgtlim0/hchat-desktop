export type SelectionAction = 'explain' | 'translate' | 'summarize' | 'improve'

export interface SelectionActionItem {
  id: SelectionAction
  label: string
  icon: string
}

export const SELECTION_ACTIONS: SelectionActionItem[] = [
  { id: 'explain', label: 'Explain', icon: 'book-open' },
  { id: 'translate', label: 'Translate', icon: 'languages' },
  { id: 'summarize', label: 'Summarize', icon: 'file-text' },
  { id: 'improve', label: 'Improve', icon: 'sparkles' },
]
