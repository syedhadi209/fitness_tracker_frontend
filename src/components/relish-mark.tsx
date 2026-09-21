export function RelishMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="#1b3f32" />
      <path
        fill="#d7f25b"
        d="M15.1 6.2c5.6.6 10.4 5.8 9.6 11.6-.5 3.8-3.4 7-6.9 8.1 2.6-2.2 3.2-6.2 1.4-9.4C17.6 13.4 14.4 12 11 12.4 12.6 8.8 13.8 6.8 15.1 6.2Z"
      />
      <path
        d="M13.2 19.8c2.4-3.2 4.4-5.8 7.2-8.4"
        stroke="#1b3f32"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity=".35"
      />
    </svg>
  );
}

export function RelishWordmark({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5 leading-none">
      <RelishMark size={size} className="shrink-0" />
      <span className="font-serif text-[1.7rem] leading-none tracking-tight">Relish</span>
    </span>
  );
}
