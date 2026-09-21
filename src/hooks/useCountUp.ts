import { useEffect, useRef, useState } from "react";

export function useCountUp(
  target: number,
  options: { duration?: number; enabled?: boolean; decimals?: number } = {}
) {
  const { duration = 1100, enabled = true, decimals = 0 } = options;
  const [value, setValue] = useState(0);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!enabled || ranRef.current) return;
    ranRef.current = true;
    if (target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = parseFloat((target * eased).toFixed(decimals));
      setValue(current);
      if (progress < 1) requestAnimationFrame(tick);
      else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration, enabled, decimals]);

  return value;
}
