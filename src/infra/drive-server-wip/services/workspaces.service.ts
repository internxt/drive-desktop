import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';

type QueryFilesInWorkspace = paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'];
type QueryFoldersInWorkspace = paths['/workspaces/{workspaceId}/folders']['get']['parameters']['query'];

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

export function getCredentials(context: { workspaceId: string }) {
  const promise = client.GET('/workspaces/{workspaceId}/credentials', {
    params: { path: { workspaceId: context.workspaceId } },
  });

  return clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspace credentials request was not successful',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/workspaces/{workspaceId}/credentials',
      },
    },
  });
}

export function getFilesInWorkspace(context: { workspaceId: string; query: QueryFilesInWorkspace }) {
  const promise = client.GET('/workspaces/{workspaceId}/files', {
    params: {
      path: { workspaceId: context.workspaceId },
      query: context.query,
    },
  });

  return clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspace files request was not successful',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/workspaces/{workspaceId}/files',
      },
    },
  });
}

export function getFoldersInWorkspace(context: { workspaceId: string; query: QueryFoldersInWorkspace }) {
  const promise = client.GET('/workspaces/{workspaceId}/folders', {
    params: {
      path: { workspaceId: context.workspaceId },
      query: context.query,
    },
  });

  return clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspace folders request was not successful',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/workspaces/{workspaceId}/folders',
      },
    },
  });
}
