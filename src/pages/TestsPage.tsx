import { useMemo, useState } from "react";
import SubjectPicker from "../components/SubjectPicker";
import { getQuestionsBySubject, getSubjects, getSubjectName } from "../data";
import { EXAM_PRESETS, presetTotal } from "../data/exam";
import { useStartTest } from "../hooks/useStartTest";
import { ArrowRightIcon } from "../components/icons";

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
    <div className="space-y-10">
      {/* Официальные форматы */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Экзамены по формату КТ
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Выберите формат — вопросы и варианты перемешиваются при каждой
            попытке, по завершении выставляется вердикт по пороговому баллу.
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Формат КТ: 50 вопросов · 100 минут · порог ≥ 7 по каждой дисциплине.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EXAM_PRESETS.map((preset) => (
            <div key={preset.id} className="surface flex flex-col p-5">
              <div className="flex items-center justify-between text-xs text-ink-faint">
                <span className="font-medium text-accent">{preset.short}</span>
                <span className="tabular-nums">
                  {presetTotal(preset)} вопросов
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-ink">
                {preset.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {preset.description}
              </p>
              <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-ink-soft">
                {preset.disciplines.map((d) => (
                  <li key={d.subjectId} className="flex justify-between">
                    <span>{getSubjectName(d.subjectId)}</span>
                    <span className="tabular-nums text-ink-faint">
                      {d.count}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs tabular-nums text-ink-faint">
                {preset.durationMinutes} мин · порог {preset.passThreshold}
              </div>
              <button
                type="button"
                onClick={() => startPreset(preset)}
                className="btn-primary mt-4 w-full"
              >
                Начать экзамен
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Тренировка */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Тренировка
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Выберите дисциплины и количество вопросов. Таймер по желанию.
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

        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-2">
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--c-accent))]"
          />
          Включить таймер (2 минуты на вопрос)
        </label>

        <div className="surface flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="text-2xl font-semibold leading-none tabular-nums text-ink">
              {practiceTotal}
            </div>
            <div className="mt-1 text-xs text-ink-soft">вопросов в наборе</div>
          </div>
          <button
            type="button"
            onClick={onStartPractice}
            disabled={practiceTotal === 0}
            className="btn-primary"
          >
            Начать тренировку
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
