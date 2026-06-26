import type { Subject } from "../types";

/**
 * Дисциплины КТ. Профильные — для группы М094 (ИКТ); «Готовность к обучению» —
 * общий блок для научно-педагогической магистратуры. Порядок и число заданий
 * каждого экзамена заданы пресетами в ./exam.ts.
 *
 * Дисциплины — это просто данные. Чтобы заменить вопросы реальными бланками:
 *   1. отредактируйте JSON-файлы в ./questions/<id>.json;
 *   2. при добавлении новой дисциплины зарегистрируйте файл в ./index.ts.
 */
export const subjects: Subject[] = [
  {
    id: "algorithms",
    name: "Алгоритмы и структуры данных",
    defaultQuestionCount: 30,
  },
  {
    id: "databases",
    name: "Базы данных",
    defaultQuestionCount: 20,
  },
  {
    id: "readiness",
    name: "Готовность к обучению",
    defaultQuestionCount: 30,
  },
];
