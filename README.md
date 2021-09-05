# @susisu/use-debounced

[![CI](https://github.com/susisu/use-debounced/workflows/CI/badge.svg)](https://github.com/susisu/use-debounced/actions?query=workflow%3ACI)

Debounced React Hooks

``` shell
npm i @susisu/use-debounced
# or
yarn add @susisu/use-debounced
```

## Usage
### `useDebouncedState`
`useDebouncedState` is like the standard `useState` hook, but state updates are debounced.

``` tsx
import React from "react";
import { useDebouncedState } from "@susisu/use-debounced";

const MyComponent: React.FC = () => {
  const [value, setValue, isWaiting] = useDebouncedState({
    init: "",
    wait: 1000,
  });
  return (
    <div>
      <p>
        <input
          type="text"
          defaultValue=""
          onChange={e => {
            setValue(e.target.value);
          }}
        />
      </p>
      <p>{isWaiting ? "..." : value}</p>
    </div>
  );
};
```

### `useDebouncedCall`
`useDebouncedCall` debounces synchronous function calls. When the given function is invoked after timeout, the result will be set to the state.

``` tsx
import React from "react";
import { useDebouncedCall } from "@susisu/use-debounced";

const MyComponent: React.FC = () => {
  const [user, call, isWaiting] = useDebouncedCall({
    func: ([name]) => findUser(name),
    init: undefined,
    wait: 1000,
  });
  return (
    <div>
      <p>
        <input
          type="text"
          defaultValue=""
          onChange={e => {
            call(e.target.value);
          }}
        />
      </p>
      <p>{isWaiting ? "..." : user?.email}</p>
    </div>
  );
};
```

### `useDebouncedAsyncCall`
`useDebouncedAsyncCall` debounces asynchronous function calls. When the given function is invoked after timeout and it is fulfilled, the result will be set to the state.

``` tsx
import React from "react";
import { useDebouncedAsyncCall } from "@susisu/use-debounced";

const MyComponent: React.FC = () => {
  const [user, call, isWaiting] = useDebouncedAsyncCall({
    func: ([name]) => fetchUser(name).catch(() => undefined),
    init: undefined,
    wait: 1000,
  });
  return (
    <div>
      <p>
        <input
          type="text"
          defaultValue=""
          onChange={e => {
            call(e.target.value);
          }}
        />
      </p>
      <p>{isWaiting ? "..." : user?.email}</p>
    </div>
  );
};
```

### `useDebouncedFunc`
`useDebouncedFunc` is a simple hook to create a debounced version of a function.

``` tsx
import React from "react";
import { useDebouncedFunc } from "@susisu/use-debounced";

const MyComponent: React.FC = () => {
  const [call] = useDebouncedFunc({
    func: ([value]) => setRemoteValue(value),
    wait: 1000,
  });
  return (
    <div>
      <p>
        <input
          type="text"
          defaultValue=""
          onChange={e => {
            call(e.target.value);
          }}
        />
      </p>
    </div>
  );
};
```

## License

[MIT License](http://opensource.org/licenses/mit-license.php)

## Author

Susisu ([GitHub](https://github.com/susisu), [Twitter](https://twitter.com/susisu2413))
