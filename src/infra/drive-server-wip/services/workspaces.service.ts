import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';
import { getRequestKey } from '../in/get-in-flight-request';
import { createFile } from './workspaces/create-file';
import { parseFileDto, parseFolderDto } from '../out/dto';
import { createFolder } from './workspaces/create-folder';

type QueryFilesInWorkspace = paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'];
type QueryFoldersInWorkspace = paths['/workspaces/{workspaceId}/folders']['get']['parameters']['query'];

export const workspaces = {
  getWorkspaces,
  getCredentials,
  getFilesInWorkspace,
  getFoldersInWorkspace,
  createFile,
  createFolder,
};
export const WorkspaceModule = workspaces;

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

async function getFilesInWorkspace(
  context: { workspaceId: string; query: QueryFilesInWorkspace },
  extra?: { abortSignal: AbortSignal; skipLog?: boolean },
) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/files';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      signal: extra?.abortSignal,
      params: {
        path: { workspaceId: context.workspaceId },
        query: context.query,
      },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    skipLog: extra?.skipLog,
    loggerBody: { msg: 'Get workspace files request', context },
  });

  if (data) {
    return { data: data.map((fileDto) => parseFileDto({ fileDto })) };
  } else {
    return { error };
  }
}

async function getFoldersInWorkspace(
  context: { workspaceId: string; query: QueryFoldersInWorkspace },
  extra?: { abortSignal: AbortSignal; skipLog?: boolean },
) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/folders';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      signal: extra?.abortSignal,
      params: {
        path: { workspaceId: context.workspaceId },
        query: context.query,
      },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    skipLog: extra?.skipLog,
    loggerBody: { msg: 'Get workspace folders request', context },
  });

  if (data) {
    return { data: data.map((folderDto) => parseFolderDto({ folderDto })) };
  } else {
    return { error };
  }
}
