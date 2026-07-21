export interface ExamDiscipline {
  subjectId: string;
  count: number;
}

export interface ExamPreset {
  id: string;
  title: string;
  short: string;
  description: string;
  durationMinutes: number;
  /** Пороговый балл по каждой дисциплине. */
  passThreshold: number;
  disciplines: ExamDiscipline[];
}

/**
 * Официальные форматы КТ (комплексного тестирования) для поступления в
 * магистратуру (по данным Национального центра тестирования):
 *
 *  • Профильная магистратура (М094): профильный тест — 50 заданий
 *    (30 + 20), 100 минут, максимум 70 баллов (алгоритмы 30×1 + базы
 *    данных 20×2 = 30 + 40). Порог 7 баллов по каждой дисциплине.
 *  • Готовность к обучению: 30 заданий (критическое + аналитическое
 *    мышление), порог 7.
 *  • Иностранный язык (английский): лексико-грамматический тест + чтение —
 *    50 заданий по 1 баллу, официальный порог 25 баллов (аудирование не
 *    моделируется — нет аудиоматериалов).
 *  • Научно-педагогическая: иностранный язык + готовность к обучению +
 *    профильные дисциплины.
 */
export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: "profile",
    title: "Профильный тест (М094)",
    short: "Профиль",
    description:
      "Алгоритмы и структуры данных + Базы данных. Официальный формат профильной магистратуры.",
    durationMinutes: 100,
    passThreshold: 7,
    disciplines: [
      { subjectId: "algorithms", count: 30 },
      { subjectId: "databases", count: 20 },
    ],
  },
  {
    id: "readiness",
    title: "Готовность к обучению",
    short: "Готовность",
    description:
      "Критическое и аналитическое мышление — 30 заданий. Часть теста для научно-педагогической магистратуры.",
    durationMinutes: 45,
    passThreshold: 7,
    disciplines: [{ subjectId: "readiness", count: 30 }],
  },
  {
    id: "english",
    title: "Иностранный язык (английский)",
    short: "Англ. язык",
    description:
      "Лексико-грамматический тест и чтение — 50 заданий. Часть теста для научно-педагогической магистратуры.",
    durationMinutes: 90,
    passThreshold: 25,
    disciplines: [{ subjectId: "english", count: 50 }],
  },
  {
    id: "full",
    title: "Научно-педагогическая",
    short: "Полный",
    // Официальный порог по иностранному языку — 25 баллов; модель пресета
    // поддерживает один порог на все дисциплины, поэтому здесь остаётся 7.
    durationMinutes: 235,
    passThreshold: 7,
    description:
      "Иностранный язык + готовность к обучению + профильные дисциплины. Полный формат научно-педагогической магистратуры.",
    disciplines: [
      { subjectId: "english", count: 50 },
      { subjectId: "readiness", count: 30 },
      { subjectId: "algorithms", count: 30 },
      { subjectId: "databases", count: 20 },
    ],
  },
];

export function getPreset(id: string): ExamPreset | undefined {
  return EXAM_PRESETS.find((p) => p.id === id);
}

export function presetTotal(preset: ExamPreset): number {
  return preset.disciplines.reduce((sum, d) => sum + d.count, 0);
}

/** Формат по умолчанию — профильный тест М094. */
export const DEFAULT_PRESET = EXAM_PRESETS[0];
