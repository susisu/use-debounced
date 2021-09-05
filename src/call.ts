import { useCallback, useState } from "react";
import { usePrimitiveDebounce } from "./primitive";

export type UseDebouncedCallOptions<R, T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => R;
  init: R | (() => R);
  wait: number;
  maxWait?: number | undefined;
  leading?: boolean | undefined;
  trailing?: boolean | undefined;
}>;

export type UseDebouncedCallResult<R, T extends readonly unknown[]> = [
  result: R,
  call: (...args: T) => void,
  isWaiting: boolean,
  methods: {
    cancel: () => void;
    reset: (result: R) => void;
    flush: () => void;
  }
];

/**
 * useDebouncedCall debounces synchronous function calls.
 * When the given function is invoked after timeout, the result will be set to the state.
 */
export function useDebouncedCall<R, T extends readonly unknown[]>(
  options: UseDebouncedCallOptions<R, T>
): UseDebouncedCallResult<R, T> {
  const [result, setResult] = useState<R>(options.init);
  const [isWaiting, setIsWaiting] = useState(false);

  const call = useCallback(
    (args: T): void => {
      const func = options.func;
      const result = func(...args);
      setResult(() => result);
    },
    [options.func]
  );

  const debounce = usePrimitiveDebounce<T>({
    leadingCallback: useCallback(
      (args, active) => {
        setIsWaiting(true);
        if (active) {
          call(args);
        }
      },
      [call]
    ),
    trailingCallback: useCallback(
      (args, active) => {
        setIsWaiting(false);
        if (active) {
          call(args);
        }
      },
      [call]
    ),
    cancelCallback: useCallback(() => {
      setIsWaiting(false);
    }, []),
    wait: options.wait,
    maxWait: options.maxWait,
    leading: options.leading,
    trailing: options.trailing,
  });

  const trigger = useCallback(
    (...args: T): void => {
      debounce.trigger(...args);
    },
    [debounce]
  );

  const cancel = useCallback(() => {
    debounce.cancel();
  }, [debounce]);

  const reset = useCallback(
    (result: R): void => {
      debounce.cancel();
      setResult(() => result);
    },
    [debounce]
  );

  const flush = useCallback(() => {
    debounce.flush();
  }, [debounce]);

  return [result, trigger, isWaiting, { cancel, reset, flush }];
}
