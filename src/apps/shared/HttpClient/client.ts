import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { getNewApiHeaders } from '../../../apps/main/auth/service';
import { onUserUnauthorized } from './background-process-clients';
import { getConfig } from '../../sync-engine/config';
import { ipcRendererSyncEngine } from '../../sync-engine/ipcRendererSyncEngine';

const getHeaders = async () => {
  const providerId = getConfig().providerId;
  if (providerId) {
    return await ipcRendererSyncEngine.invoke('GET_HEADERS');
  }
  return getNewApiHeaders();
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
      // logger.warn({ msg: 'Request unauthorized' });
      onUserUnauthorized();
    }
  },
};

export const client = createClient<paths>({ baseUrl: `${process.env.NEW_DRIVE_URL}/drive` });
export const clientService = client;

client.use(middleware);
