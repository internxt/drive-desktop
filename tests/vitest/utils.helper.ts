import { DeepPartial } from 'ts-essentials';
import { MockedFunction, MockInstance } from 'vitest';
import { loggerMock } from './mocks.helper';

function getCalls(object: any) {
  return object.mock.calls.map((call: any) => {
    if (call.length === 1) return call[0];
    return call;
  });
}

export function calls(object: any) {
  return expect(getCalls(object));
}

export function call(object: any) {
  const calls = getCalls(object);
  if (calls.length !== 1) throw new Error(`Invalid length in ${object.getMockName()}: ${calls.length} calls`);
  return expect(calls[0]);
}

export function mockProps<T extends (...args: any[]) => unknown>(props: DeepPartial<Parameters<T>[0]>) {
  const result = props as Parameters<T>[0];
  result.ctx = { ...result.ctx, logger: loggerMock };
  return result;
}

export function deepMocked<T extends (...args: any[]) => unknown>(fn: T) {
  return vi.mocked(fn) as MockedFunction<(...args: Parameters<T>) => DeepPartial<ReturnType<T>>>;
}

export function testSleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * v2.5.1 Daniel Jiménez
 * Code extracted from vitest
 * https://github.com/vitest-dev/vitest/blob/c1f78d2adc78ef08ef8b61b0dd6a925fb08f20b6/packages/spy/src/index.ts#L464
 */
type Procedure = (...args: any[]) => any;
type Methods<T> = keyof { [K in keyof T as T[K] extends Procedure ? K : never]: T[K] };
type Classes<T> = { [K in keyof T]: T[K] extends new (...args: any[]) => any ? K : never }[keyof T] & (string | symbol);
export function partialSpyOn<T, M extends Classes<Required<T>> | Methods<Required<T>>>(obj: T, methodName: M, mock = true) {
  type Fn = Required<T>[M] extends (...args: any[]) => any ? Required<T>[M] : never;
  const objSpy = vi.spyOn(obj as Required<T>, methodName);
  // @ts-expect-error by default we want to remove always the real implementation
  // se we don't run unexpected code
  if (mock) objSpy.mockImplementation(() => {});
  return objSpy as MockInstance<(...args: Parameters<Fn>) => DeepPartial<ReturnType<Fn>>>;
}
