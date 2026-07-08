import type { GeneratedTest, TestQuestion } from "../types";
import { getSubjectName } from "../data";

/** A question together with its position in the flat `test.questions` list. */
export interface GroupItem {
  question: TestQuestion;
  index: number;
}

/** All questions of one discipline within a generated test. */
export interface QuestionGroup {
  subjectId: string;
  /** Human-readable discipline name. */
  name: string;
  items: GroupItem[];
  /** Index of this group's first question in `test.questions`. */
  startIndex: number;
}

/**
 * Splits a test into one group per distinct discipline, in the order each
 * discipline first appears. Grouping by subject (rather than by consecutive
 * runs) means a two-discipline exam always yields exactly two groups, even if
 * the questions happen to be interleaved. Works for single-discipline tests
 * (one group) and older saved attempts alike.
 */
export function groupQuestions(test: GeneratedTest): QuestionGroup[] {
  const bySubject = new Map<string, QuestionGroup>();
  const order: string[] = [];

  test.questions.forEach((question, index) => {
    let group = bySubject.get(question.subjectId);
    if (!group) {
      group = {
        subjectId: question.subjectId,
        name: getSubjectName(question.subjectId),
        items: [],
        startIndex: index,
      };
      bySubject.set(question.subjectId, group);
      order.push(question.subjectId);
    }
    group.items.push({ question, index });
  });

  return order.map((subjectId) => bySubject.get(subjectId)!);
}
