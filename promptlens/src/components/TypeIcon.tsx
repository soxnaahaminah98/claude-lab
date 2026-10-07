import type { ReactElement } from 'react';
import type { IconKey } from '../domain/equipment';

const ICONS: Record<IconKey, ReactElement> = {
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1" />
      <path d="M2 19h20" />
    </>
  ),
  desktop: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  printer: (
    <>
      <path d="M7 9V4h10v5" />
      <path d="M6 17H4V9h16v8h-2" />
      <rect x="7" y="14" width="10" height="6" />
    </>
  ),
  'receipt-printer': (
    <>
      <rect x="4" y="4" width="16" height="7" rx="1" />
      <path d="M7 11v9l2.5-1.5L12 20l2.5-1.5L17 20v-9" />
    </>
  ),
  smartphone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  other: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  'network-device': (
    <>
      <rect x="3" y="14" width="18" height="6" rx="1" />
      <path d="M7 17h.01M11 17h.01" />
      <path d="M8.5 11a5 5 0 0 1 7 0M6 8.5a9 9 0 0 1 12 0" />
    </>
  ),
};

interface TypeIconProps {
  icon: IconKey;
}

/** Decorative icon: the equipment type is always named in text next to it. */
export function TypeIcon({ icon }: TypeIconProps) {
  return (
    <svg
      className="type-icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[icon]}
    </svg>
  );
}
