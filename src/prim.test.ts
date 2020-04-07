import { renderHook } from "@testing-library/react-hooks";
import { useDebouncedPrim } from "./prim";

describe("useDebouncedPrim", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should always return the same functions", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [func1, cancel1, flush1] = t.result.current;

    t.rerender();
    const [func2, cancel2, flush2] = t.result.current;
    expect(func2).toBe(func1);
    expect(cancel2).toBe(cancel1);
    expect(flush2).toBe(flush1);
  });

  it("should call the leading and trailing callbacks on the respective edges", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [func] = t.result.current;
    expect(leadingCallback).not.toHaveBeenCalled();
    expect(trailingCallback).not.toHaveBeenCalled();

    func("foo");
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    func("bar");
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    func("baz");
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).toHaveBeenLastCalledWith(["baz"], 2);
  });

  it("should immediately call the trailing callback after maxWait", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
        maxWait: 1500,
      })
    );
    const [func] = t.result.current;
    expect(trailingCallback).not.toHaveBeenCalled();

    func("foo");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    func("bar");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    func("baz");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(trailingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).toHaveBeenLastCalledWith(["baz"], 2);
  });

  it("should count the number of non-leading function calls", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [func] = t.result.current;
    expect(leadingCallback).not.toHaveBeenCalled();
    expect(trailingCallback).not.toHaveBeenCalled();

    func("foo");
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).toHaveBeenLastCalledWith(["foo"], 0);

    func("bar");
    func("baz");
    func("qux");
    expect(leadingCallback).toHaveBeenCalledTimes(2);
    expect(leadingCallback).toHaveBeenLastCalledWith(["bar"]);
    expect(trailingCallback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(leadingCallback).toHaveBeenCalledTimes(2);
    expect(trailingCallback).toHaveBeenCalledTimes(2);
    expect(trailingCallback).toHaveBeenLastCalledWith(["qux"], 2);
  });

  it("should not call the leading callback after the component is unmounted", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [func] = t.result.current;
    expect(leadingCallback).not.toHaveBeenCalled();

    t.unmount();

    func("foo");
    expect(leadingCallback).not.toHaveBeenCalled();
  });

  it("should not call the trailing callback after the component is unmounted", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [func] = t.result.current;
    expect(trailingCallback).not.toHaveBeenCalled();

    func("foo");
    expect(trailingCallback).not.toHaveBeenCalled();

    t.unmount();

    jest.advanceTimersByTime(1000);
    expect(trailingCallback).not.toHaveBeenCalled();
  });

  it("should not call the trailing callback after the component is unmounted with maxWait", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
        maxWait: 1500,
      })
    );
    const [func] = t.result.current;
    expect(trailingCallback).not.toHaveBeenCalled();

    func("foo");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    func("bar");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    func("baz");
    expect(trailingCallback).not.toHaveBeenCalled();

    t.unmount();

    jest.advanceTimersByTime(500);
    expect(trailingCallback).not.toHaveBeenCalled();
  });

  describe("cancel", () => {
    it("should be able to cancel the waiting call", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [func, cancel] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      func("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      func("bar");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();

      cancel();

      jest.advanceTimersByTime(1000);
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();
    });

    it("should be able to cancel the waiting call with maxWait", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
          maxWait: 1500,
        })
      );
      const [func, cancel] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      func("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      func("bar");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      func("baz");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();

      cancel();
      jest.advanceTimersByTime(500);
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();
    });

    it("should do nothing if there is no waiting call", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [func, cancel] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      cancel();
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      func("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).toHaveBeenLastCalledWith(["foo"], 0);
    });

    it("should do nothing if the component has been unmounted", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [func, cancel] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      func("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      t.unmount();

      cancel();

      jest.advanceTimersByTime(1000);
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();
    });
  });

  describe("flush", () => {
    it("should flush the waiting call", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [func, , flush] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      func("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      func("bar");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();

      flush();
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).toHaveBeenLastCalledWith(["bar"], 1);
    });

    it("should do nothing if there is no waiting call", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [func, , flush] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      flush();
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      func("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).toHaveBeenLastCalledWith(["foo"], 0);
    });

    it("should do nothing if the component has been unmounted", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [func, , flush] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      func("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      t.unmount();

      flush();
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();
    });
  });
});
