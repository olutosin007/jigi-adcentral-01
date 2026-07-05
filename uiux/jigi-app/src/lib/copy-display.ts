import type { CopyResult } from '@/lib/ai'
import { countCopyDisplayChars } from '@/lib/copy-enforcement/schema'

export function resolveCopyCharCount(copy: CopyResult): number {
  return copy.character_count ?? countCopyDisplayChars(copy)
}

export function isCopyOverCharLimit(copy: CopyResult, maxChars?: number): boolean {
  if (maxChars == null) return false
  return resolveCopyCharCount(copy) > maxChars
}

/** e.g. "142 / 125" or "142 chars" when no channel limit */
export function formatCopyCharBudget(copy: CopyResult, maxChars?: number): string {
  const count = resolveCopyCharCount(copy)
  if (maxChars == null) return `${count} chars`
  return `${count} / ${maxChars}`
}

/** First warning for card face: validation, over-limit, or compliance fail */
export function getPrimaryCopyCardWarning(copy: CopyResult, maxChars?: number): string | undefined {
  if (copy.exclusions_violated) return 'Exclusions violated — approval blocked'
  const firstValidation = copy.validation_warnings?.find((w) => w.trim())
  if (firstValidation) return firstValidation
  if (isCopyOverCharLimit(copy, maxChars)) {
    const over = resolveCopyCharCount(copy) - (maxChars as number)
    return `Over channel limit by ${over} character${over === 1 ? '' : 's'}`
  }
  if (copy.truncation_suggestion?.trim()) return copy.truncation_suggestion.trim()
  return undefined
}
