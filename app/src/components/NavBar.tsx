'use client';

interface NavBarProps {
  onBack?: () => void;
  onHome: () => void;
  backLabel?: string;
}

export function NavBar({ onBack, onHome, backLabel = '← Previous step' }: NavBarProps) {
  return (
    <div className="flex w-full items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[44px] items-center text-sm font-semibold text-[#035ba7] transition-opacity hover:opacity-70 active:opacity-50"
          aria-label="Go to previous step"
        >
          {backLabel}
        </button>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={onHome}
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-black/10 bg-white/60 transition-colors hover:bg-white/90 active:bg-white"
        aria-label="Go to home"
      >
        {/* HouseLine icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 10.5L12 3L21 10.5V21H15V15H9V21H3V10.5Z"
            stroke="#035ba7"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
