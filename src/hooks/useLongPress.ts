import { useRef, useCallback } from 'react';

interface LongPressOptions {
  delay?: number;
  onClick?: () => void;
  onLongPress: () => void;
}

export function useLongPress({ delay = 500, onClick, onLongPress }: LongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [delay, onLongPress]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongPressRef.current && onClick) {
      onClick();
    }
    isLongPressRef.current = false;
  }, [onClick]);

  const handlers = {
    onMouseDown: start,
    onMouseUp: handleClick,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: handleClick,
    onTouchCancel: cancel,
  };

  return handlers;
}
