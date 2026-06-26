/** Returns a new array with the elements shuffled (Fisher-Yates). Does not mutate the input. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Returns a new array with up to `count` randomly chosen elements. */
export function sample<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.max(0, count));
}
