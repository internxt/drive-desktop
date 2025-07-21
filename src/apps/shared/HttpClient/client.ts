import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { logout } from '../../../apps/main/auth/service';
import { getConfig } from '../../sync-engine/config';
import { ipcRendererSyncEngine } from '../../sync-engine/ipcRendererSyncEngine';
import eventBus from '@/apps/main/event-bus';
import Bottleneck from 'bottleneck';
import { getAuthHeaders } from '@/apps/main/auth/headers';

export const getHeaders = async () => {
  if (process.type === 'renderer') return await ipcRendererSyncEngine.invoke('GET_HEADERS');
  return getAuthHeaders();
};

export const getWorkspaceHeader = ({ workspaceToken }: { workspaceToken: string }) => {
  return { 'x-internxt-workspace': workspaceToken };
};

const handleOnUserUnauthorized = () => {
  if (process.type === 'renderer') {
    ipcRendererSyncEngine.emit('USER_IS_UNAUTHORIZED');
  } else {
    eventBus.emit('USER_WAS_UNAUTHORIZED');
    logout();
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

const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500,
});

export const client = createClient<paths>({
  baseUrl: process.env.DRIVE_URL,
  fetch: limiter.wrap(fetch),
});

client.use(middleware);
