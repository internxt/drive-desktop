import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';
import { paths } from '@/apps/shared/HttpClient/schema';
import { getRequestKey } from '../in/get-in-flight-request';
import { createFile } from './workspaces/create-file';
import { parseFileDto, parseFolderDto } from '../out/dto';
import { createFolder } from './workspaces/create-folder';
import { SyncContext } from '@/apps/sync-engine/config';

type QueryFilesInWorkspace = paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'];
type QueryFoldersInWorkspace = paths['/workspaces/{workspaceId}/folders']['get']['parameters']['query'];

export const workspaces = {
  getWorkspaces,
  getCredentials,
  getFiles,
  getFolders,
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
    loggerBody: { msg: 'Get workspaces request' },
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
    loggerBody: { msg: 'Get workspace credentials request', context },
  });
}

async function getFiles({ ctx, query, skipLog }: { ctx: SyncContext; query: QueryFilesInWorkspace; skipLog?: boolean }) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/files';

  const context = { path: { workspaceId: ctx.workspaceId }, query };
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      signal: ctx.abortController.signal,
      params: {
        path: context.path,
        query: context.query,
      },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    skipLog,
    loggerBody: { msg: 'Get workspace files request', context },
  });

  if (data) {
    return { data: data.map((fileDto) => parseFileDto({ fileDto })) };
  } else {
    return { error };
  }
}

async function getFolders({ ctx, query, skipLog }: { ctx: SyncContext; query: QueryFoldersInWorkspace; skipLog?: boolean }) {
  const method = 'GET';
  const endpoint = '/workspaces/{workspaceId}/folders';

  const context = { path: { workspaceId: ctx.workspaceId }, query };
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      signal: ctx.abortController.signal,
      params: {
        path: context.path,
        query: context.query,
      },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    skipLog,
    loggerBody: { msg: 'Get workspace folders request', context },
  });

  if (data) {
    return { data: data.map((folderDto) => parseFolderDto({ folderDto })) };
  } else {
    return { error };
  }
}
