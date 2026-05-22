import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { paths } from '@/apps/shared/HttpClient/schema';

export type DedupeKey = `request${string}` | `createFile${string}`;

const inFlightPromises = new Map<DedupeKey, Promise<unknown>>();

export function getRequestKey({
  endpoint,
  method,
  context = {},
}: {
  endpoint: keyof paths;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  context?: Record<string, unknown>;
}): DedupeKey {
  return `request${endpoint}-${method}-${JSON.stringify(context)}`;
}

export function getCreateFileKey({ path }: { path: AbsolutePath }): DedupeKey {
  return `createFile${path}`;
}

export function getInFlightRequest<T>({ key, promiseFn }: { key: DedupeKey; promiseFn: () => Promise<T> }) {
  const inFlightRequest = inFlightPromises.get(key);

  if (inFlightRequest) {
    return {
      reused: true,
      promise: inFlightRequest as Promise<T>,
    };
  }

  const promise = promiseFn().finally(() => {
    inFlightPromises.delete(key);
  });

  inFlightPromises.set(key, promise);

  return {
    reused: false,
    promise,
  };
}
