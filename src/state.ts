import { useRef, useState } from "react";
import { useDebouncedPrim } from "./prim";

type UseDebouncedStateOptions<T> = Readonly<{
  init: T | (() => T);
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}>;

export function useDebouncedState<T>(
  options: UseDebouncedStateOptions<T>
): [T, (state: T) => void, boolean, () => void, () => void] {
  const leadingRef = useRef(options.leading ?? false);
  const trailingRef = useRef(options.trailing ?? true);

  const [state, setState] = useState<T>(options.init);
  const [isWaiting, setIsWaiting] = useState(false);

  const [debouncedSetState, cancel, flush] = useDebouncedPrim<readonly [T]>({
    leadingCallback: ([state]) => {
      if (leadingRef.current) {
        setState(state);
      }
      setIsWaiting(true);
    },
    trailingCallback: ([state], count) => {
      if (trailingRef.current && !(leadingRef.current && count === 1)) {
        setState(state);
      }
      setIsWaiting(false);
    },
    cancelCallback: () => {
      setIsWaiting(false);
    },
    wait: options.wait,
    maxWait: options.maxWait,
  });

  return [state, debouncedSetState, isWaiting, cancel, flush];
}
