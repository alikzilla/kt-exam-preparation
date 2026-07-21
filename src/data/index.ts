import type { Passage, Question, Subject } from "../types";
import { subjects } from "./subjects";
import passages from "./passages.json";
import algorithms from "./questions/algorithms.json";
import databases from "./questions/databases.json";
import readiness from "./questions/readiness.json";
import english from "./questions/english.json";

/**
 * Единая точка доступа к банку вопросов — «точка замены».
 *
 * Сейчас это демонстрационные вопросы из JSON. Когда будут готовы реальные
 * бланки КТ, меняются только JSON-файлы ниже (и этот реестр); остальное
 * приложение работает с вопросами исключительно через функции отсюда.
 */
const questionsBySubject: Record<string, Question[]> = {
  algorithms: algorithms as Question[],
  databases: databases as Question[],
  readiness: readiness as Question[],
  english: english as Question[],
};

export function getSubjects(): Subject[] {
  return subjects;
}

export function getSubject(subjectId: string): Subject | undefined {
  return subjects.find((s) => s.id === subjectId);
}

export function getSubjectName(subjectId: string): string {
  return getSubject(subjectId)?.name ?? subjectId;
}

export function getQuestionsBySubject(subjectId: string): Question[] {
  return questionsBySubject[subjectId] ?? [];
}

export function getAllQuestions(): Question[] {
  return subjects.flatMap((s) => getQuestionsBySubject(s.id));
}

export function getPassage(passageId: string): Passage | undefined {
  return (passages as Passage[]).find((p) => p.id === passageId);
}
