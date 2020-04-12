import { useRef, useState } from "react";
import { useDebouncedPrim } from "./prim";

type UseDebouncedCallOptions<R, T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => R;
  init: R | (() => R);
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}>;

export function useDebouncedCall<R, T extends readonly unknown[]>(
  options: UseDebouncedCallOptions<R, T>
): [R, (...args: T) => void, boolean, () => void, () => void] {
  const funcRef = useRef(options.func);
  funcRef.current = options.func;
  const leadingRef = useRef(options.leading ?? false);
  const trailingRef = useRef(options.trailing ?? true);

  const [result, setResult] = useState<R>(options.init);
  const [isWaiting, setIsWaiting] = useState(false);

  const [debouncedCall, cancel, flush] = useDebouncedPrim<T>({
    leadingCallback: args => {
      if (leadingRef.current) {
        const func = funcRef.current;
        setResult(func(...args));
      }
      setIsWaiting(true);
    },
    trailingCallback: (args, count) => {
      if (trailingRef.current && !(leadingRef.current && count === 1)) {
        const func = funcRef.current;
        setResult(func(...args));
      }
      setIsWaiting(false);
    },
    cancelCallback: () => {
      setIsWaiting(false);
    },
    wait: options.wait,
    maxWait: options.maxWait,
  });

  return [result, debouncedCall, isWaiting, cancel, flush];
}
