import { DeepPartial } from 'ts-essentials';
import { MockedFunction } from 'vitest';
import { loggerMock } from './mocks.helper.test';

export type TestProps<T extends (...args: any) => any> = DeepPartial<Parameters<T>[0]>;

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
 * v2.5.6 Daniel Jiménez
 * Code extracted from vitest
 * https://github.com/vitest-dev/vitest/blob/c1f78d2adc78ef08ef8b61b0dd6a925fb08f20b6/packages/spy/src/index.ts#L464
 */
export { partialSpyOn } from './partial-spy-on.helper';
