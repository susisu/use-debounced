## 0.5.1 (2024-02-29)

- Update dependencies

## 0.5.0 (2024-02-18)

- The package is now ESM/CJS dual

## 0.4.1 (2022-04-23)

- Add support for React 18
- Include source files in distribution (for source maps)

## 0.4.0 (2021-09-07)

### Breaking changes

- `func` of `useDebouncedCall`, `useDebouncedAsyncCall`, and `useDebuncedFunc` receives arguments as a single array.
  - Previously:
    ``` ts
    const [result, call] = useDebouncedCall({
      func: (x, y, z) => myFunc(x, y, z),
      init: undefined,
      wait: 1000,
    });

    call(a, b, c); // will call myFunc(a, b, c);
    ```
  - Now:
    ``` ts
    const [result, call] = useDebouncedCall({
      func: (args) => myFunc(...args), // or ([x, y, z]) => myFunc(x, y, z)
      init: undefined,
      wait: 1000,
    });

    call(a, b, c); // will call myFunc(a, b, c);
    ```
- (For TypeScript) The order of the type arguments of `useDebouncedCall` and `useDebouncedAsyncCall` are flipped.
  - `useDebouncedCall<Result, Parameters>` to `useDebouncedCall<Parameters, Result>`

### Features

- Cancellation of `useDebouncedAsyncCall` is notified to `func` via [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal).
  - Example:
    ``` ts
    const [result, call, , { cancel }] = useDebouncedAsyncCall({
      func: (args, { signal }) => {
        signal.addEventListener("abort", () => {
          console.log("Canceled!");
        });
        return ...;
      },
      init: undefined,
      wait: 1000,
    });

    cancel(); // cancels debounced call and fires "abort" event
    ```
  - You may pass it to the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) function to cancel ongoing HTTP requests, for example.
- Now `setState`, `call`, etc. will not be ignored after the component is unmounted.
  - If you call those functions after unmounted, you will be warned by React for a state update (no-op but likely a memory leak).

## 0.3.1 (2021-07-23)

### Features

- Add explicit `| undefined` on optional properties in preparation for `--exactOptionalPropertyTypes` in TS 4.4

## 0.3.0 (2021-02-09)

- Add a new hook `useDebuncedFunc`
- Refactor the internal implementation

## 0.2.3 (2020-12-10)

- Fix `useDebouncedState` and `useDebouncedCall` would wrongly update state if the type of state / result of function call is a function

## 0.2.2 (2020-11-06)

- Support React 17

## 0.2.1 (2020-04-19)

### Bug fixes

- Avoid flickering state of `useDebouncedAsyncCall`

## 0.2.0 (2020-04-19)

### Breaking changes

- Remove `shouldCall` option of `useDebouncedCall` and `useDebouncedAsyncCall`
  - Use memoized function instead

## 0.1.2 (2020-04-15)

### Bug fixes

- Fix state of `useDebouncedCall` and `useDebouncedAsyncCall` would get out of sync when debounced call is triggered in the original function.

## 0.1.1 (2020-04-12)

### Features

- Log errors to console when promise rejection happened in `useDebouncedAsyncCall`

### Bug fixes

- Fix `useDebouncedAsyncCall` could skip function calls after promise rejection
- Ensure updating refs in `useEffect`

## 0.1.0 (2020-04-12)

- First release
