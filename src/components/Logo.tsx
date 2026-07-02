/**
 * Фирменный знак приложения: белый карандаш на скруглённом квадрате
 * акцентного цвета. Векторная копия app-иконки из public/.
 */
export default function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="5.5" className="fill-accent" />
      <g transform="rotate(45 12 12)" fill="#fff">
        <rect x="9.9" y="2.8" width="4.2" height="2.6" rx="1" />
        <rect x="9.9" y="6.4" width="4.2" height="9.2" />
        <path d="M9.9 16.6h4.2L12 20.4z" />
      </g>
    </svg>
  );
}
