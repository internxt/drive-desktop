import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { clientWrapper } from '../in/client-wrapper.service';
import { createFolder } from './folders/create-folder';

export const folders = {
  createFolder,
  getMetadata,
  getMetadataWithUuid,
  getFolders,
  getFoldersByFolder,
  getFilesByFolder,
  moveFolder,
  renameFolder,
  existsFolder,
};

type TGetFoldersQuery = paths['/folders']['get']['parameters']['query'];
type TGetFoldersByFolderQuery = paths['/folders/content/{uuid}/folders']['get']['parameters']['query'];
type TGetFilesByFolderQuery = paths['/folders/content/{uuid}/files']['get']['parameters']['query'];

async function getMetadata(context: { folderId: number }) {
  const promise = () =>
    client.GET('/folders/{id}/metadata', {
      params: { path: { id: context.folderId } },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get folder metadata request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/folders/{id}/metadata',
      },
    },
  });
}

async function getMetadataWithUuid(context: { uuid: string }) {
  const promise = () =>
    client.GET('/folders/{uuid}/meta', {
      params: { path: { uuid: context.uuid } },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get folder metadata request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/folders/{uuid}/meta',
      },
    },
  });
}

async function getFolders(context: { query: TGetFoldersQuery }) {
  const promise = () => client.GET('/folders', { params: { query: context.query } });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get folders request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/folders',
      },
    },
  });
}

async function getFoldersByFolder(context: { folderUuid: string; query: TGetFoldersByFolderQuery }) {
  const promise = () =>
    client.GET('/folders/content/{uuid}/folders', {
      params: { path: { uuid: context.folderUuid }, query: context.query },
    });

  const res = await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get folders by folder request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/folders/content/{uuid}/folders',
      },
    },
  });

  if (res.data) {
    return { data: res.data.folders };
  } else {
    return { error: res.error };
  }
}

async function getFilesByFolder(context: { folderUuid: string; query: TGetFilesByFolderQuery }) {
  const promise = () =>
    client.GET('/folders/content/{uuid}/files', {
      params: { path: { uuid: context.folderUuid }, query: context.query },
    });

  const res = await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Get files by folder request',
      context,
      attributes: {
        method: 'GET',
        endpoint: '/folders/content/{uuid}/files',
      },
    },
  });

  if (res.data) {
    return { data: res.data.files };
  } else {
    return { error: res.error };
  }
}

async function moveFolder(context: { uuid: string; parentUuid: string }) {
  const promise = () =>
    client.PATCH('/folders/{uuid}', {
      params: { path: { uuid: context.uuid } },
      body: { destinationFolder: context.parentUuid },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Move folder request',
      context,
      attributes: {
        method: 'PATCH',
        endpoint: '/folders/{uuid}',
      },
    },
  });
}

async function renameFolder(context: { uuid: string; plainName: string }) {
  const promise = () =>
    client.PUT('/folders/{uuid}/meta', {
      params: { path: { uuid: context.uuid } },
      body: { plainName: context.plainName },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Rename folder request',
      context,
      attributes: {
        method: 'PUT',
        endpoint: '/folders/{uuid}/meta',
      },
    },
  });
}

async function existsFolder(context: { parentUuid: string; basename: string }) {
  const promise = () =>
    client.POST('/folders/content/{uuid}/folders/existence', {
      params: { path: { uuid: context.parentUuid } },
      body: { plainNames: [context.basename] },
    });

  return await clientWrapper({
    promise,
    loggerBody: {
      msg: 'Check folder existence request',
      context,
      attributes: {
        method: 'POST',
        endpoint: '/folders/content/{uuid}/folders/existence',
      },
    },
  });
}
