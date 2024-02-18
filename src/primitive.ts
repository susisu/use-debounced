import { Debounce } from "@susisu/primitive-debounce";
import { useEffect, useRef, useState } from "react";

export type UseDebouncedPrimOptions<T> = Readonly<{
  leadingCallback: (args: T, active: boolean) => void;
  trailingCallback: (args: T, active: boolean) => void;
  cancelCallback: () => void;
  wait: number;
  maxWait?: number | undefined;
  leading?: boolean | undefined;
  trailing?: boolean | undefined;
}>;

export function usePrimitiveDebounce<T extends readonly unknown[]>(
  options: UseDebouncedPrimOptions<T>,
): Debounce<T> {
  const leadingCallbackRef = useRef(options.leadingCallback);
  const trailingCallbackRef = useRef(options.trailingCallback);
  const cancelCallbackRef = useRef(options.cancelCallback);

  useEffect(() => {
    leadingCallbackRef.current = options.leadingCallback;
    trailingCallbackRef.current = options.trailingCallback;
    cancelCallbackRef.current = options.cancelCallback;
  }, [options.leadingCallback, options.trailingCallback, options.cancelCallback]);

  const [debounce] = useState<Debounce<T>>(
    () =>
      new Debounce({
        leadingCallback: (args, active) => {
          const leadingCallback = leadingCallbackRef.current;
          leadingCallback(args, active);
        },
        trailingCallback: (args, active) => {
          const trailingCallback = trailingCallbackRef.current;
          trailingCallback(args, active);
        },
        cancelCallback: () => {
          const cancelCallback = cancelCallbackRef.current;
          cancelCallback();
        },
        wait: options.wait,
        maxWait: options.maxWait,
        leading: options.leading ?? false,
        trailing: options.trailing ?? true,
      }),
  );

  useEffect(
    () => () => {
      debounce.cancel();
    },
    [debounce],
  );

  return debounce;
}
