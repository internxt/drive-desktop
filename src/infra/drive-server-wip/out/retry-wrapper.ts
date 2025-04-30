import { sleep } from '@/apps/main/util';

type TProps<T> = {
  promise: () => Promise<{ data: T; error: undefined } | { data: undefined; error: unknown }>;
  maxRetries?: number;
  sleepMs?: number;
  retry?: number;
};

export async function retryWrapper<T>({ promise, maxRetries = 3, sleepMs = 5000, retry = 1 }: TProps<T>): Promise<NonNullable<T>> {
  const { data, error } = await promise();

  if (data) return data;

  if (retry >= maxRetries) throw error;

  await sleep(sleepMs);
  return await retryWrapper({
    promise,
    maxRetries,
    sleepMs,
    retry: retry + 1,
  });
}
