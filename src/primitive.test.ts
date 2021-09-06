import { Debounce } from "@susisu/primitive-debounce";
import { renderHook } from "@testing-library/react-hooks";
import { usePrimitiveDebounce } from "./primitive";

describe("usePrimitiveDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const createMockCallbacks = (): {
    leadingCallback: jest.Mock<void, [[string], boolean]>;
    trailingCallback: jest.Mock<void, [[string], boolean]>;
    cancelCallback: jest.Mock<void, []>;
  } => ({
    leadingCallback: jest.fn<void, [[string], boolean]>(() => {}),
    trailingCallback: jest.fn<void, [[string], boolean]>(() => {}),
    cancelCallback: jest.fn<void, []>(() => {}),
  });

  it("should create and hold an instance of Debounce", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      usePrimitiveDebounce({
        ...callbacks,
        wait: 1000,
      })
    );
    expect(t.result.current).toBeInstanceOf(Debounce);
    const debounce = t.result.current;

    t.rerender();
    expect(t.result.current).toBe(debounce);
  });

  it("should replace callbacks when they are updated", () => {
    const callbacks1 = createMockCallbacks();
    const t = renderHook(
      callbacks =>
        usePrimitiveDebounce({
          ...callbacks,
          wait: 1000,
        }),
      { initialProps: callbacks1 }
    );

    const callbacks2 = createMockCallbacks();
    t.rerender(callbacks2);

    t.result.current.trigger("foo");
    expect(callbacks1.leadingCallback).not.toHaveBeenCalled();
    expect(callbacks2.leadingCallback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(callbacks1.trailingCallback).not.toHaveBeenCalled();
    expect(callbacks2.trailingCallback).toHaveBeenCalledTimes(1);

    t.result.current.cancel();
    expect(callbacks1.cancelCallback).not.toHaveBeenCalled();
    expect(callbacks2.cancelCallback).toHaveBeenCalledTimes(1);
  });

  it("should cancel when the component is unmounted", () => {
    const callbacks = createMockCallbacks();
    const t = renderHook(() =>
      usePrimitiveDebounce({
        ...callbacks,
        wait: 1000,
      })
    );
    expect(callbacks.cancelCallback).not.toHaveBeenCalled();

    t.unmount();
    expect(callbacks.cancelCallback).toHaveBeenCalledTimes(1);
  });
});
