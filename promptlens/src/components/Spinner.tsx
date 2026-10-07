interface SpinnerProps {
  label: string;
}

/** Announced to screen readers through the live region; the ring itself is decorative. */
export function Spinner({ label }: SpinnerProps) {
  return (
    <p className="spinner" role="status">
      <span className="spinner__ring" aria-hidden="true" />
      {label}
    </p>
  );
}
