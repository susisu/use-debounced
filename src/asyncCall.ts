import { useRef, useEffect, useReducer, Reducer } from "react";
import { attachActions, CancelFunc } from "@susisu/promise-utils";
import { useDebouncedPrim } from "./prim";

export type UseDebouncedAsyncCallOptions<R, T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => Promise<R>;
  init: R | (() => R);
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
  shouldCall?: (prevArgs: T, args: T) => boolean;
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

type State<R> =
  | Readonly<{ type: "standby"; result: R }>
  | Readonly<{ type: "waiting"; result: R }>
  | Readonly<{ type: "pending"; result: R }>
  | Readonly<{ type: "waiting-pending"; result: R }>;

type Action<R> =
  | Readonly<{ type: "trigger" }>
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

// eslint-disable-next-line consistent-return
const handleTrigger = <R>(state: State<R>): State<R> => {
  // eslint-disable-next-line default-case
  switch (state.type) {
    case "standby":
      return { type: "waiting", result: state.result };
    case "waiting":
      return state;
    case "pending":
      return { type: "waiting-pending", result: state.result };
    case "waiting-pending":
      return state;
  }
};

// eslint-disable-next-line consistent-return
const handleLeadingCall = <R>(state: State<R>, skip: boolean): State<R> => {
  // eslint-disable-next-line default-case
  switch (state.type) {
    case "waiting":
      return skip ? state : { type: "waiting-pending", result: state.result };
    case "waiting-pending":
      return state;
    case "standby":
    case "pending":
      throw new Error(`unexpected state: ${state.type}`);
  }
};

// eslint-disable-next-line consistent-return
const handleTrailingCall = <R>(state: State<R>, skip: boolean): State<R> => {
  // eslint-disable-next-line default-case
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
  }
};

// eslint-disable-next-line consistent-return
const handleFulfill = <R>(state: State<R>, result: R): State<R> => {
  // eslint-disable-next-line default-case
  switch (state.type) {
    case "pending":
      return { type: "standby", result };
    case "waiting-pending":
      return { type: "waiting", result };
    case "standby":
    case "waiting":
      throw new Error(`unexpected state: ${state.type}`);
  }
};

// eslint-disable-next-line consistent-return
const handleReject = <R>(state: State<R>): State<R> => {
  // eslint-disable-next-line default-case
  switch (state.type) {
    case "pending":
      return { type: "standby", result: state.result };
    case "waiting-pending":
      return { type: "waiting", result: state.result };
    case "standby":
    case "waiting":
      throw new Error(`unexpected state: ${state.type}`);
  }
};

// eslint-disable-next-line consistent-return
const handleCancel = <R>(state: State<R>): State<R> => {
  // eslint-disable-next-line default-case
  switch (state.type) {
    case "standby":
      return state;
    case "waiting":
    case "pending":
    case "waiting-pending":
      return { type: "standby", result: state.result };
  }
};

// eslint-disable-next-line consistent-return
const handleReset = <R>(state: State<R>, result: R): State<R> => {
  // eslint-disable-next-line default-case
  switch (state.type) {
    // assuming it has already been cancelled
    case "standby":
      return state.result === result ? state : { type: "standby", result };
    case "waiting":
    case "pending":
    case "waiting-pending":
      throw new Error(`unexpected state: ${state.type}`);
  }
};

// eslint-disable-next-line consistent-return
const reducer = <R>(state: State<R>, action: Action<R>): State<R> => {
  // eslint-disable-next-line default-case
  switch (action.type) {
    case "trigger":
      return handleTrigger(state);
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
  }
};

/**
 * useDebouncedAsyncCall debounces asynchronous function calls.
 * When the given function is invoked after timeout and it is fulfilled, the result will be set to
 * the state.
 */
export function useDebouncedAsyncCall<R, T extends readonly unknown[]>(
  options: UseDebouncedAsyncCallOptions<R, T>
): UseDebouncedAsyncCallResult<R, T> {
  const funcRef = useRef(options.func);
  const leadingRef = useRef(options.leading ?? false);
  const trailingRef = useRef(options.trailing ?? true);
  const shouldCallRef = useRef(options.shouldCall);

  useEffect(() => {
    funcRef.current = options.func;
    shouldCallRef.current = options.shouldCall;
  }, [options.func, options.shouldCall]);

  const [state, dispatch] = useReducer<Reducer<State<R>, Action<R>>, R | (() => R)>(
    reducer,
    options.init,
    initializer
  );

  const prevArgsRef = useRef<T | undefined>(undefined);
  const testShouldCallRef = useRef((args: T): boolean => {
    const shouldCall = shouldCallRef.current;
    const prevArgs = prevArgsRef.current;
    return shouldCall && prevArgs ? shouldCall(prevArgs, args) : true;
  });
  const cancelAsyncCallRef = useRef<CancelFunc | undefined>(undefined);
  const callRef = useRef((args: T): void => {
    if (cancelAsyncCallRef.current) {
      const cancelAsyncCall = cancelAsyncCallRef.current;
      cancelAsyncCall();
      cancelAsyncCallRef.current = undefined;
    }
    const func = funcRef.current;
    [cancelAsyncCallRef.current] = attachActions(
      func(...args),
      result => {
        cancelAsyncCallRef.current = undefined;
        dispatch({ type: "fulfill", result });
      },
      err => {
        // eslint-disable-next-line no-console
        console.error(err);
        cancelAsyncCallRef.current = undefined;
        prevArgsRef.current = undefined;
        dispatch({ type: "reject" });
      }
    );
    prevArgsRef.current = args;
  });

  const { trigger: debouncedCall, cancel, flush } = useDebouncedPrim<T>({
    triggerCallback: () => {
      dispatch({ type: "trigger" });
    },
    leadingCallback: args => {
      const testShouldCall = testShouldCallRef.current;
      if (leadingRef.current && testShouldCall(args)) {
        const call = callRef.current;
        call(args);
        dispatch({ type: "leadingCall", skip: false });
      } else {
        dispatch({ type: "leadingCall", skip: true });
      }
    },
    trailingCallback: (args, count) => {
      const testShouldCall = testShouldCallRef.current;
      if (trailingRef.current && !(leadingRef.current && count === 1) && testShouldCall(args)) {
        const call = callRef.current;
        call(args);
        dispatch({ type: "trailingCall", skip: false });
      } else {
        dispatch({ type: "trailingCall", skip: true });
      }
    },
    cancelCallback: () => {
      if (cancelAsyncCallRef.current) {
        const cancelAsyncCall = cancelAsyncCallRef.current;
        cancelAsyncCall();
        cancelAsyncCallRef.current = undefined;
        prevArgsRef.current = undefined;
      }
      dispatch({ type: "cancel" });
    },
    wait: options.wait,
    maxWait: options.maxWait,
  });

  const resetRef = useRef((result: R): void => {
    cancel();
    prevArgsRef.current = undefined;
    dispatch({ type: "reset", result });
  });

  useEffect(
    () => () => {
      if (cancelAsyncCallRef.current) {
        const cancelAsyncCall = cancelAsyncCallRef.current;
        cancelAsyncCall();
        cancelAsyncCallRef.current = undefined;
        prevArgsRef.current = undefined;
      }
    },
    []
  );

  const result = state.result;
  const isWaiting = state.type !== "standby"; // actually isWaitingOrPending
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
