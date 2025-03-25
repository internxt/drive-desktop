/* eslint-disable @typescript-eslint/no-explicit-any */

import { DeepPartial } from 'ts-essentials';

export function getMockCalls(object: { mock: { calls: any[] } }) {
  return object.mock.calls.map((call) => call[0]);
}

export function mockProps<T extends (...args: any[]) => unknown>(props: DeepPartial<Parameters<T>[0]>) {
  return props as Parameters<T>[0];
}

export function mockFn<T extends (...args: any[]) => unknown>(res: DeepPartial<ReturnType<T>>) {
  return () => res as ReturnType<T>;
}

export function mockAsyncFn<T extends (...args: any[]) => unknown>(res: DeepPartial<Awaited<ReturnType<T>>>) {
  return () => res as ReturnType<T>;
}
