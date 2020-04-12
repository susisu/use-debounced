import { renderHook, act } from "@testing-library/react-hooks";
import { useDebouncedCall } from "./call";

describe("useDebouncedCall", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should always return the identical functions", () => {
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "foo",
        wait: 1000,
      })
    );
    const [, call1, , cancel1, flush1] = t.result.current;

    t.rerender();
    const [, call2, , cancel2, flush2] = t.result.current;
    expect(call2).toBe(call1);
    expect(cancel2).toBe(cancel1);
    expect(flush2).toBe(flush1);
  });

  it("should initialize the result with the given value", () => {
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "",
        wait: 1000,
      })
    );
    const [res] = t.result.current;
    expect(res).toBe("");
  });

  it("should initialize the result using the given function", () => {
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const init = jest.fn<string, []>(() => "");
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init,
        wait: 1000,
      })
    );
    const [res] = t.result.current;
    expect(init).toHaveBeenCalled();
    expect(res).toBe("");
  });

  it("should debounce function call", () => {
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "",
        wait: 1000,
      })
    );
    const [res1, call, isWaiting1] = t.result.current;
    expect(res1).toBe("");
    expect(isWaiting1).toBe(false);

    act(() => {
      call("foo");
    });
    const [res2, , isWaiting2] = t.result.current;
    expect(res2).toBe("");
    expect(isWaiting2).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("bar");
    });
    const [res3, , isWaiting3] = t.result.current;
    expect(res3).toBe("");
    expect(isWaiting3).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("baz");
    });
    const [res4, , isWaiting4] = t.result.current;
    expect(res4).toBe("");
    expect(isWaiting4).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [res5, , isWaiting5] = t.result.current;
    expect(res5).toBe("");
    expect(isWaiting5).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [res6, , isWaiting6] = t.result.current;
    expect(res6).toBe("BAZ");
    expect(isWaiting6).toBe(false);
  });

  it("should call the function on the leading edge of timeout if leading = true is specified", () => {
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "",
        wait: 1000,
        leading: true,
      })
    );
    const [res1, call, isWaiting1] = t.result.current;
    expect(res1).toBe("");
    expect(isWaiting1).toBe(false);

    act(() => {
      call("foo");
    });
    const [res2, , isWaiting2] = t.result.current;
    expect(res2).toBe("FOO");
    expect(isWaiting2).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("bar");
    });
    const [res3, , isWaiting3] = t.result.current;
    expect(res3).toBe("FOO");
    expect(isWaiting3).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("baz");
    });
    const [res4, , isWaiting4] = t.result.current;
    expect(res4).toBe("FOO");
    expect(isWaiting4).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [res5, , isWaiting5] = t.result.current;
    expect(res5).toBe("FOO");
    expect(isWaiting5).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [res6, , isWaiting6] = t.result.current;
    expect(res6).toBe("BAZ");
    expect(isWaiting6).toBe(false);
  });

  it("should not call the function on the trailing edge of timeout if trailing = false is specified", () => {
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "",
        wait: 1000,
        leading: true,
        trailing: false,
      })
    );
    const [res1, call, isWaiting1] = t.result.current;
    expect(res1).toBe("");
    expect(isWaiting1).toBe(false);

    act(() => {
      call("foo");
    });
    const [res2, , isWaiting2] = t.result.current;
    expect(res2).toBe("FOO");
    expect(isWaiting2).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("bar");
    });
    const [res3, , isWaiting3] = t.result.current;
    expect(res3).toBe("FOO");
    expect(isWaiting3).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("baz");
    });
    const [res4, , isWaiting4] = t.result.current;
    expect(res4).toBe("FOO");
    expect(isWaiting4).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [res5, , isWaiting5] = t.result.current;
    expect(res5).toBe("FOO");
    expect(isWaiting5).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const [res6, , isWaiting6] = t.result.current;
    expect(res6).toBe("FOO");
    expect(isWaiting6).toBe(false);
  });

  it("should correctly reset waiting state when leading = true and call is invoked only once", () => {
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "",
        wait: 1000,
        leading: true,
      })
    );
    const [res1, call, isWaiting1] = t.result.current;
    expect(res1).toBe("");
    expect(isWaiting1).toBe(false);

    act(() => {
      call("foo");
    });
    const [res2, , isWaiting2] = t.result.current;
    expect(res2).toBe("FOO");
    expect(isWaiting2).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    const [res3, , isWaiting3] = t.result.current;
    expect(res3).toBe("FOO");
    expect(isWaiting3).toBe(false);
  });

  describe("cancel", () => {
    it("should cancel the waiting function call", () => {
      const func = jest.fn<string, [string]>(str => str.toUpperCase());
      const t = renderHook(() =>
        useDebouncedCall({
          func,
          init: "",
          wait: 1000,
        })
      );
      const [res1, call, isWaiting1, cancel] = t.result.current;
      expect(res1).toBe("");
      expect(isWaiting1).toBe(false);

      act(() => {
        call("foo");
      });
      const [res2, , isWaiting2] = t.result.current;
      expect(res2).toBe("");
      expect(isWaiting2).toBe(true);

      act(() => {
        cancel();
      });
      const [res3, , isWaiting3] = t.result.current;
      expect(res3).toBe("");
      expect(isWaiting3).toBe(false);
    });
  });

  describe("flush", () => {
    it("should flush the waiting function call", () => {
      const func = jest.fn<string, [string]>(str => str.toUpperCase());
      const t = renderHook(() =>
        useDebouncedCall({
          func,
          init: "",
          wait: 1000,
        })
      );
      const [res1, call, isWaiting1, , flush] = t.result.current;
      expect(res1).toBe("");
      expect(isWaiting1).toBe(false);

      act(() => {
        call("foo");
      });
      const [res2, , isWaiting2] = t.result.current;
      expect(res2).toBe("");
      expect(isWaiting2).toBe(true);

      act(() => {
        flush();
      });
      const [res3, , isWaiting3] = t.result.current;
      expect(res3).toBe("FOO");
      expect(isWaiting3).toBe(false);
    });
  });
});
