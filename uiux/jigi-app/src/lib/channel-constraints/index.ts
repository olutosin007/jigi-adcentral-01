/**
 * Channel Constraints Library — Public API
 * PRD: 03-prd-ctxt-channel-library
 */

export { CHANNEL_CONSTRAINTS_LIBRARY } from './config'
export {
  getChannelConstraints,
  getChannelConstraint,
  hasChannelConstraints,
  getPrimaryCopyBudgetChars,
  getCopyPromptBudget,
} from './services'
export type { CopyPromptBudget } from './services'
