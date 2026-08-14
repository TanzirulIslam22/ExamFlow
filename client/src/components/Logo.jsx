export default function Logo({ size = 34, text = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0 drop-shadow-sm">
        <rect width="48" height="48" rx="12" fill="#1A56DB" />
        <path d="M14 18h20v4H14zM14 26h20v4H14zM14 34h13v4H14z" fill="#fff" />
        <path d="M34 20l-3.2-3.2L29 18.6l3.4 3.4-3.4 3.4 1.8 1.8z" fill="#EBF5FF" transform="translate(0 -1)" />
        <circle cx="35" cy="25" r="6.5" fill="none" stroke="#fff" strokeWidth="2.5" />
      </svg>
      {text && (
        <div className="leading-none">
          <span className="text-lg font-bold tracking-tight text-ink">Exam<span className="text-primary">Flow</span></span>
        </div>
      )}
    </div>
  );
}
