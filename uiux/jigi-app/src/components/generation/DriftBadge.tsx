/**
 * Drift Badge — PRD 10 Sprint 4
 * Shows "Review Required" when brief changed after asset generation.
 */

import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DriftBadgeProps {
  /** Optional tooltip explanation */
  tooltip?: string
  className?: string
}

const DEFAULT_TOOLTIP =
  'Brief updated after this asset was generated. Review recommended to ensure alignment with the latest campaign context.'

export function DriftBadge({ tooltip = DEFAULT_TOOLTIP, className }: DriftBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] ${className ?? ''}`}
          >
            <AlertTriangle className="w-3 h-3 mr-0.5" />
            Review Required
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
