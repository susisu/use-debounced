import { useCallback, useState } from "react";
import { usePrimitiveDebounce } from "./primitive";

export type UseDebouncedStateOptions<T> = Readonly<{
  init: T | (() => T);
  wait: number;
  maxWait?: number | undefined;
  leading?: boolean | undefined;
  trailing?: boolean | undefined;
}>;

export type UseDebouncedStateResult<T> = [
  state: T,
  setState: (state: T) => void,
  isWaiting: boolean,
  methods: {
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
  const [state, setState] = useState<T>(options.init);
  const [isWaiting, setIsWaiting] = useState(false);

  const debounce = usePrimitiveDebounce<readonly [T]>({
    leadingCallback: useCallback(([state], active) => {
      setIsWaiting(true);
      if (active) {
        setState(() => state);
      }
    }, []),
    trailingCallback: useCallback(([state], active) => {
      setIsWaiting(false);
      if (active) {
        setState(() => state);
      }
    }, []),
    cancelCallback: useCallback(() => {
      setIsWaiting(false);
    }, []),
    wait: options.wait,
    maxWait: options.maxWait,
    leading: options.leading,
    trailing: options.trailing,
  });

  const trigger = useCallback(
    (state: T) => {
      debounce.trigger(state);
    },
    [debounce]
  );

  const cancel = useCallback(() => {
    debounce.cancel();
  }, [debounce]);

  const reset = useCallback(
    (state: T): void => {
      debounce.cancel();
      setState(() => state);
    },
    [debounce]
  );

  const flush = useCallback(() => {
    debounce.flush();
  }, [debounce]);

  return [state, trigger, isWaiting, { cancel, reset, flush }];
}
