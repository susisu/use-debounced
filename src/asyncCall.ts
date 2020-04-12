import { useRef, useReducer, Reducer, useEffect } from "react";
import { attachActions, CancelFunc } from "@susisu/promise-utils";
import { useDebouncedPrim } from "./prim";

type UseDebouncedAsyncCallOptions<R, T extends readonly unknown[]> = Readonly<{
  func: (...args: T) => Promise<R>;
  init: R | (() => R);
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}>;

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
  | Readonly<{ type: "cancel" }>;

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
  }
};

export function useDebouncedAsyncCall<R, T extends readonly unknown[]>(
  options: UseDebouncedAsyncCallOptions<R, T>
): [R, (...args: T) => void, boolean, () => void, () => void] {
  const funcRef = useRef(options.func);
  funcRef.current = options.func;
  const leadingRef = useRef(options.leading ?? false);
  const trailingRef = useRef(options.trailing ?? true);

  const [state, dispatch] = useReducer<Reducer<State<R>, Action<R>>, R | (() => R)>(
    reducer,
    options.init,
    initializer
  );

  const cancelAsyncCallRef = useRef<CancelFunc | undefined>(undefined);
  const callRef = useRef((args: T): void => {
    if (cancelAsyncCallRef.current) {
      const cancelAsyncCall = cancelAsyncCallRef.current;
      cancelAsyncCall();
    }
    const func = funcRef.current;
    [cancelAsyncCallRef.current] = attachActions(
      func(...args),
      result => {
        dispatch({ type: "fulfill", result });
      },
      () => {
        dispatch({ type: "reject" });
      }
    );
  });

  const [debouncedCall, cancel, flush] = useDebouncedPrim<T>({
    triggerCallback: () => {
      dispatch({ type: "trigger" });
    },
    leadingCallback: args => {
      if (leadingRef.current) {
        const call = callRef.current;
        call(args);
        dispatch({ type: "leadingCall", skip: false });
      } else {
        dispatch({ type: "leadingCall", skip: true });
      }
    },
    trailingCallback: (args, count) => {
      if (trailingRef.current && !(leadingRef.current && count === 1)) {
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
      }
      dispatch({ type: "cancel" });
    },
    wait: options.wait,
    maxWait: options.maxWait,
  });

  useEffect(
    () => () => {
      if (cancelAsyncCallRef.current) {
        const cancelAsyncCall = cancelAsyncCallRef.current;
        cancelAsyncCall();
      }
    },
    []
  );

  const result = state.result;
  const isWaiting = state.type !== "standby";
  return [result, debouncedCall, isWaiting, cancel, flush];
}
