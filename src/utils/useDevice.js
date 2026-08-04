import { useEffect, useState } from 'react';

function detectTouchOnly() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  return coarse && noHover;
}

export function useNeedsPointerWarning() {
  const [isTouchOnly, setIsTouchOnly] = useState(detectTouchOnly);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const coarse = window.matchMedia('(pointer: coarse)');
    const noHover = window.matchMedia('(hover: none)');
    function update() {
      setIsTouchOnly(coarse.matches && noHover.matches);
    }
    update();
    if (coarse.addEventListener) {
      coarse.addEventListener('change', update);
      noHover.addEventListener('change', update);
      return () => {
        coarse.removeEventListener('change', update);
        noHover.removeEventListener('change', update);
      };
    }
    coarse.addListener(update);
    noHover.addListener(update);
    return () => {
      coarse.removeListener(update);
      noHover.removeListener(update);
    };
  }, []);

  return isTouchOnly;
}
