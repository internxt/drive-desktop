import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { paths } from '@/apps/shared/HttpClient/schema';

type Key = `request${string}` | `createFile${string}`;

const inFlightRequests = new Map<Key, Promise<unknown>>();

export function getRequestKey({
  endpoint,
  method,
  context = {},
}: {
  endpoint: keyof paths;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  context?: Record<string, unknown>;
}): Key {
  return `request${endpoint}-${method}-${JSON.stringify(context)}`;
}

export function getCreateFileKey({ path }: { path: AbsolutePath }): Key {
  return `createFile${path}`;
}

export function getInFlightRequest<T>({ key, promiseFn }: { key: Key; promiseFn: () => Promise<T> }) {
  const inFlightRequest = inFlightRequests.get(key);

  if (inFlightRequest) {
    return {
      reused: true,
      promise: inFlightRequest as Promise<T>,
    };
  }

  const promise = promiseFn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);

  return {
    reused: false,
    promise,
  };
}
