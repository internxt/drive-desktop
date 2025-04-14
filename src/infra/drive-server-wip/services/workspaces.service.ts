import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';

export function getWorkspaces() {
  const promise = client.GET('/workspaces');

  return clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspaces request was not successful',
      attributes: {
        method: 'GET',
        endpoint: '/workspaces',
      },
    },
  });
}

export function getCredentials({ workspaceId }: { workspaceId: string }) {
  const promise = client.GET('/workspaces/{workspaceId}/credentials', {
    params: { path: { workspaceId } },
  });

  return clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspace credentials request was not successful',
      context: {
        workspaceId,
      },
      attributes: {
        method: 'GET',
        endpoint: '/workspaces/{workspaceId}/credentials',
      },
    },
  });
}
