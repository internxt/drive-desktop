import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { getConfig } from '../../sync-engine/config';
import { ipcRendererSyncEngine } from '../../sync-engine/ipcRendererSyncEngine';
import eventBus from '@/apps/main/event-bus';
import { getAuthHeaders } from '@/apps/main/auth/headers';
import { scheduleFetch } from './schedule-fetch';

export const getHeaders = async () => {
  if (process.type === 'renderer') return await ipcRendererSyncEngine.invoke('GET_HEADERS');
  return getAuthHeaders();
};

export const getWorkspaceHeader = ({ workspaceToken }: { workspaceToken: string }) => {
  return { 'x-internxt-workspace': workspaceToken };
};

const handleOnUserUnauthorized = () => {
  if (process.type === 'renderer') {
    ipcRendererSyncEngine.emit('USER_LOGGED_OUT');
  } else {
    eventBus.emit('USER_LOGGED_OUT');
  }
};

const middleware: Middleware = {
  async onRequest({ request }) {
    const headers = await getHeaders();

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
      handleOnUserUnauthorized();
    }
  },
};

export const client = createClient<paths>({
  baseUrl: process.env.DRIVE_URL,
  fetch: scheduleFetch,
});

client.use(middleware);
