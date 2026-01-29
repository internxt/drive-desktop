import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { getAuthHeaders } from '@/apps/main/auth/headers';
import { getRequestPriority, scheduleFetch } from './schedule-fetch';
import { AuthContext } from '@/apps/sync-engine/config';
import { onUserUnauthorized } from '@/apps/main/auth/handlers';
import Bottleneck from 'bottleneck';

export function getWorkspaceHeader({ ctx }: { ctx: AuthContext }) {
  return { 'x-internxt-workspace': ctx.workspaceToken };
}

const middleware: Middleware = {
  onRequest({ request }) {
    const headers = getAuthHeaders();

    Object.entries(headers).forEach(([key, value]) => {
      request.headers.set(key, value);
    });

    return request;
  },
  onResponse({ response }) {
    if (response.status === 401) {
      onUserUnauthorized();
    }
  },
};

export const client = createClient<paths>({
  baseUrl: process.env.DRIVE_URL,
  fetch: scheduleFetch,
});

client.use(middleware);

export function createWipClient() {
  const driveApiBottleneck = new Bottleneck({ maxConcurrent: 2, minTime: 500 });

  const client = createClient<paths>({
    baseUrl: process.env.DRIVE_URL,
    fetch: (input) => {
      const priority = getRequestPriority(input.method, input.url);
      return driveApiBottleneck.schedule({ priority }, () => fetch(input));
    },
  });

  client.use(middleware);

  return { driveApiBottleneck, client };
}
