# Contributing

## Table of Contents

- [Architecture](#architecture)
- [Code](#code)
  - [File template](#file-template)
  - [Testing](#testing)
  - [Imports](#imports)
  - [Use function instead of arrow functions by default](#use-function-instead-of-arrow-functions-by-default)
  - [Use object props instead of multiple props](#use-object-props-instead-of-multiple-props)
  - [Never use return types if the function infers the type correctly](#never-use-return-types-if-the-function-infers-the-type-correctly)
  - [Logger](#logger)
  - [Comments](#comments)
  - [Frontend](#frontend)

## Architecture

```
📁 backend
  📁 core
    📁 logger
    📁 utils
  📁 infra
      📁 drive-server-wip
      📁 sqlite
        📄 sqlite.module.ts
        📁 services
          📄 function1.ts
          📄 function2.ts
  📁 features
      📁 backups
      📁 sync
          📄 sync.module.ts
          📁 services
            📄 function1.ts
            📄 function2.ts
📁 frontend
  📁 core
  📁 api
```

## Code

### File template

```ts
type Props = { prop1: A; prop2: B };

export function fn({ prop1, prop2 }: Props) {}
```

### Testing

See [docs/TESTING.md](https://github.com/internxt/drive-desktop-core/blob/master/docs/TESTING.md).

### Imports

Always import the function used, not the module. This is to be consistent and import everything in the same way.

```ts
// bad
import fs from 'node:fs';
// good
import { stat } from 'node:fs';
```

### Use function instead of arrow functions by default

---

We recommend always creating functions using the `function` keyword because:

- We use the eslint `no-use-before-define` rule and we need to skip checking functions because they are hoisted (we cannot do this with arrow functions).

We only use arrow functions when we want to define a function using a type.

```ts
// bad
const connect = () => {}
// good
function connect() {}
// good
type func = () => void;
const connect: func = () => {}
```

### Use object props instead of multiple props

---

https://github.com/internxt/drive-desktop/issues/545

```ts
// bad
function connect(host: string, port: number) {}
// good
function connect({ host, port }: { host: string; port: number }) {}
// default parameters
function connect({ host, port = 5432 }: { host: string; port?: number }) {}
```

### Never use return types if the function infers the type correctly

---

We believe that using return types presents more problems than advantages:

- Naming return types.
- Maintaining return types.

However, using return types has one advantage: if a function is supposed to return a `boolean` value and we forget to add a return value, it will infer an `undefined` value and we might start checking that function's return value using the wrong `undefined`. To solve this, we use the TypeScript rule `noImplicitReturns` to ensure that we don't forget to return a value in all branches of a function and that the function doesn't return `undefined` without explicitly defining it.

```ts
// bad
function getNumber(): number {
  return 8;
}
// good
function getNumber() {
  return 8;
}
```

### Logger

---

Use logger.error for errors that should be logged in `drive-important.log` and logger.warn for all other errors. Almost all errors should be logged with logger.error. Do not concatenate strings in msg, otherwise it's more difficult to extend a log and also we won't have multiple colors for each prop.

```ts
logger.debug({
  tag: 'TAG',
  msg: 'Some message',
  prop1,
  prop2,
});
```

### Comments

---

```ts
/**
 * vX.X.X Author
 * Explain why it's done that way, not what it does.
 * We should be able to understand what it does by reading the code, but not why we did it that way; that's the point of the comment.
 * Also, don't delete these comments. The plan is for it to function as an Architecture Decision Record.
 * Whenever we change something, we should retain the comments from the previous version to see the history of the decision.
 */
```

### Frontend

We'll follow a structure similar to Angular's with services and components. The service will be a hook that manages all the logic. Both the service and the component will be stored in the same file.

```ts
export function useComponent() {
  const { t } = useI18n();
  const { data, status } = useCustomHook();

  const value = useMemo(() => {
    switch (status) {
      case 'loading':
        return t('loading');
      case 'error':
        return '';
      case 'success': {
        return data;
      }
    }
  }, [status]);

  return { value };
}

export function Component() {
  const { value } = useComponent();
  return <p>{value}</p>;
}
```
