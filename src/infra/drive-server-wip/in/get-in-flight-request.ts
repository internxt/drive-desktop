import { paths } from '@/apps/shared/HttpClient/schema';

const inFlightRequests = new Map<string, Promise<unknown>>();

export function getRequestKey({
  endpoint,
  method,
  context = {},
}: {
  endpoint: keyof paths;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  context?: Record<string, unknown>;
}) {
  return `${endpoint}-${method}-${JSON.stringify(context)}`;
}

export function getInFlightRequest<T>({ key, promiseFn }: { key: string; promiseFn: () => Promise<T> }) {
  const inFlightRequest = inFlightRequests.get(key);

  if (inFlightRequest) {
    return {
      reused: true,
      promise: inFlightRequest as Promise<T>,
    };
  }

  const promise = promiseFn();
  inFlightRequests.set(key, promise);
  promise.finally(() => {
    inFlightRequests.delete(key);
  });

  return {
    reused: false,
    promise,
  };
}
