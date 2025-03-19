import { DeepPartial } from 'ts-essentials';

type TClass = { run: (...args: Array<unknown>) => unknown };

export function mockProps<T extends TClass>(props: DeepPartial<Parameters<T['run']>[0]>) {
  return props as Parameters<T['run']>[0];
}
