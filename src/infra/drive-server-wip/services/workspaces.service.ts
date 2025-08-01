import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { paths } from '@internxt/drive-desktop-core/build/backend';
import { getRequestKey } from '../in/get-in-flight-request';
import { getFilesByFolder } from './workspaces/get-files-by-folder';
import { getFoldersByFolder } from './workspaces/get-folders-by-folder';

type QueryFilesInWorkspace = paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'];
type QueryFoldersInWorkspace = paths['/workspaces/{workspaceId}/folders']['get']['parameters']['query'];
type CreateFileInWorkspaceBody = paths['/workspaces/{workspaceId}/files']['post']['requestBody']['content']['application/json'];
type CreateFolderInWorkspaceBody = paths['/workspaces/{workspaceId}/folders']['post']['requestBody']['content']['application/json'];

export const workspaces = {
  getWorkspaces,
  getCredentials,
  getFilesInWorkspace,
  getFoldersInWorkspace,
  createFileInWorkspace,
  createFolderInWorkspace,
  getFilesByFolder,
  getFoldersByFolder,
};

async function getWorkspaces() {
  const method = 'GET';
  const endpoint = '/workspaces';
  const key = getRequestKey({ method, endpoint });

  const promiseFn = () => client.GET(endpoint);

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get workspaces request',
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function getCredentials(context: { workspaceId: string }) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/credentials';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { workspaceId: context.workspaceId } },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get workspace credentials request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function getFilesInWorkspace(context: { workspaceId: string; query: QueryFilesInWorkspace }) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: {
        path: { workspaceId: context.workspaceId },
        query: context.query,
      },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get workspace files request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function getFoldersInWorkspace(context: { workspaceId: string; query: QueryFoldersInWorkspace }) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: {
        path: { workspaceId: context.workspaceId },
        query: context.query,
      },
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get workspace folders request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function createFileInWorkspace(context: { workspaceId: string; path: string; body: CreateFileInWorkspaceBody }) {
  const method = 'POST';
  const endpoint = '/workspaces/{workspaceId}/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      params: { path: { workspaceId: context.workspaceId } },
      body: context.body,
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create file in workspace request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}

async function createFolderInWorkspace(context: { path: string; workspaceId: string; body: CreateFolderInWorkspaceBody }) {
  const method = 'POST';
  const endpoint = '/workspaces/{workspaceId}/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.POST(endpoint, {
      params: { path: { workspaceId: context.workspaceId } },
      body: context.body,
    });

  return await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create folder in workspace request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
}
