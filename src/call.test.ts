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
        init: "",
        wait: 1000,
      })
    );
    const [, call1, , r1] = t.result.current;

    t.rerender();
    const [, call2, , r2] = t.result.current;
    expect(call2).toBe(call1);
    expect(r2.cancel).toBe(r1.cancel);
    expect(r2.reset).toBe(r1.reset);
    expect(r2.flush).toBe(r1.flush);
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
    expect(init).toHaveBeenCalled();
    const [res] = t.result.current;
    expect(res).toBe("");
  });

  it("should debounce function calls", () => {
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "",
        wait: 1000,
      })
    );
    expect(func).not.toHaveBeenCalled();
    const [, call] = t.result.current;
    let [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      call("foo");
    });
    expect(func).not.toHaveBeenCalled();
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("bar");
    });
    expect(func).not.toHaveBeenCalled();
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("baz");
    });
    expect(func).not.toHaveBeenCalled();
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(func).not.toHaveBeenCalled();
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith("baz");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("BAZ");
    expect(isWaiting).toBe(false);
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
    expect(func).not.toHaveBeenCalled();
    const [, call] = t.result.current;
    let [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      call("foo");
    });
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith("foo");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("bar");
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("baz");
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith("baz");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("BAZ");
    expect(isWaiting).toBe(false);
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
    expect(func).not.toHaveBeenCalled();
    const [, call] = t.result.current;
    let [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      call("foo");
    });
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith("foo");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("bar");
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("baz");
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(false);
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
    expect(func).not.toHaveBeenCalled();
    const [, call] = t.result.current;
    let [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      call("foo");
    });
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith("foo");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(false);
  });

  it("should skip function call if shouldCall returns false", () => {
    const shouldCall = jest.fn<boolean, [[string], [string]]>(
      ([prev], [next]) => prev.toUpperCase() !== next.toUpperCase()
    );
    const func = jest.fn<string, [string]>(str => str.toUpperCase());
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "",
        wait: 1000,
        shouldCall,
      })
    );
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).not.toHaveBeenCalled();
    const [, call] = t.result.current;
    let [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      call("foo");
    });
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).not.toHaveBeenCalled();
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith("foo");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(false);

    act(() => {
      call("FOO");
    });
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(shouldCall).toHaveBeenCalledTimes(1);
    expect(shouldCall).toHaveBeenLastCalledWith(["foo"], ["FOO"]);
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(false);
  });

  it("should be consistent if the debounced call is invoked in the function", () => {
    let call = (_str: string): void => {};
    const func = jest.fn<string, [string]>(str => {
      call("nyancat");
      return str.toUpperCase();
    });
    const t = renderHook(() =>
      useDebouncedCall({
        func,
        init: "",
        wait: 1000,
      })
    );
    expect(func).not.toHaveBeenCalled();
    [, call] = t.result.current;
    let [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      call("foo");
    });
    expect(func).not.toHaveBeenCalled();
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith("foo");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    call = (_str: string): void => {};

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith("nyancat");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("NYANCAT");
    expect(isWaiting).toBe(false);
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
      expect(func).not.toHaveBeenCalled();
      const [, call, , { cancel }] = t.result.current;
      let [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        call("foo");
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        cancel();
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);
    });
  });

  describe("reset", () => {
    it("should cancel the waiting function call and set the given value to the result", () => {
      const func = jest.fn<string, [string]>(str => str.toUpperCase());
      const t = renderHook(() =>
        useDebouncedCall({
          func,
          init: "",
          wait: 1000,
        })
      );
      expect(func).not.toHaveBeenCalled();
      const [, call, , { reset }] = t.result.current;
      let [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        call("foo");
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        reset("RESET");
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("RESET");
      expect(isWaiting).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("RESET");
      expect(isWaiting).toBe(false);
    });

    it("should reset the internal memory to ensure the function is called again even if shouldCall will return false", () => {
      const shouldCall = jest.fn<boolean, [[string], [string]]>(
        ([prev], [next]) => prev.toUpperCase() !== next.toUpperCase()
      );
      const func = jest.fn<string, [string]>(str => str.toUpperCase());
      const t = renderHook(() =>
        useDebouncedCall({
          func,
          init: "",
          wait: 1000,
          shouldCall,
        })
      );
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).not.toHaveBeenCalled();
      const [, call, , { reset }] = t.result.current;
      let [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        call("foo");
      });
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenLastCalledWith("foo");
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(false);

      act(() => {
        reset("RESET");
      });
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("RESET");
      expect(isWaiting).toBe(false);

      act(() => {
        call("FOO");
      });
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("RESET");
      expect(isWaiting).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(2);
      expect(func).toHaveBeenLastCalledWith("FOO");
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(false);
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
      expect(func).not.toHaveBeenCalled();
      const [, call, , { flush }] = t.result.current;
      let [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        call("foo");
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        flush();
      });
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenLastCalledWith("foo");
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(false);
    });
  });
});
