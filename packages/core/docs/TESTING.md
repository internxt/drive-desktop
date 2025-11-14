# Testing

## Table of Contents

- [Types](#types)
- [Describe](#describe)
- [Mocks](#mocks)
- [Assert](#assert)
- [Structure](#structure)
- [Frontend](#frontend)

## Types

- Unit tests (`service.test.ts`). It just tests the service function inside the file and mocks all other functions.
- Infra tests (`anything.infra.test.ts`). It tests multiple functions and not only a service function or it is a long test. We want to keep these tests in a separate runner so as not to block the main runner with slow tests.

## Describe

Use `name-of-file` in describe. Why?

- The file can have more that one function.
- In an infra test maybe we are not calling a function directly; for example, we may use the watcher.

```ts
describe('name-of-file', () => {});
```

## Mocks

By default use `partialSpyOn` in all mocks. Node modules are the only ones that need `vi.mock` and `deepMocked`.

```ts
import * as depModule from 'module';

describe('name-of-file', () => {
  const depMock = partialSpyOn(depModule, 'dep');

  beforeEach(() => {
    depMock.mockReturnValue('value');
  });
});
```

```ts
import { dep } from 'node-module';

vi.mock(import('node-module'));

describe('name-of-file', () => {
  const depMock = deepMocked(dep);

  beforeEach(() => {
    depMock.mockReturnValue('value');
  });
});
```

## Assert

To check the calls of a depMock we use `call` (just one call) or `calls` (0 or more calls). We use only `toHaveLength`, `toBe`, `toMatchObject` and `toStrictEqual` for assertions.

```ts
import * as depModule from 'module';

describe('name-of-file', () => {
  const depMock = partialSpyOn(depModule, 'dep');

  it('should do x when y', () => {
    // When
    const res = fn();
    // Then
    expect(res).toHaveLength();
    expect(res).toBe();
    expect(res).toMatchObject();
    expect(res).toStrictEqual();

    call(depMock).toBe();
    call(depMock).toMatchObject();
    call(depMock).toStrictEqual();

    calls(depMock).toHaveLength();
    calls(depMock).toMatchObject();
    calls(depMock).toStrictEqual();
  });
});
```

## Structure

```ts
import * as dep1Module from 'module';
import * as dep2Module from 'module';

describe('name-of-file', () => {
  const dep1Mock = partialSpyOn(dep1Module, 'dep');
  const dep2Mock = partialSpyOn(dep2Module, 'dep');

  let props: Parameters<typeof fn>[0];

  beforeEach(() => {
    dep1Mock.mockReturnValue('value1');
    dep2Mock.mockReturnValue('value1');

    props = mockProps<typeof fn>({ prop: 'prop1' });
  });

  it('should do x when y', () => {
    // Given
    dep1Mock.mockReturnValue('value2');
    props.prop = 'prop2';
    // When
    const res = fn(props);
    // Then
    expect(res).toMatchObject([{ res: 'value2' }, { res: 'value1' }]);
    call(dep1Mock).toStrictEqual([{ prop: 'prop2' }]);
  });
});
```

## Frontend

Testing the frontend is more complicated due to all the possible interactions we have. Therefore, to keep it as testable as possible and with as little code as possible, we'll only test the component logic (service).

```ts
import { renderHook } from '@testing-library/react-hooks';
import * as depModule from 'module';

describe('name-of-file', () => {
  const depMock = partialSpyOn(depModule, 'dep');

  it('should do x when y', () => {
    // Given
    depMock.mockReturnValue('value1');
    // When
    const { result, rerender } = renderHook(() => useComponent());
    // Then
    expect(result.current.value).toBe('value1');
    // Given
    depMock.mockReturnValue('value2');
    // When
    rerender();
    // Then
    expect(result.current.value).toBe('value2');
  });
});
```
