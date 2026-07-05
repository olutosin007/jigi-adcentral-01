import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComplianceResult } from '@/lib/ai'

interface ComplianceDisplayProps {
  result: ComplianceResult | null
  isLoading?: boolean
  onRecheck?: () => void
}

const statusConfig = {
  pass: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    label: 'Pass',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    label: 'Warning',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    label: 'Warning',
  },
  fail: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    label: 'Fail',
  },
}

export function ComplianceDisplay({ result, isLoading, onRecheck }: ComplianceDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-muted rounded-xl border border-border p-4" data-tour="compliance-panel">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Checking compliance...</span>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4" data-tour="compliance-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">No compliance check performed</span>
          </div>
          {onRecheck && (
            <Button variant="outline" size="sm" onClick={onRecheck}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Run Check
            </Button>
          )}
        </div>
      </div>
    )
  }

  const overallStatus = result.passed ? 'pass' : 'fail'
  const overallConfig = statusConfig[overallStatus]
  const OverallIcon = overallConfig.icon

  return (
    <div className={`rounded-xl border ${overallConfig.borderColor} ${overallConfig.bgColor} p-4`} data-tour="compliance-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <OverallIcon className={`w-5 h-5 ${overallConfig.color}`} />
          <span className={`text-sm font-semibold ${overallConfig.color}`}>
            Compliance: {result.passed ? 'Passed' : 'Issues Found'}
          </span>
        </div>
        {onRecheck && (
          <Button variant="outline" size="sm" onClick={onRecheck} className="h-7 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            Recheck
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {result.checks.map((check, index) => {
          const config = statusConfig[check.status as keyof typeof statusConfig] || statusConfig.pass
          const Icon = config.icon

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-2.5 bg-background rounded-lg border border-border"
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{check.name}</span>
                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
