import { renderHook, act } from "@testing-library/react-hooks";
import { triplet, ResolveFunc, RejectFunc } from "@susisu/promise-utils";
import { useDebouncedAsyncCall } from "./asyncCall";

describe("useDebouncedAsyncCall", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const createMockFunc = (): {
    func: jest.Mock<Promise<string>, [string]>;
    resolves: ReadonlyArray<ResolveFunc<string>>;
    rejects: readonly RejectFunc[];
  } => {
    const resolves: Array<ResolveFunc<string>> = [];
    const rejects: RejectFunc[] = [];
    const func = jest.fn<Promise<string>, [string]>(() => {
      const [promise, resolve, reject] = triplet<string>();
      resolves.push(resolve);
      rejects.push(reject);
      return promise;
    });
    return { func, resolves, rejects };
  };

  it("should always return the identical functions", () => {
    const { func } = createMockFunc();
    const t = renderHook(() =>
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
    const t = renderHook(() =>
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
    const t = renderHook(() =>
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
    const t = renderHook(() =>
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
    expect(func).toHaveBeenLastCalledWith("baz");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("BAZ");
    await t.waitForNextUpdate();
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("BAZ");
    expect(isWaiting).toBe(false);
  });

  it("should call the function on the leading edge of timeout if leading = true is specified", async () => {
    const { func, resolves } = createMockFunc();
    const t = renderHook(() =>
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
    expect(func).toHaveBeenLastCalledWith("foo");
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
    await t.waitForNextUpdate();
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
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(true);

    resolves[1]("BAZ");
    await t.waitForNextUpdate();
    expect(func).toHaveBeenCalledTimes(2);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("BAZ");
    expect(isWaiting).toBe(false);
  });

  it("should not call the function on the trailing edge of timeout if trailing = false is specified", async () => {
    const { func, resolves } = createMockFunc();
    const t = renderHook(() =>
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
    expect(func).toHaveBeenLastCalledWith("foo");
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
    await t.waitForNextUpdate();
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

  it("should correctly reset waiting state when leading = true and call is invoked only once", async () => {
    const { func, resolves } = createMockFunc();
    const t = renderHook(() =>
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
    expect(func).toHaveBeenLastCalledWith("foo");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("FOO");
    await t.waitForNextUpdate();
    expect(func).toHaveBeenCalledTimes(1);
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

  it("should skip function call if shouldCall returns false", async () => {
    const shouldCall = jest.fn<boolean, [[string], [string]]>(
      ([prev], [next]) => prev.toUpperCase() !== next.toUpperCase()
    );
    const { func, resolves } = createMockFunc();
    const t = renderHook(() =>
      useDebouncedAsyncCall({
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
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("FOO");
    await t.waitForNextUpdate();
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(1);
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

  it("should cancel the previous pending function call if a next function call is invoked", async () => {
    const { func, resolves } = createMockFunc();
    const t = renderHook(() =>
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
    expect(func).toHaveBeenLastCalledWith("foo");
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

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith("bar");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[0]("FOO"); // should not update the state
    expect(func).toHaveBeenCalledTimes(2);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[1]("BAR");
    await t.waitForNextUpdate();
    expect(func).toHaveBeenCalledTimes(2);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("BAR");
    expect(isWaiting).toBe(false);
  });

  it("should ignore rejection and go back to standby state if there is no waiting function call", async () => {
    const { func, rejects } = createMockFunc();
    const t = renderHook(() =>
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
    expect(func).toHaveBeenLastCalledWith("foo");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    rejects[0](new Error("test error"));
    await t.waitForNextUpdate();
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(false);
  });

  it("should ignore rejection and go back to waiting state if there is a waiting function call", async () => {
    const { func, resolves, rejects } = createMockFunc();
    const t = renderHook(() =>
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
    expect(func).toHaveBeenLastCalledWith("foo");
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
    await t.waitForNextUpdate();
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith("bar");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[1]("BAR");
    await t.waitForNextUpdate();
    expect(func).toHaveBeenCalledTimes(2);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("BAR");
    expect(isWaiting).toBe(false);
  });

  it("should reset the internal memory on rejection to ensure the function is called again even if shouldCall will return false", async () => {
    const shouldCall = jest.fn<boolean, [[string], [string]]>(
      ([prev], [next]) => prev.toUpperCase() !== next.toUpperCase()
    );
    const { func, resolves, rejects } = createMockFunc();
    const t = renderHook(() =>
      useDebouncedAsyncCall({
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
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    rejects[0](new Error("test error"));
    await t.waitForNextUpdate();
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(false);

    act(() => {
      call("FOO");
    });
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith("FOO");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    resolves[1]("FOO");
    await t.waitForNextUpdate();
    expect(shouldCall).not.toHaveBeenCalled();
    expect(func).toHaveBeenCalledTimes(2);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("FOO");
    expect(isWaiting).toBe(false);
  });

  it("should cancel the pending function call when the component is unmounted", () => {
    const { func, resolves } = createMockFunc();
    const t = renderHook(() =>
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
    expect(func).toHaveBeenLastCalledWith("foo");
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);

    t.unmount();

    resolves[0]("FOO"); // should not update the state
    expect(func).toHaveBeenCalledTimes(1);
    [res, , isWaiting] = t.result.current;
    expect(res).toBe("");
    expect(isWaiting).toBe(true);
  });

  describe("cancel", () => {
    it("should cancel the waiting function call", () => {
      const { func } = createMockFunc();
      const t = renderHook(() =>
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
      const t = renderHook(() =>
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
      expect(func).toHaveBeenLastCalledWith("foo");
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        cancel();
      });
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
      const t = renderHook(() =>
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

    it("should reset the internal memory to ensure the function is called again even if shouldCall will return false", async () => {
      const shouldCall = jest.fn<boolean, [[string], [string]]>(
        ([prev], [next]) => prev.toUpperCase() !== next.toUpperCase()
      );
      const { func, resolves } = createMockFunc();
      const t = renderHook(() =>
        useDebouncedAsyncCall({
          func,
          init: "",
          wait: 1000,
          shouldCall,
        })
      );
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).not.toHaveBeenCalled();
      const [, call, , { cancel }] = t.result.current;
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
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        cancel();
      });
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      resolves[0]("FOO"); // should not update the state
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(false);

      act(() => {
        call("FOO");
      });
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(2);
      expect(func).toHaveBeenLastCalledWith("FOO");
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      resolves[1]("FOO");
      await t.waitForNextUpdate();
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(2);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(false);
    });
  });

  describe("reset", () => {
    it("should cancel the waiting function call and set the given value to the result", () => {
      const { func } = createMockFunc();
      const t = renderHook(() =>
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
      const t = renderHook(() =>
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
      expect(func).toHaveBeenLastCalledWith("foo");
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      act(() => {
        reset("RESET");
      });
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
      const t = renderHook(() =>
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

    it("should reset the internal memory to ensure the function is called again even if shouldCall will return false", async () => {
      const shouldCall = jest.fn<boolean, [[string], [string]]>(
        ([prev], [next]) => prev.toUpperCase() !== next.toUpperCase()
      );
      const { func, resolves } = createMockFunc();
      const t = renderHook(() =>
        useDebouncedAsyncCall({
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
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      resolves[0]("FOO");
      await t.waitForNextUpdate();
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(1);
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
      expect(res).toBe("RESET");
      expect(isWaiting).toBe(true);

      resolves[1]("FOO");
      await t.waitForNextUpdate();
      expect(shouldCall).not.toHaveBeenCalled();
      expect(func).toHaveBeenCalledTimes(2);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(false);
    });
  });

  describe("flush", () => {
    it("should flush the waiting function call", async () => {
      const { func, resolves } = createMockFunc();
      const t = renderHook(() =>
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
      expect(func).toHaveBeenLastCalledWith("foo");
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("");
      expect(isWaiting).toBe(true);

      resolves[0]("FOO");
      await t.waitForNextUpdate();
      expect(func).toHaveBeenCalledTimes(1);
      [res, , isWaiting] = t.result.current;
      expect(res).toBe("FOO");
      expect(isWaiting).toBe(false);
    });
  });
});
