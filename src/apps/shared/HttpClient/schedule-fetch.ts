import Bottleneck from 'bottleneck';
import { paths } from './schema';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const PRIORITIES: Array<{ method: Method; path: keyof paths; priority: number }> = [
  { method: 'POST', path: '/files', priority: 9 },
  { method: 'POST', path: '/folders', priority: 9 },
];

const limiter = new Bottleneck({ maxConcurrent: 2, minTime: 500 });

export function getRequestPriority(method: string, url: string) {
  const path = url.replace(process.env.DRIVE_URL, '');
  const item = PRIORITIES.find((i) => method === i.method && path === i.path);
  return item?.priority ?? 5;
}

export function scheduleFetch(input: Request, init?: RequestInit) {
  const priority = getRequestPriority(input.method, input.url);
  return limiter.schedule({ priority }, () => fetch(input, init));
}
