/**
 * Clipboard History Manager
 *
 * Manages clipboard history with FIFO eviction, search, and export capabilities.
 * Maintains up to 30 entries with newest-first ordering.
 */

export interface ClipboardEntry {
  id: string
  content: string
  createdAt: string
  source?: string
}

class ClipboardHistory {
  private history: ClipboardEntry[] = []
  private readonly MAX_ENTRIES = 30

  /**
   * Adds a new entry to clipboard history.
   * Skips if content is identical to the last entry.
   * Maintains max 30 entries with FIFO eviction.
   */
  addEntry(content: string, source?: string): ClipboardEntry {
    // Skip if duplicate of last entry
    if (this.history.length > 0 && this.history[0].content === content) {
      return this.history[0]
    }

    const entry: ClipboardEntry = {
      id: this.generateId(),
      content,
      createdAt: new Date().toISOString(),
      source
    }

    // Add to beginning (newest first)
    this.history.unshift(entry)

    // Enforce max entries
    if (this.history.length > this.MAX_ENTRIES) {
      this.history = this.history.slice(0, this.MAX_ENTRIES)
    }

    return entry
  }

  /**
   * Returns a copy of the clipboard history.
   * Entries are ordered newest-first.
   */
  getHistory(): readonly ClipboardEntry[] {
    // Return deep copy to prevent external mutations
    return this.history.map(entry => ({ ...entry }))
  }

  /**
   * Removes an entry by ID.
   * Silently ignores invalid IDs.
   */
  removeEntry(id: string): void {
    const index = this.history.findIndex(entry => entry.id === id)
    if (index !== -1) {
      this.history.splice(index, 1)
    }
  }

  /**
   * Searches history by content (case-insensitive).
   * Empty query returns all entries.
   */
  search(query: string): ClipboardEntry[] {
    const trimmedQuery = query.trim()

    // Empty query returns all
    if (!trimmedQuery) {
      return this.getHistory() as ClipboardEntry[]
    }

    const lowerQuery = trimmedQuery.toLowerCase()
    return this.history
      .filter(entry => entry.content.toLowerCase().includes(lowerQuery))
      .map(entry => ({ ...entry }))
  }

  /**
   * Returns the current number of entries in history.
   */
  getEntryCount(): number {
    return this.history.length
  }

  /**
   * Exports history as formatted JSON string.
   * Includes metadata and all entries.
   */
  exportHistory(): string {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      count: this.history.length,
      entries: this.history.map(entry => ({ ...entry }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Clears all clipboard history.
   */
  clearHistory(): void {
    this.history = []
  }

  /**
   * Generates a unique ID for clipboard entries.
   */
  private generateId(): string {
    return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const clipboardHistory = new ClipboardHistory()