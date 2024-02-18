import type { Mock } from "vitest";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import { Debounce } from "@susisu/primitive-debounce";
import { strictRenderHook } from "./__tests__/utils";
import { usePrimitiveDebounce } from "./primitive";

describe("usePrimitiveDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const createMockCallbacks = (): {
    leadingCallback: Mock<[[string], boolean], void>;
    trailingCallback: Mock<[[string], boolean], void>;
    cancelCallback: Mock<[], void>;
  } => ({
    leadingCallback: vi.fn<[[string], boolean], void>(() => {}),
    trailingCallback: vi.fn<[[string], boolean], void>(() => {}),
    cancelCallback: vi.fn<[], void>(() => {}),
  });

  it("should create and hold an instance of Debounce", () => {
    const callbacks = createMockCallbacks();
    const t = strictRenderHook(() =>
      usePrimitiveDebounce({
        ...callbacks,
        wait: 1000,
      }),
    );
    expect(t.result.current).toBeInstanceOf(Debounce);
    const debounce = t.result.current;

    t.rerender();
    expect(t.result.current).toBe(debounce);
  });

  it("should replace callbacks when they are updated", () => {
    const callbacks1 = createMockCallbacks();
    const t = strictRenderHook(
      (callbacks) =>
        usePrimitiveDebounce({
          ...callbacks,
          wait: 1000,
        }),
      { initialProps: callbacks1 },
    );

    const callbacks2 = createMockCallbacks();
    t.rerender(callbacks2);

    let callCount1 = callbacks1.leadingCallback.mock.calls.length;
    let callCount2 = callbacks2.leadingCallback.mock.calls.length;
    t.result.current.trigger("foo");
    expect(callbacks1.leadingCallback).toHaveBeenCalledTimes(callCount1);
    expect(callbacks2.leadingCallback).toHaveBeenCalledTimes(callCount2 + 1);

    callCount1 = callbacks1.trailingCallback.mock.calls.length;
    callCount2 = callbacks2.trailingCallback.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(callbacks1.trailingCallback).toHaveBeenCalledTimes(callCount1);
    expect(callbacks2.trailingCallback).toHaveBeenCalledTimes(callCount2 + 1);

    callCount1 = callbacks1.cancelCallback.mock.calls.length;
    callCount2 = callbacks2.cancelCallback.mock.calls.length;
    t.result.current.cancel();
    expect(callbacks1.cancelCallback).toHaveBeenCalledTimes(callCount1);
    expect(callbacks2.cancelCallback).toHaveBeenCalledTimes(callCount2 + 1);
  });

  it("should cancel when the component is unmounted", () => {
    const callbacks = createMockCallbacks();
    const t = strictRenderHook(() =>
      usePrimitiveDebounce({
        ...callbacks,
        wait: 1000,
      }),
    );
    const callCount = callbacks.cancelCallback.mock.calls.length;
    t.unmount();
    expect(callbacks.cancelCallback).toHaveBeenCalledTimes(callCount + 1);
  });
});
