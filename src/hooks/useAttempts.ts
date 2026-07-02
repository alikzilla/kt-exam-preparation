import { useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import type { Attempt } from "../types";
import {
  getAttempt as getLocalAttempt,
  loadAttempts as loadLocalAttempts,
  saveAttempt as saveLocalAttempt,
} from "../lib/storage";

/** Convex-документ -> Attempt (localId снова становится id). */
function docToAttempt(doc: Doc<"attempts">): Attempt {
  const { _id, _creationTime, userId, localId, ...rest } = doc;
  return { id: localId, ...rest };
}

/** История попыток: облако для вошедших, localStorage для гостей. */
export function useAttempts(): { attempts: Attempt[]; isLoading: boolean } {
  const { isSignedIn } = useAuth();
  const cloud = useQuery(api.attempts.myAttempts, isSignedIn ? {} : "skip");
  if (!isSignedIn) {
    return { attempts: loadLocalAttempts(), isLoading: false };
  }
  if (cloud === undefined) return { attempts: [], isLoading: true };
  return { attempts: cloud.map(docToAttempt), isLoading: false };
}

/** Одна попытка по id. Для вошедших: облако ?? localStorage (фолбэк). */
export function useAttempt(id: string | undefined): {
  attempt: Attempt | undefined;
  isLoading: boolean;
} {
  const { isSignedIn } = useAuth();
  const cloud = useQuery(
    api.attempts.getByLocalId,
    isSignedIn && id ? { localId: id } : "skip"
  );
  const local = id ? getLocalAttempt(id) : undefined;
  if (!isSignedIn) return { attempt: local, isLoading: false };
  if (cloud === undefined && local === undefined && id) {
    return { attempt: undefined, isLoading: true };
  }
  return {
    attempt: cloud ? docToAttempt(cloud) : local,
    isLoading: false,
  };
}

/** Сохранение попытки. Ошибка облака -> фолбэк в localStorage. */
export function useSaveAttempt(): (attempt: Attempt) => Promise<void> {
  const { isSignedIn } = useAuth();
  const save = useMutation(api.attempts.saveAttempt);
  return useCallback(
    async (attempt: Attempt) => {
      if (!isSignedIn) {
        saveLocalAttempt(attempt);
        return;
      }
      const { id, ...rest } = attempt;
      try {
        await save({ attempt: { localId: id, ...rest } });
      } catch {
        // Облако недоступно — сохраняем локально, useAttempt найдёт фолбэк.
        saveLocalAttempt(attempt);
      }
    },
    [isSignedIn, save]
  );
}
