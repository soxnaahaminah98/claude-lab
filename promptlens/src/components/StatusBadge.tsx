import { FR } from '../copy/fr';
import type { AssetStatus } from '../domain/asset';

interface StatusBadgeProps {
  status: AssetStatus;
}

/** Colour is never the only signal: the label is always shown. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status status--${status}`}>
      <span className="status__dot" aria-hidden="true" />
      {FR.statuses[status]}
    </span>
  );
}
