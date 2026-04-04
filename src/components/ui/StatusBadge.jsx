import './StatusBadge.css';

const variantMap = {
  // Status values
  active: 'success',
  approved: 'success',
  audited: 'success',
  paid: 'success',
  converted: 'success',
  awaiting_payment: 'warning',
  pending: 'warning',
  needs_changes: 'warning',
  signed_up: 'info',
  audit_scheduled: 'info',
  in_review: 'info',
  rejected: 'danger',
  inactive: 'neutral',
  on_leave: 'neutral',
  // Direct variants
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};

const labelMap = {
  active: 'Active',
  approved: 'Approved',
  audited: 'Audited',
  paid: 'Paid',
  converted: 'Converted',
  signed_up: 'Signed Up',
  awaiting_payment: 'Awaiting Payment',
  pending: 'Pending',
  needs_changes: 'Needs Changes',
  audit_scheduled: 'Audit Scheduled',
  in_review: 'In Review',
  rejected: 'Rejected',
  inactive: 'Inactive',
  on_leave: 'On Leave',
};

export default function StatusBadge({ status, variant, label }) {
  const resolvedVariant = variant || variantMap[status] || 'neutral';
  const resolvedLabel = label || labelMap[status] || status;

  return (
    <span className={`status-badge status-badge--${resolvedVariant}`}>
      <span className="status-badge__dot" />
      {resolvedLabel}
    </span>
  );
}
