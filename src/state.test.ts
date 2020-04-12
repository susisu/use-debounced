import { renderHook, act } from "@testing-library/react-hooks";
import { useDebouncedState } from "./state";

describe("useDebouncedState", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should always return the identical functions", () => {
    const t = renderHook(() =>
      useDebouncedState({
        init: "",
        wait: 1000,
      })
    );
    const [, setState1, , cancel1, flush1] = t.result.current;

    t.rerender();
    const [, setState2, , cancel2, flush2] = t.result.current;
    expect(setState2).toBe(setState1);
    expect(cancel2).toBe(cancel1);
    expect(flush2).toBe(flush1);
  });

  it("should initialize the state with the given value", () => {
    const t = renderHook(() =>
      useDebouncedState({
        init: "",
        wait: 1000,
      })
    );
    const [state] = t.result.current;
    expect(state).toBe("");
  });

  it("should initialize the state using the given function", () => {
    const init = jest.fn<string, []>(() => "");
    const t = renderHook(() =>
      useDebouncedState({
        init,
        wait: 1000,
      })
    );
    const [state] = t.result.current;
    expect(init).toHaveBeenCalled();
    expect(state).toBe("");
  });

  it("should debounce state update", () => {
    const t = renderHook(() =>
      useDebouncedState({
        init: "",
        wait: 1000,
      })
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
    const t = renderHook(() =>
      useDebouncedState({
        init: "",
        wait: 1000,
        leading: true,
      })
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
    const t = renderHook(() =>
      useDebouncedState({
        init: "",
        wait: 1000,
        leading: true,
        trailing: false,
      })
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
    const t = renderHook(() =>
      useDebouncedState({
        init: "",
        wait: 1000,
        leading: true,
      })
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
      const t = renderHook(() =>
        useDebouncedState({
          init: "",
          wait: 1000,
        })
      );
      const [, setState, , cancel] = t.result.current;
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
      const t = renderHook(() =>
        useDebouncedState({
          init: "",
          wait: 1000,
        })
      );
      const [, setState, , , reset] = t.result.current;
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
      const t = renderHook(() =>
        useDebouncedState({
          init: "",
          wait: 1000,
        })
      );
      const [, setState, , , , flush] = t.result.current;
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
