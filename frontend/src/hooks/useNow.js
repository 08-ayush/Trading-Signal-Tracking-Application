import { useEffect, useState } from "react";

/**
 * Returns the current date, ticking at a fixed interval (for countdowns).
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
