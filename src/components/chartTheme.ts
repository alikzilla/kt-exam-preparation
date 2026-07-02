import { useMemo, type CSSProperties } from "react";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Цвета темы для Recharts. SVG-атрибуты не понимают var(--…),
 * поэтому читаем вычисленные значения и обновляем их при смене темы.
 */
export function useChartColors() {
  const { resolved } = useTheme();
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const rgb = (name: string) => `rgb(${css.getPropertyValue(name).trim()})`;
    return {
      accent: rgb("--c-accent"),
      line: rgb("--c-line"),
      surface: rgb("--c-surface"),
      surface2: rgb("--c-surface-2"),
      ink: rgb("--c-ink"),
      inkSoft: rgb("--c-ink-soft"),
      inkFaint: rgb("--c-ink-faint"),
    };
    // resolved нужен, чтобы перечитать переменные после переключения темы.
  }, [resolved]);
}

export function tooltipStyles(c: ReturnType<typeof useChartColors>): {
  contentStyle: CSSProperties;
  labelStyle: CSSProperties;
  itemStyle: CSSProperties;
} {
  return {
    contentStyle: {
      backgroundColor: c.surface,
      border: `1px solid ${c.line}`,
      borderRadius: 8,
      boxShadow: "0 4px 16px -4px rgb(0 0 0 / 0.15)",
      fontSize: 12,
      padding: "8px 10px",
    },
    labelStyle: { color: c.inkSoft, marginBottom: 4 },
    itemStyle: { color: c.ink, padding: 0 },
  };
}
