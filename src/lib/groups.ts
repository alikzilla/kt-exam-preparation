import type { GeneratedTest, TestQuestion } from "../types";
import { getSubjectName } from "../data";

/** A contiguous run of same-discipline questions within a generated test. */
export interface QuestionGroup {
  subjectId: string;
  /** Human-readable discipline name. */
  name: string;
  questions: TestQuestion[];
  /** Index of this group's first question in `test.questions`. */
  startIndex: number;
}

/**
 * Splits a test into discipline groups by walking `questions` and starting a new
 * group whenever the `subjectId` changes. Because `buildTest` lays questions out
 * as contiguous per-discipline blocks, this yields one group per discipline; it
 * also works for older saved attempts and single-discipline tests (one group).
 */
export function groupQuestions(test: GeneratedTest): QuestionGroup[] {
  const groups: QuestionGroup[] = [];

  test.questions.forEach((question, index) => {
    const last = groups[groups.length - 1];
    if (last && last.subjectId === question.subjectId) {
      last.questions.push(question);
      return;
    }
    groups.push({
      subjectId: question.subjectId,
      name: getSubjectName(question.subjectId),
      questions: [question],
      startIndex: index,
    });
  });

  return groups;
}
