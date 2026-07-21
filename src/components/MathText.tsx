import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Текст вопроса/варианта с формулами: фрагменты вида $...$ рендерятся
 * через KaTeX, остальной текст выводится как есть.
 */
export default function MathText({ text }: { text: string }) {
  if (!text.includes("$")) return <>{text}</>;
  const parts = text.split(/\$([^$]+)\$/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part, { throwOnError: false }),
            }}
          />
        ) : (
          part
        )
      )}
    </>
  );
}
