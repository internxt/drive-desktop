import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { getConfig } from '../../sync-engine/config';
import eventBus from '@/apps/main/event-bus';
import { getAuthHeaders } from '@/apps/main/auth/headers';
import { scheduleFetch } from './schedule-fetch';

export const getWorkspaceHeader = ({ workspaceToken }: { workspaceToken: string }) => {
  return { 'x-internxt-workspace': workspaceToken };
};

const middleware: Middleware = {
  onRequest({ request }) {
    const headers = getAuthHeaders();

    const workspaceToken = getConfig().workspaceToken;
    if (workspaceToken) {
      headers['x-internxt-workspace'] = workspaceToken;
    }

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
