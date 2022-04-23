import { RejectFunc, ResolveFunc, triplet } from "@susisu/promise-utils";
import { act, waitFor } from "@testing-library/react";
import { strictRenderHook } from "./__tests__/utils";
import { UseDebouncedAsyncCallFuncOptions, useDebouncedAsyncCall } from "./asyncCall";

describe("useDebouncedAsyncCall", () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    spy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    spy.mockRestore();
  });

  const createMockFunc = (): {
    func: jest.Mock<Promise<string>, [[string], UseDebouncedAsyncCallFuncOptions]>;
    resolves: ReadonlyArray<ResolveFunc<string>>;
    rejects: readonly RejectFunc[];
  } => {
    const resolves: Array<ResolveFunc<string>> = [];
    const rejects: RejectFunc[] = [];
    const func = jest.fn<Promise<string>, [[string], UseDebouncedAsyncCallFuncOptions]>(() => {
      const [promise, resolve, reject] = triplet<string>();
      resolves.push(resolve);
      rejects.push(reject);
      return promise;
    });
    return { func, resolves, rejects };
  };

  it("should always return the identical functions", () => {
    const { func } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
    const { func } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
        func,
        init: "",
        wait: 1000,
      })
    );
    const [res] = t.result.current;
    expect(res).toBe("");
  });

  it("should initialize the result using the given function", () => {
    const { func } = createMockFunc();
    const init = jest.fn<string, []>(() => "");
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
        func,
        init,
        wait: 1000,
      })
    );
    expect(init).toHaveBeenCalled();
    const [res] = t.result.current;
    expect(res).toBe("");
  });

  it("should debounce function calls", async () => {
    const { func, resolves } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
    expect(func).toHaveBeenLastCalledWith(["baz"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("BAZ");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("BAZ");
      expect(isWaiting).toBe(false);
    });
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should call the function on the leading edge of timeout if leading = true is specified", async () => {
    const { func, resolves } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
    expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("bar");
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("FOO");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(true);
    });
    expect(func).toHaveBeenCalledTimes(1);

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
    expect(func).toHaveBeenLastCalledWith(["baz"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    resolves[1]("BAZ");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("BAZ");
      expect(isWaiting).toBe(false);
    });
    expect(func).toHaveBeenCalledTimes(2);
  });

  it("should not call the function on the trailing edge of timeout if trailing = false is specified", async () => {
    const { func, resolves } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
    expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
      call("bar");
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("FOO");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(true);
    });
    expect(func).toHaveBeenCalledTimes(1);

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

  it("should reset waiting state when leading = true and call is invoked only once", async () => {
    const { func, resolves } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
    expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("FOO");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(true);
    });
    expect(func).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(false);
  });

  it("should cancel the previous pending function call if a next function call is invoked", async () => {
    const { func, resolves } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    const [, { signal }] = func.mock.calls[0];
    const onAbort = jest.fn(() => {});
    signal.addEventListener("abort", onAbort);

    act(() => {
      call("bar");
    });
    expect(onAbort).not.toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onAbort).toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith(["bar"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("FOO"); // should not update the state
    expect(func).toHaveBeenCalledTimes(2);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[1]("BAR");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("BAR");
      expect(isWaiting).toBe(false);
    });
    expect(func).toHaveBeenCalledTimes(2);
  });

  it("should ignore rejection and go back to standby state if there is no waiting function call", async () => {
    const { func, rejects } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    rejects[0](new Error("test error"));
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);
    });
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should ignore rejection and go back to waiting state if there is a waiting function call", async () => {
    const { func, resolves, rejects } = createMockFunc();
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      call("bar");
    });
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    rejects[0](new Error("test error"));
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);
    });
    expect(func).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith(["bar"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[1]("BAR");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("BAR");
      expect(isWaiting).toBe(false);
    });
    expect(func).toHaveBeenCalledTimes(2);
  });

  it("should be consistent if the debounced call is invoked in the function", async () => {
    let call = (_str: string): void => {};
    const { func: _func, resolves } = createMockFunc();
    const func = jest.fn<Promise<string>, [[string], UseDebouncedAsyncCallFuncOptions]>(
      (args, options) => {
        call("nyancat");
        return _func(args, options);
      }
    );
    const t = strictRenderHook(() =>
      useDebouncedAsyncCall({
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
    expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("FOO");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(true);
    });
    expect(func).toHaveBeenCalledTimes(1);

    call = (_str: string): void => {};

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith(["nyancat"], expect.any(Object));
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    resolves[1]("NYANCAT");
    await waitFor(() => {
      const [res, , isWaiting] = t.result.current;
      expect(res).toBe("NYANCAT");
      expect(isWaiting).toBe(false);
    });
    expect(func).toHaveBeenCalledTimes(2);
  });

  describe("cancel", () => {
    it("should cancel the waiting function call", () => {
      const { func } = createMockFunc();
      const t = strictRenderHook(() =>
        useDebouncedAsyncCall({
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

    it("should cancel the pending function call", () => {
      const { func, resolves } = createMockFunc();
      const t = strictRenderHook(() =>
        useDebouncedAsyncCall({
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
        jest.advanceTimersByTime(1000);
      });
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      const [, { signal }] = func.mock.calls[0];
      const onAbort = jest.fn(() => {});
      signal.addEventListener("abort", onAbort);

      act(() => {
        cancel();
      });
      expect(onAbort).toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      resolves[0]("FOO"); // should not update the state
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);
    });

    it("should do nothing if there are no waiting or pending function calls", () => {
      const { func } = createMockFunc();
      const t = strictRenderHook(() =>
        useDebouncedAsyncCall({
          func,
          init: "",
          wait: 1000,
        })
      );
      expect(func).not.toHaveBeenCalled();
      const [, , , { cancel }] = t.result.current;
      let [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        cancel();
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);
    });
  });

  describe("reset", () => {
    it("should cancel the waiting function call and set the given value to the result", () => {
      const { func } = createMockFunc();
      const t = strictRenderHook(() =>
        useDebouncedAsyncCall({
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

    it("should cancel the pending function call and set the given value to the result", () => {
      const { func, resolves } = createMockFunc();
      const t = strictRenderHook(() =>
        useDebouncedAsyncCall({
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
        jest.advanceTimersByTime(1000);
      });
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      const [, { signal }] = func.mock.calls[0];
      const onAbort = jest.fn(() => {});
      signal.addEventListener("abort", onAbort);

      act(() => {
        reset("RESET");
      });
      expect(onAbort).toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("RESET");
      expect(isWaiting).toBe(false);

      resolves[0]("FOO"); // should not update the state
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("RESET");
      expect(isWaiting).toBe(false);
    });

    it("should only set the given value to the result if there are no waiting or pending function calls", () => {
      const { func } = createMockFunc();
      const t = strictRenderHook(() =>
        useDebouncedAsyncCall({
          func,
          init: "",
          wait: 1000,
        })
      );
      expect(func).not.toHaveBeenCalled();
      const [, , , { reset }] = t.result.current;
      let [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        reset("RESET");
      });
      expect(func).not.toHaveBeenCalled();
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("RESET");
      expect(isWaiting).toBe(false);
    });
  });

  describe("flush", () => {
    it("should flush the waiting function call", async () => {
      const { func, resolves } = createMockFunc();
      const t = strictRenderHook(() =>
        useDebouncedAsyncCall({
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
      expect(func).toHaveBeenLastCalledWith(["foo"], expect.any(Object));
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      resolves[0]("FOO");
      await waitFor(() => {
        const [res, , isWaiting] = t.result.current;
        expect(res).toBe("FOO");
        expect(isWaiting).toBe(false);
      });
      expect(func).toHaveBeenCalledTimes(1);
    });
  });
});
