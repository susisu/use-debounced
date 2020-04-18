import { useRef, useEffect, useState } from "react";
import { useDebouncedPrim } from "./prim";

export type UseDebouncedCallOptions<R, T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => R;
  init: R | (() => R);
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}>;

export type UseDebouncedCallResult<R, T extends readonly unknown[]> = [
  R, // result
  (...args: T) => void, // call (debounced)
  boolean, // isWaiting
  {
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
  const funcRef = useRef(options.func);
  const leadingRef = useRef(options.leading ?? false);
  const trailingRef = useRef(options.trailing ?? true);

  useEffect(() => {
    funcRef.current = options.func;
  }, [options.func]);

  const [result, setResult] = useState<R>(options.init);
  const [isWaiting, setIsWaiting] = useState(false);

  const callRef = useRef((args: T): void => {
    const func = funcRef.current;
    const result = func(...args);
    setResult(result);
  });

  const { trigger: debouncedCall, cancel, flush } = useDebouncedPrim<T>({
    leadingCallback: args => {
      setIsWaiting(true);
      if (leadingRef.current) {
        const call = callRef.current;
        call(args);
      }
    },
    trailingCallback: (args, count) => {
      setIsWaiting(false);
      if (trailingRef.current && !(leadingRef.current && count === 1)) {
        const call = callRef.current;
        call(args);
      }
    },
    cancelCallback: () => {
      setIsWaiting(false);
    },
    wait: options.wait,
    maxWait: options.maxWait,
  });

  const resetRef = useRef((result: R): void => {
    cancel();
    setResult(result);
  });

  return [
    result,
    debouncedCall,
    isWaiting,
    {
      cancel,
      reset: resetRef.current,
      flush,
    },
  ];
}
