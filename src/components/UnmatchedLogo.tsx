interface UnmatchedLogoProps {
  className?: string;
}

export default function UnmatchedLogo({ className = "" }: UnmatchedLogoProps) {
  return (
    <span className={`unmatched-logo ${className}`} data-text="UNMATCHED">
      UNMATCHED
      <span className="unmatched-logo__line" aria-hidden="true" />
    </span>
  );
}
