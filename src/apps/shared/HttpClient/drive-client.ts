import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { getConfig } from '@/apps/sync-engine/config';

const onUserUnauthorized = () => ipcRendererSyncEngine.emit('USER_IS_UNAUTHORIZED');

const newDriveHeadersProvider = () => ipcRendererSyncEngine.invoke('GET_HEADERS');

const middleware: Middleware = {
  async onRequest({ request }) {
    const headers = await newDriveHeadersProvider();

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
      onUserUnauthorized();
    }
  },
};

const driveClient = createClient<paths>({ baseUrl: `${process.env.NEW_DRIVE_URL}/drive` });

driveClient.use(middleware);

export { driveClient };
