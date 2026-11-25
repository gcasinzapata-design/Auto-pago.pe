const S = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
)
export const Check = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-5" />
  </S>
)
export const Shield = (p) => (
  <S {...p}>
    <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </S>
)
export const Clock = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
)
export const Bank = (p) => (
  <S {...p}>
    <path d="M3 10h18L12 4 3 10Z" />
    <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
  </S>
)
export const Doc = (p) => (
  <S {...p}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4M10 12h5M10 16h5" />
  </S>
)
export const Home = (p) => (
  <S {...p}>
    <path d="m4 11 8-7 8 7v9H4z" />
    <path d="M10 20v-5h4v5" />
  </S>
)
export const Car = (p) => (
  <S {...p}>
    <path d="M5 16h14v-4l-2-5H7l-2 5v4Z" />
    <path d="M3 12h18M7 19v-3M17 19v-3" />
    <circle cx="8" cy="13.5" r=".6" />
    <circle cx="16" cy="13.5" r=".6" />
  </S>
)
export const Tag = (p) => (
  <S {...p}>
    <path d="M3 12V4h8l9 9-8 8-9-9Z" />
    <circle cx="7.5" cy="8.5" r="1.3" />
  </S>
)
export const Coins = (p) => (
  <S {...p}>
    <ellipse cx="9" cy="7" rx="6" ry="3" />
    <path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
    <path d="M15 11c3.3 0 6 1.3 6 3v3c0 1.7-2.7 3-6 3-2 0-3.8-.5-4.9-1.3" />
  </S>
)
export const Lock = (p) => (
  <S {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </S>
)
export const Menu = (p) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
)
export const WhatsApp = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
)
