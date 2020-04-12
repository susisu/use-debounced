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

  it("should always return the identical functions", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [trigger1, cancel1, flush1] = t.result.current;

    t.rerender();
    const [trigger2, cancel2, flush2] = t.result.current;
    expect(trigger2).toBe(trigger1);
    expect(cancel2).toBe(cancel1);
    expect(flush2).toBe(flush1);
  });

  it("should invoke the leading and trailing callbacks on the respective edges of timeout", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [trigger] = t.result.current;
    expect(leadingCallback).not.toHaveBeenCalled();
    expect(trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("bar");
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("baz");
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

  it("should flush waiting timeout after maxWait", () => {
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
    const [trigger] = t.result.current;
    expect(trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("bar");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("baz");
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
    const [trigger] = t.result.current;
    expect(leadingCallback).not.toHaveBeenCalled();
    expect(trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(leadingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).toHaveBeenCalledTimes(1);
    expect(trailingCallback).toHaveBeenLastCalledWith(["foo"], 0);

    trigger("bar");
    trigger("baz");
    trigger("qux");
    expect(leadingCallback).toHaveBeenCalledTimes(2);
    expect(leadingCallback).toHaveBeenLastCalledWith(["bar"]);
    expect(trailingCallback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(leadingCallback).toHaveBeenCalledTimes(2);
    expect(trailingCallback).toHaveBeenCalledTimes(2);
    expect(trailingCallback).toHaveBeenLastCalledWith(["qux"], 2);
  });

  it("should not invoke the leading callback after the component is unmounted", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [trigger] = t.result.current;
    expect(leadingCallback).not.toHaveBeenCalled();

    t.unmount();

    trigger("foo");
    expect(leadingCallback).not.toHaveBeenCalled();
  });

  it("should not invoke the trailing callback after the component is unmounted", () => {
    const leadingCallback = jest.fn<void, [[string]]>();
    const trailingCallback = jest.fn<void, [[string], number]>();
    const t = renderHook(() =>
      useDebouncedPrim({
        leadingCallback,
        trailingCallback,
        wait: 1000,
      })
    );
    const [trigger] = t.result.current;
    expect(trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(trailingCallback).not.toHaveBeenCalled();

    t.unmount();

    jest.advanceTimersByTime(1000);
    expect(trailingCallback).not.toHaveBeenCalled();
  });

  it("should not invoke the trailing callback with maxWait after the component is unmounted", () => {
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
    const [trigger] = t.result.current;
    expect(trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("bar");
    expect(trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("baz");
    expect(trailingCallback).not.toHaveBeenCalled();

    t.unmount();

    jest.advanceTimersByTime(500);
    expect(trailingCallback).not.toHaveBeenCalled();
  });

  describe("cancel", () => {
    it("should cancel the waiting invocations", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [trigger, cancel] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      trigger("bar");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();

      cancel();

      jest.advanceTimersByTime(1000);
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();
    });

    it("should cancel the waiting invocations with maxWait", () => {
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
      const [trigger, cancel] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      trigger("bar");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      trigger("baz");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();

      cancel();
      jest.advanceTimersByTime(500);
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();
    });

    it("should do nothing if there is no waiting invocation", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [trigger, cancel] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      cancel();
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
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
      const [trigger, cancel] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
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
    it("should flush the waiting invocations", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [trigger, , flush] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      trigger("bar");
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).not.toHaveBeenCalled();

      flush();
      expect(leadingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).toHaveBeenCalledTimes(1);
      expect(trailingCallback).toHaveBeenLastCalledWith(["bar"], 1);
    });

    it("should do nothing if there is no waiting invocation", () => {
      const leadingCallback = jest.fn<void, [[string]]>();
      const trailingCallback = jest.fn<void, [[string], number]>();
      const t = renderHook(() =>
        useDebouncedPrim({
          leadingCallback,
          trailingCallback,
          wait: 1000,
        })
      );
      const [trigger, , flush] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      flush();
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
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
      const [trigger, , flush] = t.result.current;
      expect(leadingCallback).not.toHaveBeenCalled();
      expect(trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
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
