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
    const [state1, setState, isWaiting1] = t.result.current;
    expect(state1).toBe("");
    expect(isWaiting1).toBe(false);

    act(() => {
      setState("foo");
    });
    const [state2, , isWaiting2] = t.result.current;
    expect(state2).toBe("");
    expect(isWaiting2).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("bar");
    });
    const [state3, , isWaiting3] = t.result.current;
    expect(state3).toBe("");
    expect(isWaiting3).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("baz");
    });
    const [state4, , isWaiting4] = t.result.current;
    expect(state4).toBe("");
    expect(isWaiting4).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [state5, , isWaiting5] = t.result.current;
    expect(state5).toBe("");
    expect(isWaiting5).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [state6, , isWaiting6] = t.result.current;
    expect(state6).toBe("baz");
    expect(isWaiting6).toBe(false);
  });

  it("should update the state on the leading edge of timeout if leading = true is specified", () => {
    const t = renderHook(() =>
      useDebouncedState({
        init: "",
        wait: 1000,
        leading: true,
      })
    );
    const [state1, setState, isWaiting1] = t.result.current;
    expect(state1).toBe("");
    expect(isWaiting1).toBe(false);

    act(() => {
      setState("foo");
    });
    const [state2, , isWaiting2] = t.result.current;
    expect(state2).toBe("foo");
    expect(isWaiting2).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("bar");
    });
    const [state3, , isWaiting3] = t.result.current;
    expect(state3).toBe("foo");
    expect(isWaiting3).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("baz");
    });
    const [state4, , isWaiting4] = t.result.current;
    expect(state4).toBe("foo");
    expect(isWaiting4).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [state5, , isWaiting5] = t.result.current;
    expect(state5).toBe("foo");
    expect(isWaiting5).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [state6, , isWaiting6] = t.result.current;
    expect(state6).toBe("baz");
    expect(isWaiting6).toBe(false);
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
    const [state1, setState, isWaiting1] = t.result.current;
    expect(state1).toBe("");
    expect(isWaiting1).toBe(false);

    act(() => {
      setState("foo");
    });
    const [state2, , isWaiting2] = t.result.current;
    expect(state2).toBe("foo");
    expect(isWaiting2).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("bar");
    });
    const [state3, , isWaiting3] = t.result.current;
    expect(state3).toBe("foo");
    expect(isWaiting3).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      setState("baz");
    });
    const [state4, , isWaiting4] = t.result.current;
    expect(state4).toBe("foo");
    expect(isWaiting4).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [state5, , isWaiting5] = t.result.current;
    expect(state5).toBe("foo");
    expect(isWaiting5).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [state6, , isWaiting6] = t.result.current;
    expect(state6).toBe("foo");
    expect(isWaiting6).toBe(false);
  });

  it("should correctly reset waiting state when leading = true and setState is invoked only once", () => {
    const t = renderHook(() =>
      useDebouncedState({
        init: "",
        wait: 1000,
        leading: true,
      })
    );
    const [state1, setState, isWaiting1] = t.result.current;
    expect(state1).toBe("");
    expect(isWaiting1).toBe(false);

    act(() => {
      setState("foo");
    });
    const [state2, , isWaiting2] = t.result.current;
    expect(state2).toBe("foo");
    expect(isWaiting2).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    const [state3, , isWaiting3] = t.result.current;
    expect(state3).toBe("foo");
    expect(isWaiting3).toBe(false);
  });

  describe("cancel", () => {
    it("should cancel the waiting state update", () => {
      const t = renderHook(() =>
        useDebouncedState({
          init: "",
          wait: 1000,
        })
      );
      const [state1, setState, isWaiting1, cancel] = t.result.current;
      expect(state1).toBe("");
      expect(isWaiting1).toBe(false);

      act(() => {
        setState("foo");
      });
      const [state2, , isWaiting2] = t.result.current;
      expect(state2).toBe("");
      expect(isWaiting2).toBe(true);

      act(() => {
        cancel();
      });
      const [state3, , isWaiting3] = t.result.current;
      expect(state3).toBe("");
      expect(isWaiting3).toBe(false);
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
      const [state1, setState, isWaiting1, , flush] = t.result.current;
      expect(state1).toBe("");
      expect(isWaiting1).toBe(false);

      act(() => {
        setState("foo");
      });
      const [state2, , isWaiting2] = t.result.current;
      expect(state2).toBe("");
      expect(isWaiting2).toBe(true);

      act(() => {
        flush();
      });
      const [state3, , isWaiting3] = t.result.current;
      expect(state3).toBe("foo");
      expect(isWaiting3).toBe(false);
    });
  });
});
