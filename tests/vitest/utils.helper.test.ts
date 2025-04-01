/* eslint-disable @typescript-eslint/no-explicit-any */

import { DeepPartial } from 'ts-essentials';
import { MockedFunction } from 'vitest';

export function getMockCalls(object: { mock: { calls: any[] } }) {
  return object.mock.calls.map((call) => call[0]);
}

export function mockProps<T extends (...args: any[]) => unknown>(props: DeepPartial<Parameters<T>[0]>) {
  return props as Parameters<T>[0];
}

export function deepMocked<T extends (...args: any[]) => unknown>(fn: T) {
  return vi.mocked(fn) as MockedFunction<(...args: Parameters<T>) => DeepPartial<ReturnType<T>>>;
}
