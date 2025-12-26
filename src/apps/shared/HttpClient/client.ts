import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import eventBus from '@/apps/main/event-bus';
import { getAuthHeaders } from '@/apps/main/auth/headers';
import { scheduleFetch } from './schedule-fetch';
import { AuthContext } from '@/apps/sync-engine/config';

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
      eventBus.emit('USER_LOGGED_OUT');
    }
  },
};

export const client = createClient<paths>({
  baseUrl: process.env.DRIVE_URL,
  fetch: scheduleFetch,
});

client.use(middleware);
