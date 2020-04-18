import { useRef, useCallback, useEffect, useState } from "react";
import { attachActions, CancelFunc } from "@susisu/promise-utils";
import { useDebouncedCall } from "./call";

type UseAsyncCallOptions<R, T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => Promise<R>;
  init: R | (() => R);
}>;

type UseAsyncCallResult<R, T extends readonly unknown[]> = [
  R, // result
  (...args: T) => void, // call
  boolean, // isPending
  {
    cancel: () => void;
    reset: (result: R) => void;
  }
];

/**
 * Auxiliary hook to implement useDebouncedAsyncCall.
 */
function useAsyncCall<R, T extends readonly unknown[]>(
  options: UseAsyncCallOptions<R, T>
): UseAsyncCallResult<R, T> {
  const [result, setResult] = useState<R>(options.init);
  const [isPending, setIsPending] = useState(false);

  const cancelAsyncCallRef = useRef<CancelFunc | undefined>(undefined);

  const call = useCallback(
    (...args: T): void => {
      if (cancelAsyncCallRef.current) {
        const cancelAsyncCall = cancelAsyncCallRef.current;
        cancelAsyncCall();
        cancelAsyncCallRef.current = undefined;
      }
      setIsPending(true);
      const func = options.func;
      [cancelAsyncCallRef.current] = attachActions(
        func(...args),
        result => {
          cancelAsyncCallRef.current = undefined;
          setResult(result);
          setIsPending(false);
        },
        err => {
          // eslint-disable-next-line no-console
          console.error(err);
          cancelAsyncCallRef.current = undefined;
          setIsPending(false);
        }
      );
    },
    [options.func]
  );

  const cancelRef = useRef((): void => {
    if (cancelAsyncCallRef.current) {
      const cancelAsyncCall = cancelAsyncCallRef.current;
      cancelAsyncCall();
      cancelAsyncCallRef.current = undefined;
    }
    setIsPending(false);
  });

  const resetRef = useRef((result: R): void => {
    const cancel = cancelRef.current;
    cancel();
    setResult(result);
  });

  useEffect(
    () => () => {
      if (cancelAsyncCallRef.current) {
        const cancelAsyncCall = cancelAsyncCallRef.current;
        cancelAsyncCall();
        cancelAsyncCallRef.current = undefined;
      }
    },
    []
  );

  return [result, call, isPending, { cancel: cancelRef.current, reset: resetRef.current }];
}

export type UseDebouncedAsyncCallOptions<R, T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => Promise<R>;
  init: R | (() => R);
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}>;

export type UseDebouncedAsyncCallResult<R, T extends readonly unknown[]> = [
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
 * useDebouncedAsyncCall debounces asynchronous function calls.
 * When the given function is invoked after timeout and it is fulfilled, the result will be set to
 * the state.
 */
export function useDebouncedAsyncCall<R, T extends readonly unknown[]>(
  options: UseDebouncedAsyncCallOptions<R, T>
): UseDebouncedAsyncCallResult<R, T> {
  const [result, call, isPending, { cancel: cancelCall, reset: resetCall }] = useAsyncCall({
    func: options.func,
    init: options.init,
  });
  const [
    ,
    debouncedCall,
    isWaiting,
    { cancel: cancelDebounce, reset: resetDebounce, flush },
  ] = useDebouncedCall({
    func: call,
    init: undefined,
    wait: options.wait,
    maxWait: options.maxWait,
    leading: options.leading,
    trailing: options.trailing,
  });
  // NOTE: cancel / reset functions are all stable
  const cancelRef = useRef((): void => {
    cancelDebounce();
    cancelCall();
  });
  const resetRef = useRef((result: R): void => {
    resetDebounce();
    resetCall(result);
  });
  return [
    result,
    debouncedCall,
    isWaiting || isPending,
    { cancel: cancelRef.current, reset: resetRef.current, flush },
  ];
}
