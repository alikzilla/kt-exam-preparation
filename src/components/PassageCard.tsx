import { getPassage } from "../data";

/**
 * Текст (пассаж) для вопросов на чтение. В тесте раскрыт по умолчанию,
 * в разборе и банке вопросов — свёрнут, чтобы не загромождать список.
 */
export default function PassageCard({
  passageId,
  defaultOpen = false,
}: {
  passageId: string;
  defaultOpen?: boolean;
}) {
  const passage = getPassage(passageId);
  if (!passage) return null;

  return (
    <details
      open={defaultOpen}
      className="rounded-lg border border-line bg-surface-2"
    >
      <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-semibold text-ink">
        {passage.title}
        <span className="ml-2 text-xs font-normal text-ink-faint">
          текст к вопросу
        </span>
      </summary>
      <div className="max-h-72 space-y-3 overflow-y-auto border-t border-line px-4 py-3 text-sm leading-relaxed text-ink-soft">
        {passage.text.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </details>
  );
}
