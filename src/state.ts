import { useRef, useCallback, useState } from "react";
import { useDebouncedPrim } from "./prim";

export type UseDebouncedStateOptions<T> = Readonly<{
  init: T | (() => T);
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}>;

export type UseDebouncedStateResult<T> = [
  T, // state
  (state: T) => void, // setState (debounced)
  boolean, // isWaiting
  {
    cancel: () => void;
    reset: (state: T) => void;
    flush: () => void;
  }
];

/**
 * useDebouncedState is like the standard useState hook, but state updates are debounced.
 */
export function useDebouncedState<T>(
  options: UseDebouncedStateOptions<T>
): UseDebouncedStateResult<T> {
  const leadingRef = useRef(options.leading ?? false);
  const trailingRef = useRef(options.trailing ?? true);

  const [state, setState] = useState<T>(options.init);
  const [isWaiting, setIsWaiting] = useState(false);

  const { trigger: debouncedSetState, cancel, flush } = useDebouncedPrim<readonly [T]>({
    leadingCallback: useCallback(([state]) => {
      setIsWaiting(true);
      if (leadingRef.current) {
        setState(state);
      }
    }, []),
    trailingCallback: useCallback(([state], count) => {
      setIsWaiting(false);
      if (trailingRef.current && !(leadingRef.current && count === 1)) {
        setState(state);
      }
    }, []),
    cancelCallback: useCallback(() => {
      setIsWaiting(false);
    }, []),
    wait: options.wait,
    maxWait: options.maxWait,
  });

  const resetRef = useRef((state: T): void => {
    cancel();
    setState(state);
  });

  return [
    state,
    debouncedSetState,
    isWaiting,
    {
      cancel,
      reset: resetRef.current,
      flush,
    },
  ];
}
