import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { getNewApiHeaders, logout } from '../../../apps/main/auth/service';
import { getConfig } from '../../sync-engine/config';
import { ipcRendererSyncEngine } from '../../sync-engine/ipcRendererSyncEngine';
import eventBus from '@/apps/main/event-bus';
import Bottleneck from 'bottleneck';

export const getHeaders = async () => {
  const providerId = getConfig().providerId;
  if (providerId) {
    return await ipcRendererSyncEngine.invoke('GET_HEADERS');
  }
  return getNewApiHeaders();
};

const handleOnUserUnauthorized = () => {
  const providerId = getConfig().providerId;
  if (providerId) {
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
  baseUrl: process.env.NEW_DRIVE_URL,
  fetch: limiter.wrap(fetch),
});

client.use(middleware);
