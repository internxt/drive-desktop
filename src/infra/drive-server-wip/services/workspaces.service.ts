import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';

type QueryFilesInWorkspace = paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'];
type QueryFoldersInWorkspace = paths['/workspaces/{workspaceId}/folders']['get']['parameters']['query'];
type CreateFileInWorkspaceBody = paths['/workspaces/{workspaceId}/files']['post']['requestBody']['content']['application/json'];
type CreateFolderInWorkspaceBody = paths['/workspaces/{workspaceId}/folders']['post']['requestBody']['content']['application/json'];

export async function getWorkspaces() {
  const promise = () => client.GET('/workspaces');

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspaces request',
      attributes: {
        method: 'GET',
        endpoint: '/workspaces',
      },
    },
  });
}

export async function getCredentials(context: { workspaceId: string }) {
  const promise = () =>
    client.GET('/workspaces/{workspaceId}/credentials', {
      params: { path: { workspaceId: context.workspaceId } },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspace credentials request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/workspaces/{workspaceId}/credentials',
      },
    },
  });
}

export async function getFilesInWorkspace(context: { workspaceId: string; query: QueryFilesInWorkspace }) {
  const promise = () =>
    client.GET('/workspaces/{workspaceId}/files', {
      params: {
        path: { workspaceId: context.workspaceId },
        query: context.query,
      },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspace files request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/workspaces/{workspaceId}/files',
      },
    },
  });
}

export async function getFoldersInWorkspace(context: { workspaceId: string; query: QueryFoldersInWorkspace }) {
  const promise = () =>
    client.GET('/workspaces/{workspaceId}/folders', {
      params: {
        path: { workspaceId: context.workspaceId },
        query: context.query,
      },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get workspace folders request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/workspaces/{workspaceId}/folders',
      },
    },
  });
}

export async function createFileInWorkspace(context: { workspaceId: string; body: CreateFileInWorkspaceBody }) {
  const promise = () =>
    client.POST('/workspaces/{workspaceId}/files', {
      params: { path: { workspaceId: context.workspaceId } },
      body: context.body,
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Create file in workspace request',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/workspaces/{workspaceId}/files',
      },
    },
  });
}

export async function createFolderInWorkspace(context: { workspaceId: string; body: CreateFolderInWorkspaceBody }) {
  const promise = () =>
    client.POST('/workspaces/{workspaceId}/folders', {
      params: { path: { workspaceId: context.workspaceId } },
      body: context.body,
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Create folder in workspace request',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/workspaces/{workspaceId}/folders',
      },
    },
  });
}
