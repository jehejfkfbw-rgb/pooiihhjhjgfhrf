export function NovaMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="nc-g1" x1="6" y1="6" x2="42" y2="42">
          <stop stopColor="#A78BFA" />
          <stop offset="0.55" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#F0ABFC" />
        </linearGradient>
        <radialGradient id="nc-g2" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M24 3 L28.2 19.8 L45 24 L28.2 28.2 L24 45 L19.8 28.2 L3 24 L19.8 19.8 Z"
        fill="url(#nc-g1)"
      />
      <circle cx="24" cy="24" r="9" fill="url(#nc-g2)" opacity="0.9" />
      <circle cx="38.5" cy="9.5" r="1.6" fill="#22D3EE" />
      <circle cx="9" cy="37" r="1.2" fill="#A78BFA" />
    </svg>
  );
}

export function LogoWord({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <NovaMark size={compact ? 34 : 40} />
      <span className="leading-tight">
        <span className="font-display block text-lg font-black tracking-tight text-white">
          NEBRAS AI
        </span>
        <span className="block text-[11px] font-medium text-ink-dim">
          نبراس — مصر × السعودية
        </span>
      </span>
    </span>
  );
}
