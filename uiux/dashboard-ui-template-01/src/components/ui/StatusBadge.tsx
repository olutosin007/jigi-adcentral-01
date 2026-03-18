import React from 'react';
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
    className: 'bg-gray-100 text-gray-600'
  },
  'agency-review': {
    label: 'Agency Review',
    className: 'bg-blue-50 text-blue-600'
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-purple-50 text-purple-700'
  },
  'in-review': {
    label: 'In Review',
    className: 'bg-amber-50 text-amber-700'
  },
  'changes-requested': {
    label: 'Changes Requested',
    className: 'bg-orange-50 text-orange-600'
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-green-700'
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-600'
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