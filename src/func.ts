import { useCallback, useRef } from "react";
import { usePrimitiveDebounce } from "./primitive";

export type UseDebouncedFuncOptions<T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => void;
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
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

  const triggerRef = useRef((...args: T) => {
    debounce.trigger(...args);
  });

  const cancelRef = useRef(() => {
    debounce.cancel();
  });

  const flushRef = useRef(() => {
    debounce.flush();
  });

  return [
    triggerRef.current,
    {
      cancel: cancelRef.current,
      flush: flushRef.current,
    },
  ];
}
