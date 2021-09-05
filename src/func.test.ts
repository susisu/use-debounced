import { StrictMode } from "react";
import { renderHook } from "@testing-library/react-hooks";
import { useDebouncedFunc } from "./func";

describe("useDebouncedFunc", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should always return the identical functions", () => {
    const func = jest.fn<void, [[string]]>(() => {});
    const t = renderHook(
      () =>
        useDebouncedFunc({
          func,
          wait: 1000,
        }),
      { wrapper: StrictMode }
    );
    const [call1, r1] = t.result.current;

    t.rerender();
    const [call2, r2] = t.result.current;
    expect(call2).toBe(call1);
    expect(r2.cancel).toBe(r1.cancel);
    expect(r2.flush).toBe(r1.flush);
  });

  it("should debounce function calls", () => {
    const func = jest.fn<void, [[string]]>(() => {});
    const t = renderHook(
      () =>
        useDebouncedFunc({
          func,
          wait: 1000,
        }),
      { wrapper: StrictMode }
    );
    expect(func).not.toHaveBeenCalled();
    const [call] = t.result.current;

    call("foo");
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    call("bar");
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    call("baz");
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["baz"]);
  });

  it("should call the function on the leading edge of timeout if leading = true is specified", () => {
    const func = jest.fn<void, [[string]]>(() => {});
    const t = renderHook(
      () =>
        useDebouncedFunc({
          func,
          wait: 1000,
          leading: true,
        }),
      { wrapper: StrictMode }
    );
    expect(func).not.toHaveBeenCalled();
    const [call] = t.result.current;

    call("foo");
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["foo"]);

    jest.advanceTimersByTime(500);
    call("bar");
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    call("baz");
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith(["baz"]);
  });

  it("should not call the function on the trailing edge of timeout if trailing = false is specified", () => {
    const func = jest.fn<void, [[string]]>(() => {});
    const t = renderHook(
      () =>
        useDebouncedFunc({
          func,
          wait: 1000,
          leading: true,
          trailing: false,
        }),
      { wrapper: StrictMode }
    );
    expect(func).not.toHaveBeenCalled();
    const [call] = t.result.current;

    call("foo");
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenLastCalledWith(["foo"]);

    jest.advanceTimersByTime(500);
    call("bar");
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    call("baz");
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledTimes(1);
  });

  describe("cancel", () => {
    it("should cancel the waiting function call", () => {
      const func = jest.fn<void, [[string]]>(() => {});
      const t = renderHook(
        () =>
          useDebouncedFunc({
            func,
            wait: 1000,
          }),
        { wrapper: StrictMode }
      );
      expect(func).not.toHaveBeenCalled();
      const [call, { cancel }] = t.result.current;

      call("foo");
      expect(func).not.toHaveBeenCalled();

      cancel();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(func).not.toHaveBeenCalled();
    });
  });

  describe("flush", () => {
    it("should flush the waiting function call", () => {
      const func = jest.fn<void, [[string]]>(() => {});
      const t = renderHook(
        () =>
          useDebouncedFunc({
            func,
            wait: 1000,
          }),
        { wrapper: StrictMode }
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
