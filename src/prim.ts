import { useRef, useEffect } from "react";

export type UseDebouncedPrimOptions<T> = Readonly<{
  leadingCallback: (args: T) => void;
  trailingCallback: (args: T, count: number) => void;
  cancelCallback: () => void;
  wait: number;
  maxWait?: number;
}>;

export type UseDebouncedPrimResult<T extends readonly unknown[]> = {
  trigger: (...args: T) => void;
  cancel: () => void;
  flush: () => void;
};

// NOTE: setTimeout and clearTimeout have different interfaces for browsers and Node.js
type TimerId = {};
declare function setTimeout(callback: () => void, ms: number): TimerId;
declare function clearTimeout(timerId: TimerId): void;

type DebouncedPrimState<T> =
  | Readonly<{ type: "standby" }>
  | Readonly<{
      type: "waiting";
      timerId: TimerId;
      maxWaitTimerId: TimerId | undefined;
      args: T;
      count: number;
    }>;

/**
 * useDebouncedPrim is a primitive hook that provides fundamental features of debouncing.
 * The user can pass callbacks that are invoked on trigger, leading and trailing edge of timeout,
 * and cancel, to update component state or do some other actions on each timing.
 */
export function useDebouncedPrim<T extends readonly unknown[]>(
  options: UseDebouncedPrimOptions<T>
): UseDebouncedPrimResult<T> {
  const leadingCallbackRef = useRef(options.leadingCallback);
  const trailingCallbackRef = useRef(options.trailingCallback);
  const cancelCallbackRef = useRef(options.cancelCallback);
  const waitRef = useRef(options.wait);
  const maxWaitRef = useRef(options.maxWait);

  useEffect(() => {
    leadingCallbackRef.current = options.leadingCallback;
    trailingCallbackRef.current = options.trailingCallback;
    cancelCallbackRef.current = options.cancelCallback;
  }, [options.leadingCallback, options.trailingCallback, options.cancelCallback]);

  const isUnmountedRef = useRef<boolean>(false);

  const stateRef = useRef<DebouncedPrimState<T>>({ type: "standby" });

  const flushRef = useRef((): void => {
    if (isUnmountedRef.current) {
      return;
    }
    // eslint-disable-next-line default-case
    switch (stateRef.current.type) {
      case "standby":
        break;
      case "waiting": {
        const { timerId, maxWaitTimerId, args, count } = stateRef.current;
        clearTimeout(timerId);
        if (maxWaitTimerId !== undefined) {
          clearTimeout(maxWaitTimerId);
        }
        stateRef.current = { type: "standby" };
        const trailingCallback = trailingCallbackRef.current;
        trailingCallback(args, count);
        break;
      }
    }
  });

  const triggerRef = useRef((...args: T): void => {
    if (isUnmountedRef.current) {
      return;
    }
    // eslint-disable-next-line default-case
    switch (stateRef.current.type) {
      case "standby": {
        const timerId = setTimeout(flushRef.current, waitRef.current);
        const maxWaitTimerId =
          maxWaitRef.current !== undefined
            ? setTimeout(flushRef.current, maxWaitRef.current)
            : undefined;
        stateRef.current = { type: "waiting", timerId, maxWaitTimerId, args, count: 1 };
        const leadingCallback = leadingCallbackRef.current;
        leadingCallback(args);
        break;
      }
      case "waiting": {
        const { timerId: oldTimerId, maxWaitTimerId, count } = stateRef.current;
        clearTimeout(oldTimerId);
        const timerId = setTimeout(flushRef.current, waitRef.current);
        stateRef.current = { type: "waiting", timerId, maxWaitTimerId, args, count: count + 1 };
        break;
      }
    }
  });

  const cancelRef = useRef((): void => {
    if (isUnmountedRef.current) {
      return;
    }
    // eslint-disable-next-line default-case
    switch (stateRef.current.type) {
      case "standby":
        break;
      case "waiting": {
        const { timerId, maxWaitTimerId } = stateRef.current;
        clearTimeout(timerId);
        if (maxWaitTimerId !== undefined) {
          clearTimeout(maxWaitTimerId);
        }
        stateRef.current = { type: "standby" };
        break;
      }
    }
    const cancelCallback = cancelCallbackRef.current;
    cancelCallback();
  });

  useEffect(
    () => () => {
      isUnmountedRef.current = true;
      // eslint-disable-next-line default-case
      switch (stateRef.current.type) {
        case "standby":
          break;
        case "waiting": {
          const { timerId, maxWaitTimerId } = stateRef.current;
          clearTimeout(timerId);
          if (maxWaitTimerId !== undefined) {
            clearTimeout(maxWaitTimerId);
          }
          break;
        }
      }
    },
    []
  );

  return {
    trigger: triggerRef.current,
    cancel: cancelRef.current,
    flush: flushRef.current,
  };
}
