import MathText from "./MathText";

/**
 * Текст вопроса, который может содержать блоки кода в разметке ```…```
 * (например SQL-запросы). Блоки кода рендерятся моноширинным шрифтом с
 * сохранением переносов строк, остальной текст — как обычно, через MathText
 * (с поддержкой формул $…$).
 *
 * Блок кода — элемент уровня блока (<pre>), поэтому явно сбрасываем
 * наследуемые от заголовка стили (жирность/размер), внутри которого этот
 * компонент обычно используется.
 */
const FENCE = /```(?:[a-zA-Z]+)?\n?([\s\S]*?)```/g;

export default function QuestionText({ text }: { text: string }) {
  if (!text.includes("```")) return <MathText text={text} />;

  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  FENCE.lastIndex = 0;

  while ((match = FENCE.exec(text)) !== null) {
    const prose = text.slice(last, match.index);
    if (prose.trim()) nodes.push(<MathText key={key++} text={prose} />);
    nodes.push(
      <pre
        key={key++}
        className="my-3 overflow-x-auto whitespace-pre rounded-lg border border-line bg-surface-2 p-3 font-mono text-[13px] font-normal leading-relaxed text-ink"
      >
        <code>{match[1].replace(/\n$/, "")}</code>
      </pre>
    );
    last = match.index + match[0].length;
  }

  const tail = text.slice(last);
  if (tail.trim()) nodes.push(<MathText key={key++} text={tail} />);

  return <>{nodes}</>;
}
