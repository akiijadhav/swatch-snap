import { useEffect, type RefObject } from "react";

export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T>,
  enabled: boolean,
  onOutsideClick: () => void,
  ignoreSelectors: string[] = []
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (ignoreSelectors.some((selector) => target.closest(selector))) return;
      if (ref.current && !ref.current.contains(target)) {
        onOutsideClick();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [enabled, ignoreSelectors, onOutsideClick, ref]);
}
