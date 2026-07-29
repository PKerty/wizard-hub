"use client";

export type CardTone = "default" | "correct" | "wrong" | "muted";

export interface IngredientCardProps {
  name: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: CardTone;
}

const TONE_CLASS: Record<CardTone, string> = {
  default:
    "border-moonlight/30 bg-bg-mist/40 hover:border-torchlight hover:shadow-hover",
  correct:
    "border-success/70 bg-success/10 shadow-[0_0_24px_rgba(129,199,132,0.2)]",
  wrong: "border-error/70 bg-error/10",
  muted: "border-moonlight/15 bg-bg-fog/40 opacity-60",
};

export function IngredientCard({
  name,
  onSelect,
  disabled,
  tone = "default",
}: IngredientCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={
        "flex w-full flex-col items-center gap-3 rounded-card border p-6 transition-all duration-base ease-arcane " +
        TONE_CLASS[tone]
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-torchlight"
        aria-hidden="true"
      >
        <path
          d="M9 3h6M10 3v4l-3 5a4 4 0 0 0 8 0l-3-5V3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-center font-display text-eyebrow uppercase tracking-[0.15em] text-steel">
        {name}
      </span>
    </button>
  );
}
