## 0.2.0 (yyyy-mm-dd)
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
