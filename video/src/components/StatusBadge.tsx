import React from 'react';
import { BRAND } from '../lib/colors';

/**
 * Status badge matching CLI's statusBadge() from src/ui/components.ts.
 *
 * - active/full: ● ACTIVE (lime bold)
 * - trial: TRIAL (orange bold, no icon)
 * - pending: ⌛ PENDING (orange)
 * - failed/suspended/closed: ✘ FAILED (red bold)
 */

type BadgeType =
  | 'active'
  | 'full'
  | 'pending'
  | 'trial'
  | 'failed'
  | 'suspended'
  | 'closed';

interface StatusBadgeProps {
  type: BadgeType;
  text?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, text }) => {
  const upper = (text ?? type).toUpperCase();

  switch (type) {
    case 'active':
    case 'full':
      return (
        <span>
          <span style={{ color: BRAND.lime }}>●</span>
          <span style={{ color: BRAND.lime, fontWeight: 700 }}> {upper}</span>
        </span>
      );
    case 'trial':
      return (
        <span style={{ color: BRAND.orange, fontWeight: 700 }}>{upper}</span>
      );
    case 'pending':
      return (
        <span>
          <span style={{ color: BRAND.orange }}>⌛</span>
          <span style={{ color: BRAND.orange }}> {upper}</span>
        </span>
      );
    case 'failed':
    case 'suspended':
    case 'closed':
      return (
        <span>
          <span style={{ color: BRAND.red }}>✘</span>
          <span style={{ color: BRAND.red, fontWeight: 700 }}> {upper}</span>
        </span>
      );
    default:
      return <span>{upper}</span>;
  }
};
