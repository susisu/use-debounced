import { attachActions } from "@susisu/promise-utils";
import { Reducer, useCallback, useReducer, useRef } from "react";
import { usePrimitiveDebounce } from "./primitive";
import { unreachable } from "./utils";

export type UseDebouncedAsyncCallOptions<T extends readonly unknown[], R> = Readonly<{
  func: (args: T, options: UseDebouncedAsyncCallFuncOptions) => Promise<R>;
  init: R | (() => R);
  wait: number;
  maxWait?: number | undefined;
  leading?: boolean | undefined;
  trailing?: boolean | undefined;
}>;

export type UseDebouncedAsyncCallFuncOptions = Readonly<{
  signal: AbortSignal;
}>;

export type UseDebouncedAsyncCallResult<T extends readonly unknown[], R> = [
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
 * - "standby" = waiting for call; nothing is going on
 * - "waiting" = waiting for debounce timeout
 * - "pending" = waiting for promise to be fulfilled or rejected
 * - "waiting-pending" = waiting for both debounce timeout and promise
 */
type State<R> =
  | Readonly<{ type: "standby"; result: R }>
  | Readonly<{ type: "waiting"; result: R }>
  | Readonly<{ type: "pending"; result: R }>
  | Readonly<{ type: "waiting-pending"; result: R }>;

type Action<R> =
  | Readonly<{ type: "start" }>
  | Readonly<{ type: "leadingCall"; skip: boolean }>
  | Readonly<{ type: "trailingCall"; skip: boolean }>
  | Readonly<{ type: "fulfill"; result: R }>
  | Readonly<{ type: "reject" }>
  | Readonly<{ type: "cancel" }>
  | Readonly<{ type: "reset"; result: R }>;

const initializer = <R>(init: R | (() => R)): State<R> => {
  if (typeof init === "function") {
    const initFunc = init as () => R;
    return { type: "standby", result: initFunc() };
  } else {
    return { type: "standby", result: init };
  }
};

const handleStart = <R>(state: State<R>): State<R> => {
  switch (state.type) {
    case "standby":
      return { type: "waiting", result: state.result };
    case "pending":
      return { type: "waiting-pending", result: state.result };
    case "waiting":
    case "waiting-pending":
      throw new Error(`unexpected state: ${state.type}`);
    default:
      return unreachable(state);
  }
};

const handleLeadingCall = <R>(state: State<R>, skip: boolean): State<R> => {
  switch (state.type) {
    case "waiting":
      return skip ? state : { type: "waiting-pending", result: state.result };
    case "waiting-pending":
      return state;
    case "standby":
    case "pending":
      throw new Error(`unexpected state: ${state.type}`);
    default:
      return unreachable(state);
  }
};

const handleTrailingCall = <R>(state: State<R>, skip: boolean): State<R> => {
  switch (state.type) {
    case "waiting":
      return skip
        ? { type: "standby", result: state.result }
        : { type: "pending", result: state.result };
    case "waiting-pending":
      return { type: "pending", result: state.result };
    case "standby":
    case "pending":
      throw new Error(`unexpected state: ${state.type}`);
    default:
      return unreachable(state);
  }
};

const handleFulfill = <R>(state: State<R>, result: R): State<R> => {
  switch (state.type) {
    case "pending":
      return { type: "standby", result };
    case "waiting-pending":
      return { type: "waiting", result };
    case "standby":
    case "waiting":
      throw new Error(`unexpected state: ${state.type}`);
    default:
      return unreachable(state);
  }
};

const handleReject = <R>(state: State<R>): State<R> => {
  switch (state.type) {
    case "pending":
      return { type: "standby", result: state.result };
    case "waiting-pending":
      return { type: "waiting", result: state.result };
    case "standby":
    case "waiting":
      throw new Error(`unexpected state: ${state.type}`);
    default:
      return unreachable(state);
  }
};

const handleCancel = <R>(state: State<R>): State<R> => {
  switch (state.type) {
    case "standby":
      return state;
    case "waiting":
    case "pending":
    case "waiting-pending":
      return { type: "standby", result: state.result };
    default:
      return unreachable(state);
  }
};

const handleReset = <R>(state: State<R>, result: R): State<R> => {
  switch (state.type) {
    // assuming it has already been cancelled
    case "standby":
      return state.result === result ? state : { type: "standby", result };
    case "waiting":
    case "pending":
    case "waiting-pending":
      throw new Error(`unexpected state: ${state.type}`);
    default:
      return unreachable(state);
  }
};

const reducer = <R>(state: State<R>, action: Action<R>): State<R> => {
  switch (action.type) {
    case "start":
      return handleStart(state);
    case "leadingCall":
      return handleLeadingCall(state, action.skip);
    case "trailingCall":
      return handleTrailingCall(state, action.skip);
    case "fulfill":
      return handleFulfill(state, action.result);
    case "reject":
      return handleReject(state);
    case "cancel":
      return handleCancel(state);
    case "reset":
      return handleReset(state, action.result);
    default:
      return unreachable(action);
  }
};

/**
 * useDebouncedAsyncCall debounces asynchronous function calls.
 * When the given function is invoked after timeout and it is fulfilled, the result will be set to
 * the state.
 */
export function useDebouncedAsyncCall<T extends readonly unknown[], R>(
  options: UseDebouncedAsyncCallOptions<T, R>
): UseDebouncedAsyncCallResult<T, R> {
  const [state, dispatch] = useReducer<Reducer<State<R>, Action<R>>, R | (() => R)>(
    reducer,
    options.init,
    initializer
  );

  const cancelAsyncCallRef = useRef<(() => void) | undefined>(undefined);
  const call = useCallback(
    (args: T): void => {
      if (cancelAsyncCallRef.current) {
        const cancelAsyncCall = cancelAsyncCallRef.current;
        cancelAsyncCall();
        cancelAsyncCallRef.current = undefined;
      }
      const func = options.func;
      const controller = new AbortController();
      const [cancelPromise] = attachActions(
        func(args, { signal: controller.signal }),
        result => {
          cancelAsyncCallRef.current = undefined;
          dispatch({ type: "fulfill", result });
        },
        err => {
          // eslint-disable-next-line no-console
          console.error(err);
          cancelAsyncCallRef.current = undefined;
          dispatch({ type: "reject" });
        }
      );
      cancelAsyncCallRef.current = () => {
        cancelPromise();
        controller.abort();
      };
    },
    [options.func]
  );

  const debounce = usePrimitiveDebounce<T>({
    leadingCallback: useCallback(
      (args, active) => {
        dispatch({ type: "start" });
        if (active) {
          dispatch({ type: "leadingCall", skip: false });
          call(args);
        } else {
          dispatch({ type: "leadingCall", skip: true });
        }
      },
      [call]
    ),
    trailingCallback: useCallback(
      (args, active) => {
        if (active) {
          dispatch({ type: "trailingCall", skip: false });
          call(args);
        } else {
          dispatch({ type: "trailingCall", skip: true });
        }
      },
      [call]
    ),
    cancelCallback: useCallback(() => {
      if (cancelAsyncCallRef.current) {
        const cancelAsyncCall = cancelAsyncCallRef.current;
        cancelAsyncCall();
        cancelAsyncCallRef.current = undefined;
      }
      dispatch({ type: "cancel" });
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
      dispatch({ type: "reset", result });
    },
    [debounce]
  );

  const flush = useCallback(() => {
    debounce.flush();
  }, [debounce]);

  const result = state.result;
  const isWaitingOrPending = state.type !== "standby";

  return [result, trigger, isWaitingOrPending, { cancel, reset, flush }];
}
