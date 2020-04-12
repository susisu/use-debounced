import { useRef, useEffect } from "react";

type UseDebouncedPrimOptions<T> = Readonly<{
  triggerCallback: () => void;
  leadingCallback: (args: T) => void;
  trailingCallback: (args: T, count: number) => void;
  cancelCallback: () => void;
  wait: number;
  maxWait?: number;
}>;

type DebouncedPrimState<T> =
  | Readonly<{ type: "standby" }>
  | Readonly<{
      type: "waiting";
      timerId: number;
      maxWaitTimerId: number | undefined;
      args: T;
      count: number;
    }>;

export function useDebouncedPrim<T extends readonly unknown[]>(
  options: UseDebouncedPrimOptions<T>
): [(...args: T) => void, () => void, () => void] {
  const triggerCallbackRef = useRef(options.triggerCallback);
  triggerCallbackRef.current = options.triggerCallback;
  const leadingCallbackRef = useRef(options.leadingCallback);
  leadingCallbackRef.current = options.leadingCallback;
  const trailingCallbackRef = useRef(options.trailingCallback);
  trailingCallbackRef.current = options.trailingCallback;
  const cancelCallbackRef = useRef(options.cancelCallback);
  cancelCallbackRef.current = options.cancelCallback;
  const waitRef = useRef(options.wait);
  const maxWaitRef = useRef(options.maxWait);

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
    const triggerCallback = triggerCallbackRef.current;
    triggerCallback();
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
        const cancelCallback = cancelCallbackRef.current;
        cancelCallback();
        break;
      }
    }
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

  return [triggerRef.current, cancelRef.current, flushRef.current];
}
