import { useMemo, useState } from "react";
import SubjectPicker from "../components/SubjectPicker";
import { getQuestionsBySubject, getSubjects, getSubjectName } from "../data";
import { EXAM_PRESETS, presetTotal } from "../data/exam";
import { useStartTest } from "../hooks/useStartTest";
import { TimerIcon } from "../components/icons";

const surface =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export default function TestsPage() {
  const { startPreset, startPractice } = useStartTest();
  const subjects = useMemo(() => getSubjects(), []);
  const poolSizes = useMemo(
    () =>
      Object.fromEntries(
        subjects.map((s) => [s.id, getQuestionsBySubject(s.id).length])
      ),
    [subjects]
  );

  // --- Тренировка ---
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(subjects.map((s) => s.id))
  );
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      subjects.map((s) => [
        s.id,
        Math.min(s.defaultQuestionCount, poolSizes[s.id] ?? 0),
      ])
    )
  );
  const [timed, setTimed] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const setCount = (id: string, count: number) =>
    setCounts((prev) => ({ ...prev, [id]: count }));

  const practiceSubjectIds = subjects
    .map((s) => s.id)
    .filter((id) => selected.has(id));
  const practiceTotal = practiceSubjectIds.reduce(
    (sum, id) => sum + Math.min(counts[id] ?? 0, poolSizes[id] ?? 0),
    0
  );

  const onStartPractice = () => {
    const perSubjectCount = Object.fromEntries(
      practiceSubjectIds.map((id) => [
        id,
        Math.min(counts[id] ?? 0, poolSizes[id] ?? 0),
      ])
    );
    startPractice(practiceSubjectIds, perSubjectCount, timed);
  };

  return (
    <div className="space-y-8">
      {/* Официальные форматы */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Экзамены по официальному формату КТ
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Выберите формат — вопросы и варианты перемешиваются при каждой
            попытке, по завершении выставляется вердикт по пороговому баллу.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EXAM_PRESETS.map((preset) => (
            <div key={preset.id} className={`${surface} flex flex-col p-5`}>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {preset.short}
                </span>
                <span className="text-xs text-slate-400">
                  {presetTotal(preset)} вопросов
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
                {preset.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {preset.description}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                {preset.disciplines.map((d) => (
                  <li key={d.subjectId} className="flex justify-between">
                    <span>{getSubjectName(d.subjectId)}</span>
                    <span className="text-slate-400">{d.count}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <TimerIcon className="h-4 w-4" />
                {preset.durationMinutes} минут · порог {preset.passThreshold}
              </div>
              <button
                type="button"
                onClick={() => startPreset(preset)}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Начать экзамен
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Тренировка */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Тренировка
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Свободный режим: выберите дисциплины и количество вопросов.
          </p>
        </div>

        <SubjectPicker
          subjects={subjects}
          selected={selected}
          counts={counts}
          poolSizes={poolSizes}
          onToggle={toggle}
          onCountChange={setCount}
        />

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          Включить таймер (2 минуты на вопрос)
        </label>

        <div className={`${surface} flex items-center justify-between p-4`}>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Всего вопросов: {practiceTotal}
          </span>
          <button
            type="button"
            onClick={onStartPractice}
            disabled={practiceTotal === 0}
            className="rounded-lg bg-slate-800 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-900 disabled:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Начать тренировку
          </button>
        </div>
      </section>
    </div>
  );
}
