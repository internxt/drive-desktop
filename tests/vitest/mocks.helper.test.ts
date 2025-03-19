import { DeepPartial } from 'ts-essentials';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TClass = { run: (props: any) => unknown };

export function mockProps<T extends TClass>(props: DeepPartial<Parameters<T['run']>[0]>) {
  return props as Parameters<T['run']>[0];
}
