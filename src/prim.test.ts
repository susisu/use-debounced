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

  const createMockCallbacks = (): {
    leadingCallback: jest.Mock<void, [[string]]>;
    trailingCallback: jest.Mock<void, [[string], number]>;
    cancelCallback: jest.Mock<void, []>;
  } => ({
    leadingCallback: jest.fn(),
    trailingCallback: jest.fn(),
    cancelCallback: jest.fn(),
  });

  it("should always return the identical functions", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      useDebouncedPrim({
        ...callbacks,
        wait: 1000,
      })
    );
    const r1 = t.result.current;

    t.rerender();
    const r2 = t.result.current;
    expect(r2.trigger).toBe(r1.trigger);
    expect(r2.cancel).toBe(r1.cancel);
    expect(r2.flush).toBe(r1.flush);
  });

  it("should invoke the leading and trailing callbacks on the respective edges of timeout", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      useDebouncedPrim({
        ...callbacks,
        wait: 1000,
      })
    );
    const { trigger } = t.result.current;
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("bar");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("baz");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["baz"], 3);
  });

  it("should flush waiting timeout after maxWait", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      useDebouncedPrim({
        ...callbacks,
        wait: 1000,
        maxWait: 1500,
      })
    );
    const { trigger } = t.result.current;
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("bar");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("baz");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["baz"], 3);
  });

  it("should count the number of triggers", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      useDebouncedPrim({
        ...callbacks,
        wait: 1000,
      })
    );
    const { trigger } = t.result.current;
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], 1);

    trigger("bar");
    trigger("baz");
    trigger("qux");
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(2);
    expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["bar"]);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(callbacks.leadingCallback).toHaveBeenCalledTimes(2);
    expect(callbacks.trailingCallback).toHaveBeenCalledTimes(2);
    expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["qux"], 3);
  });

  it("should not invoke the leading callback after the component is unmounted", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      useDebouncedPrim({
        ...callbacks,
        wait: 1000,
      })
    );
    const { trigger } = t.result.current;
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();

    t.unmount();

    trigger("foo");
    expect(callbacks.leadingCallback).not.toHaveBeenCalled();
  });

  it("should not invoke the trailing callback after the component is unmounted", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      useDebouncedPrim({
        ...callbacks,
        wait: 1000,
      })
    );
    const { trigger } = t.result.current;
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    t.unmount();

    jest.advanceTimersByTime(1000);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();
  });

  it("should not invoke the trailing callback with maxWait after the component is unmounted", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      useDebouncedPrim({
        ...callbacks,
        wait: 1000,
        maxWait: 1500,
      })
    );
    const { trigger } = t.result.current;
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    trigger("foo");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("bar");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    trigger("baz");
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();

    t.unmount();

    jest.advanceTimersByTime(500);
    expect(callbacks.trailingCallback).not.toHaveBeenCalled();
  });

  describe("cancel", () => {
    it("should cancel the waiting invocations", () => {
      const callbacks = createMockCallbacks();
      const t = renderHook(() =>
        useDebouncedPrim({
          ...callbacks,
          wait: 1000,
        })
      );
      const { trigger, cancel } = t.result.current;
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      cancel();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);
    });

    it("should cancel the waiting invocations with maxWait", () => {
      const callbacks = createMockCallbacks();
      const t = renderHook(() =>
        useDebouncedPrim({
          ...callbacks,
          wait: 1000,
          maxWait: 1500,
        })
      );
      const { trigger, cancel } = t.result.current;
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      trigger("baz");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      cancel();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);
    });

    it("should do nothing if there is no waiting invocation", () => {
      const callbacks = createMockCallbacks();
      const t = renderHook(() =>
        useDebouncedPrim({
          ...callbacks,
          wait: 1000,
        })
      );
      const { trigger, cancel } = t.result.current;
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      cancel();
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], 1);
      expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);
    });

    it("should do nothing if the component has been unmounted", () => {
      const callbacks = createMockCallbacks();
      const t = renderHook(() =>
        useDebouncedPrim({
          ...callbacks,
          wait: 1000,
        })
      );
      const { trigger, cancel } = t.result.current;
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      t.unmount();

      cancel();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
      expect(callbacks.cancelCallback).not.toHaveBeenCalled();
    });
  });

  describe("flush", () => {
    it("should flush the waiting invocations", () => {
      const callbacks = createMockCallbacks();
      const t = renderHook(() =>
        useDebouncedPrim({
          ...callbacks,
          wait: 1000,
        })
      );
      const { trigger, flush } = t.result.current;
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      trigger("bar");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      flush();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["bar"], 2);
    });

    it("should do nothing if there is no waiting invocation", () => {
      const callbacks = createMockCallbacks();
      const t = renderHook(() =>
        useDebouncedPrim({
          ...callbacks,
          wait: 1000,
        })
      );
      const { trigger, flush } = t.result.current;
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      flush();
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).toHaveBeenLastCalledWith(["foo"], 1);
    });

    it("should do nothing if the component has been unmounted", () => {
      const callbacks = createMockCallbacks();
      const t = renderHook(() =>
        useDebouncedPrim({
          ...callbacks,
          wait: 1000,
        })
      );
      const { trigger, flush } = t.result.current;
      expect(callbacks.leadingCallback).not.toHaveBeenCalled();
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      trigger("foo");
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.leadingCallback).toHaveBeenLastCalledWith(["foo"]);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();

      t.unmount();

      flush();
      expect(callbacks.leadingCallback).toHaveBeenCalledTimes(1);
      expect(callbacks.trailingCallback).not.toHaveBeenCalled();
    });
  });
});
