import { useCallback } from "react";
import { usePrimitiveDebounce } from "./primitive";

export type UseDebouncedFuncOptions<T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => void;
  wait: number;
  maxWait?: number | undefined;
  leading?: boolean | undefined;
  trailing?: boolean | undefined;
}>;

export type UseDebouncedFuncResult<T extends readonly unknown[]> = [
  call: (...args: T) => void,
  methods: {
    cancel: () => void;
    flush: () => void;
  }
];

/**
 * useDebouncedFunc creates a debounced version of a function.
 */
export function useDebouncedFunc<T extends readonly unknown[]>(
  options: UseDebouncedFuncOptions<T>
): UseDebouncedFuncResult<T> {
  const callback = useCallback(
    (args: T, active: boolean): void => {
      if (active) {
        const func = options.func;
        func(...args);
      }
    },
    [options.func]
  );

  const debounce = usePrimitiveDebounce<T>({
    leadingCallback: callback,
    trailingCallback: callback,
    cancelCallback: useCallback(() => {}, []),
    wait: options.wait,
    maxWait: options.maxWait,
    leading: options.leading,
    trailing: options.trailing,
  });

  const trigger = useCallback(
    (...args: T) => {
      debounce.trigger(...args);
    },
    [debounce]
  );

  const cancel = useCallback(() => {
    debounce.cancel();
  }, [debounce]);

  const flush = useCallback(() => {
    debounce.flush();
  }, [debounce]);

  return [trigger, { cancel, flush }];
}
