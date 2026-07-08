export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  subjectId: string;
  text: string;
  options: QuestionOption[];
  /** Array supports both single-correct (length 1) and multi-correct questions. */
  correctOptionIds: string[];
  /** Optional figure for the question (used once real blanks include images). */
  imageUrl?: string;
  /** Optional explanation shown in the review screen. */
  explanation?: string;
}

export interface Subject {
  id: string;
  name: string;
  /** How many questions to draw from this subject per generated test. */
  defaultQuestionCount: number;
  /**
   * Points awarded per correct question. Mirrors the official КТ format where
   * the profile discipline «Базы данных» (single/multiple choice) is worth 2
   * points per question. Defaults to 1 when omitted.
   */
  pointsPerQuestion: number;
}

/** A single question as it appears inside a generated test (options already shuffled). */
export interface TestQuestion extends Question {
  multiCorrect: boolean;
}

/** A generated test: an ordered list of questions drawn from one or more subjects. */
export interface GeneratedTest {
  id: string;
  createdAt: number;
  subjectIds: string[];
  questions: TestQuestion[];
}

/** questionId -> selected option ids */
export type AnswerMap = Record<string, string[]>;

export interface QuestionResult {
  questionId: string;
  /** True only when fully correct (every correct option, no extras). */
  correct: boolean;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  /**
   * Points earned for this question. Can be partial for the 2-point profile
   * discipline: 2 = no mistakes, 1 = exactly one mistake, 0 = two or more.
   */
  pointsEarned: number;
  /** Maximum points this question is worth. */
  maxPoints: number;
}

export interface SubjectScore {
  subjectId: string;
  /** Number of correct questions. */
  correct: number;
  /** Number of questions in this discipline. */
  total: number;
  /** Points earned (correct × pointsPerQuestion). */
  points: number;
  /** Maximum points available (total × pointsPerQuestion). */
  maxPoints: number;
}

export interface GradeResult {
  /** Number of correct questions. */
  correct: number;
  /** Number of questions in the test. */
  total: number;
  /** Points earned across all disciplines. */
  points: number;
  /** Maximum points available across all disciplines. */
  maxPoints: number;
  perQuestion: QuestionResult[];
  perSubject: SubjectScore[];
}

export type TestMode = "exam" | "practice";

/** A saved attempt, persisted to localStorage so the review is reproducible. */
export interface Attempt {
  id: string;
  takenAt: number;
  mode: TestMode;
  /** Название формата (для экзамена) — например «Профильный тест (М094)». */
  examTitle?: string;
  /** Пороговый балл по дисциплине для этого экзамена. */
  passThreshold?: number;
  test: GeneratedTest;
  answers: AnswerMap;
  result: GradeResult;
}

/** Пороговый балл по умолчанию, если не задан в попытке. */
export const DEFAULT_PASS_THRESHOLD = 7;
