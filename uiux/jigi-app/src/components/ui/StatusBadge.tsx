type StatusVariant =
'draft' |
'agency-review' |
'submitted' |
'in-review' |
'changes-requested' |
'approved' |
'rejected';
interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}
const statusConfig: Record<
  StatusVariant,
  {
    label: string;
    className: string;
  }> =
{
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground'
  },
  'agency-review': {
    label: 'Agency Review',
    className: 'bg-primary/10 text-primary'
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-primary/10 text-primary'
  },
  'in-review': {
    label: 'In Review',
    className: 'bg-warning/10 text-warning'
  },
  'changes-requested': {
    label: 'Changes Requested',
    className: 'bg-warning/10 text-warning'
  },
  approved: {
    label: 'Approved',
    className: 'bg-success/10 text-success'
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive'
  }
};
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${config.className} ${className}`}>

      {config.label}
    </span>);

}