import { act, renderHook } from "@testing-library/react-hooks";
import { StrictMode } from "react";
import { useDebouncedState } from "./state";

describe("useDebouncedState", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should initialize the state with the given value", () => {
    const t = renderHook(
      () =>
        useDebouncedState({
          init: "",
          wait: 1000,
        }),
      { wrapper: StrictMode }
    );
    const [state] = t.result.current;
    expect(state).toBe("");
  });

  it("should initialize the state using the given function", () => {
    const init = jest.fn<string, []>(() => "");
    const t = renderHook(
      () =>
        useDebouncedState({
          init,
          wait: 1000,
        }),
      { wrapper: StrictMode }
    );
    const [state] = t.result.current;
    expect(init).toHaveBeenCalled();
    expect(state).toBe("");
  });

  it("should debounce state update", () => {
    const t = renderHook(
      () =>
        useDebouncedState({
          init: "",
          wait: 1000,
        }),
      { wrapper: StrictMode }
    );
    const [, setState] = t.result.current;
    let [state, , isWaiting] = t.result.current;
    expect(state).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      setState("foo");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("bar");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("baz");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("baz");
    expect(isWaiting).toBe(false);
  });

  it("should update the state on the leading edge of timeout if leading = true is specified", () => {
    const t = renderHook(
      () =>
        useDebouncedState({
          init: "",
          wait: 1000,
          leading: true,
        }),
      { wrapper: StrictMode }
    );
    const [, setState] = t.result.current;
    let [state, , isWaiting] = t.result.current;
    expect(state).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      setState("foo");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("bar");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("baz");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("baz");
    expect(isWaiting).toBe(false);
  });

  it("should not update the state on the trailing edge of timeout if trailing = false is specified", () => {
    const t = renderHook(
      () =>
        useDebouncedState({
          init: "",
          wait: 1000,
          leading: true,
          trailing: false,
        }),
      { wrapper: StrictMode }
    );
    const [, setState] = t.result.current;
    let [state, , isWaiting] = t.result.current;
    expect(state).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      setState("foo");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("bar");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("baz");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(false);
  });

  it("should correctly reset waiting state when leading = true and setState is invoked only once", () => {
    const t = renderHook(
      () =>
        useDebouncedState({
          init: "",
          wait: 1000,
          leading: true,
        }),
      { wrapper: StrictMode }
    );
    const [, setState] = t.result.current;
    let [state, , isWaiting] = t.result.current;
    expect(state).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      setState("foo");
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    [state, , isWaiting] = t.result.current;
    expect(state).toBe("foo");
    expect(isWaiting).toBe(false);
  });

  describe("cancel", () => {
    it("should cancel the waiting state update", () => {
      const t = renderHook(
        () =>
          useDebouncedState({
            init: "",
            wait: 1000,
          }),
        { wrapper: StrictMode }
      );
      const [, setState, , { cancel }] = t.result.current;
      let [state, , isWaiting] = t.result.current;
      expect(state).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        setState("foo");
      });
      [state, , isWaiting] = t.result.current;
      expect(state).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        cancel();
      });
      [state, , isWaiting] = t.result.current;
      expect(state).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      [state, , isWaiting] = t.result.current;
      expect(state).toBe("");
      expect(isWaiting).toBe(false);
    });
  });

  describe("reset", () => {
    it("should cancel the waiting state update and set the given value to the state", () => {
      const t = renderHook(
        () =>
          useDebouncedState({
            init: "",
            wait: 1000,
          }),
        { wrapper: StrictMode }
      );
      const [, setState, , { reset }] = t.result.current;
      let [state, , isWaiting] = t.result.current;
      expect(state).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        setState("foo");
      });
      [state, , isWaiting] = t.result.current;
      expect(state).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        reset("RESET");
      });
      [state, , isWaiting] = t.result.current;
      expect(state).toBe("RESET");
      expect(isWaiting).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      [state, , isWaiting] = t.result.current;
      expect(state).toBe("RESET");
      expect(isWaiting).toBe(false);
    });
  });

  describe("flush", () => {
    it("should flush the waiting state update", () => {
      const t = renderHook(
        () =>
          useDebouncedState({
            init: "",
            wait: 1000,
          }),
        { wrapper: StrictMode }
      );
      const [, setState, , { flush }] = t.result.current;
      let [state, , isWaiting] = t.result.current;
      expect(state).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        setState("foo");
      });
      [state, , isWaiting] = t.result.current;
      expect(state).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        flush();
      });
      [state, , isWaiting] = t.result.current;
      expect(state).toBe("foo");
      expect(isWaiting).toBe(false);
    });
  });
});
