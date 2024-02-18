import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import { strictRenderHook } from "./__tests__/utils";
import { useDebouncedFunc } from "./func";

describe("useDebouncedFunc", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should always return the identical functions", () => {
    const func = vi.fn<[[string]], void>(() => {});
    const t = strictRenderHook(() =>
      useDebouncedFunc({
        func,
        wait: 1000,
      }),
    );
    const [call1, r1] = t.result.current;

    t.rerender();
    const [call2, r2] = t.result.current;
    expect(call2).toBe(call1);
    expect(r2.cancel).toBe(r1.cancel);
    expect(r2.flush).toBe(r1.flush);
  });

  it("should debounce function calls", () => {
    const func = vi.fn<[[string]], void>(() => {});
    const t = strictRenderHook(() =>
      useDebouncedFunc({
        func,
        wait: 1000,
      }),
    );
    expect(func).not.toHaveBeenCalled();
    const [call] = t.result.current;

    call("foo");
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    call("bar");
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    call("baz");
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["baz"]);
  });

  it("should call the function on the leading edge of timeout if leading = true is specified", () => {
    const func = vi.fn<[[string]], void>(() => {});
    const t = strictRenderHook(() =>
      useDebouncedFunc({
        func,
        wait: 1000,
        leading: true,
      }),
    );
    expect(func).not.toHaveBeenCalled();
    const [call] = t.result.current;

    call("foo");
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["foo"]);

    vi.advanceTimersByTime(500);
    call("bar");
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    call("baz");
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith(["baz"]);
  });

  it("should not call the function on the trailing edge of timeout if trailing = false is specified", () => {
    const func = vi.fn<[[string]], void>(() => {});
    const t = strictRenderHook(() =>
      useDebouncedFunc({
        func,
        wait: 1000,
        leading: true,
        trailing: false,
      }),
    );
    expect(func).not.toHaveBeenCalled();
    const [call] = t.result.current;

    call("foo");
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["foo"]);

    vi.advanceTimersByTime(500);
    call("bar");
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    call("baz");
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(1);
  });

  describe("cancel", () => {
    it("should cancel the waiting function call", () => {
      const func = vi.fn<[[string]], void>(() => {});
      const t = strictRenderHook(() =>
        useDebouncedFunc({
          func,
          wait: 1000,
        }),
      );
      expect(func).not.toHaveBeenCalled();
      const [call, { cancel }] = t.result.current;

      call("foo");
      expect(func).not.toHaveBeenCalled();

      cancel();
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(func).not.toHaveBeenCalled();
    });
  });

  describe("flush", () => {
    it("should flush the waiting function call", () => {
      const func = vi.fn<[[string]], void>(() => {});
      const t = strictRenderHook(() =>
        useDebouncedFunc({
          func,
          wait: 1000,
        }),
      );
      expect(func).not.toHaveBeenCalled();
      const [call, { flush }] = t.result.current;

      call("foo");
      expect(func).not.toHaveBeenCalled();

      flush();
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenLastCalledWith(["foo"]);
    });
  });
});
