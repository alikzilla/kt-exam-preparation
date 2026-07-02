import { useEffect, useRef, useState } from "react";

/**
 * Countdown timer. Starts immediately from `seconds` and calls `onExpire` once
 * when it reaches zero. Returns the remaining seconds. If `seconds` is
 * undefined or 0 the session is untimed: no countdown runs and `onExpire` is
 * never called.
 */
export function useCountdown(seconds: number | undefined, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds ?? 0);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!seconds) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return remaining;
}

/** Formats seconds as H:MM:SS or MM:SS. */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
