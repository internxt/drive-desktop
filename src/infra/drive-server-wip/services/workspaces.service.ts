import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';

type QueryFilesInWorkspace = paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'];
type QueryFilesInFolderInWorkspace = paths['/workspaces/{workspaceId}/folders/{folderUuid}/files']['get']['parameters']['query'];

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

export async function getFilesByFolderInWorkspace(context: {
  workspaceId: string;
  folderUuid: string;
  query: QueryFilesInFolderInWorkspace;
}) {
  const promise = client.GET('/workspaces/{workspaceId}/folders/{folderUuid}/files', {
    params: {
      path: { workspaceId: context.workspaceId, folderUuid: context.folderUuid },
      query: context.query,
    },
  });

  const res = await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspace files by folder request was not successful',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/workspaces/{workspaceId}/folders/{folderUuid}/files',
      },
    },
  });

  if (res.data) {
    return { data: res.data.result };
  } else {
    return { error: res.error };
  }
}
