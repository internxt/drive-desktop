import type { DeepPartial } from 'ts-essentials';
import type { MockInstance } from 'vitest';

type Procedure = (...args: any[]) => any;
type Methods<T> = keyof { [K in keyof T as T[K] extends Procedure ? K : never]: T[K] };
type Classes<T> = { [K in keyof T]: T[K] extends new (...args: any[]) => any ? K : never }[keyof T] & (string | symbol);

/*
 * v2.6.10 Alexis Mora
 * Renderer tests must import this helper directly. Importing it through
 * utils.helper.test.ts loads Node/main-process dependencies, eventually
 * reaching node:sqlite, which Vitest 4 cannot bundle for jsdom.
 */
export function partialSpyOn<T, M extends Classes<Required<T>> | Methods<Required<T>>>(obj: T, methodName: M, mock = true) {
  type Fn = Required<T>[M] extends (...args: any[]) => any ? Required<T>[M] : never;
  const objSpy = vi.spyOn(obj as Required<T>, methodName);
  // @ts-expect-error Tests return partial values and should not call the real implementation by default.
  if (mock) objSpy.mockImplementation(() => {});
  return objSpy as MockInstance<(...args: Parameters<Fn>) => DeepPartial<ReturnType<Fn>>>;
}
