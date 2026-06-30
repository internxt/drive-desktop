# Contributing

## Table of Contents

- [Contributing](#contributing)
  - [Table of Contents](#table-of-contents)
  - [Reporting issues](#reporting-issues)
  - [Architecture](#architecture)
  - [Code](#code)
    - [File template](#file-template)
    - [Testing](#testing)
    - [Imports](#imports)
    - [Use object props instead of multiple props](#use-object-props-instead-of-multiple-props)
    - [Logger](#logger)
    - [Comments](#comments)

## Reporting issues

We no longer use GitHub Issues as the main place to report problems with the app.

If you run into an issue, please contact our customer support team instead ad hello@internxt.com. This helps us keep all reports in one place, understand how often an issue happens, and follow up more effectively.

GitHub Issues are not ideal for support requests because they can make it harder to track duplicates, measure impact, and protect sensitive information. They also take time away from development when used as a support channel.

Thank you for helping us keep issue reporting clear, safe, and useful for everyone.

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
