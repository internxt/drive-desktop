import ConfigStore from '../../main/config-store'
import crypt from '../../renderer/logic/crypt'
import path from 'path'
import {
  Listing,
  FileSystem,
  FileSystemProgressCallback,
  Source,
  SyncFatalError,
  SyncError
} from '../sync'
import { Environment } from '@internxt/inxt-js'
import * as uuid from 'uuid'
import { getDateFromSeconds, getSecondsFromDateString } from '../utils'
import Logger from '../../libs/logger'
import { getHeaders, getUser } from '../../main/auth'
import { Readable } from 'stream'
import isOnline from '../../libs/is-online'

/**
 * Server cannot find a file given its route,
 * while we traverse the tree we also store in a cache
 * the info of every file by its route so we can operate with them
 */
type RemoteCache = Record<
  string,
  {
    id: number
    parentId: number
    isFolder: boolean
    bucket: string | null
    fileId?: string
    modificationTime?: number
    size?: number
  }
>

type ServerFile = {
  bucket: string
  createdAt: string
  encrypt_version: string
  fileId: string
  folderId: number
  id: number
  modificationTime: string
  name: string
  size: number
  type: string
  updatedAt: string
  userId: number
}

type ServerFolder = {
  bucket: string | null
  created_at: string
  id: number
  name: string
  parent_id: null | number
  updated_at: string
}

export function getRemoteFilesystem(baseFolderId: number): FileSystem {
  const headers = getHeaders() as HeadersInit
  const userInfo = getUser() as {
    email: string
    userId: string
    bucket: string
    bridgeUser: string
  }
  const mnemonic = ConfigStore.get('mnemonic') as string

  const cache: RemoteCache = {}

  async function getTree(): Promise<{
    files: ServerFile[]
    folders: ServerFolder[]
  }> {
    const PAGE_SIZE = 5000

    let thereIsMore = true
    let offset = 0

    const files: ServerFile[] = []
    const folders: ServerFolder[] = []

    while (thereIsMore) {
      const batch = await fetch(
        `${process.env.API_URL}/api/desktop/list/${offset}`,
        {
          method: 'GET',
          headers
        }
      ).then(res => res.json())

      files.push(...batch.files)
      folders.push(...batch.folders)

      thereIsMore = batch.folders.length === PAGE_SIZE

      if (thereIsMore) offset += PAGE_SIZE
    }

    return { files, folders }
  }

  async function handleFetchError(err: any) {
    Logger.info(`Handling fetch error: ${err.name} ${err.code} ${err.stack}`)

    if (await isOnline()) {
      throw new SyncError('NO_REMOTE_CONNECTION')
    } else {
      throw new SyncError('NO_INTERNET')
    }
  }

  return {
    kind: 'REMOTE',

    async getCurrentListing() {
      const tree = await getTree()

      const listing: Listing = {}

      traverse(baseFolderId)

      function traverse(currentId: number, currentName: string = '') {
        const filesInThisFolder = tree.files.filter(
          file => file.folderId === currentId
        )
        const foldersInThisFolder = tree.folders.filter(
          folder => folder.parent_id === currentId
        )

        filesInThisFolder.forEach(file => {
          const name =
            currentName +
            crypt.decryptName(file.name, file.folderId, file.encrypt_version) +
            (file.type ? `.${file.type}` : '')
          const modificationTime = getSecondsFromDateString(
            file.modificationTime
          )
          listing[name] = modificationTime
          cache[name] = {
            id: file.id,
            parentId: file.folderId,
            isFolder: false,
            bucket: file.bucket,
            fileId: file.fileId,
            modificationTime,
            size: file.size
          }
        })

        foldersInThisFolder.forEach(folder => {
          const name =
            currentName +
            crypt.decryptName(folder.name, folder.parent_id, '03-aes')
          cache[name] = {
            id: folder.id,
            parentId: folder.parent_id,
            isFolder: true,
            bucket: folder.bucket
          }
          traverse(folder.id, name + '/')
        })
      }

      return listing
    },

    async deleteFile(name: string): Promise<void> {
      const fileInCache = cache[name]

      if (fileInCache) {
        try {
          await fetch(
            `${process.env.API_URL}/api/storage/bucket/${fileInCache.bucket}/file/${fileInCache.fileId}`,
            { method: 'DELETE', headers }
          )
        } catch (err) {
          await handleFetchError(err)
        }
      } else {
        throw new Error(
          `${name} file not found in remote cache when tried to delete it`
        )
      }
    },

    async renameFile(oldName: string, newName: string): Promise<void> {
      const fileInCache = cache[oldName]
      const newNameBase = path.parse(newName).name

      if (fileInCache) {
        try {
          const res = await fetch(
            `${process.env.API_URL}/api/storage/file/${fileInCache.fileId}/meta`,
            {
              method: 'POST',
              headers: { ...headers, 'internxt-mnemonic': mnemonic },
              body: JSON.stringify({
                metadata: { itemName: newNameBase },
                bucketId: fileInCache.bucket,
                relativePath: uuid.v4()
              })
            }
          )
          if (!res.ok) {
            Logger.info(
              `Bad response from server while renaming`,
              JSON.stringify(res, null, 2)
            )
            throw new SyncError('BAD_RESPONSE')
          }
          delete cache[oldName]
          cache[newName] = fileInCache
        } catch (err) {
          await handleFetchError(err)
        }
      } else
        throw new Error(
          `${oldName} file not found in remote cache when tried to rename it`
        )
    },

    async pullFile(
      name: string,
      source: Source,
      progressCallback: (progress: number) => void
    ): Promise<void> {
      const { size, modTime: modTimeInSeconds } = source
      const route = name.split('/')

      const { name: baseNameWithoutExt, ext } = path.parse(route.pop())
      const fileType = ext.slice(1)

      let lastParentId = baseFolderId

      if (route.length > 0) {
        for (const [i, folderName] of route.entries()) {
          const routeToThisPoint = route.slice(0, i + 1).join('/')

          const folderInCache = cache[routeToThisPoint]

          if (folderInCache) lastParentId = folderInCache.id
          else {
            const createdFolder: ServerFolder = await fetch(
              `${process.env.API_URL}/api/storage/folder`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  folderName,
                  parentFolderId: lastParentId
                })
              }
            )
              .then(res => res.json())
              .catch(async err => {
                await handleFetchError(err)
              })
            lastParentId = createdFolder.id
            cache[routeToThisPoint] = {
              id: createdFolder.id,
              parentId: createdFolder.parent_id,
              isFolder: true,
              bucket: createdFolder.bucket
            }
          }
        }
      }

      const folderIdOfTheNewFile = lastParentId

      const localUpload = new Environment({
        bridgeUrl: process.env.BRIDGE_URL,
        bridgeUser: userInfo.bridgeUser,
        bridgePass: userInfo.userId,
        encryptionKey: mnemonic
      })

      const { bucket } = userInfo

      const uploadedFileId: string = await new Promise((resolve, reject) => {
        localUpload.upload(
          bucket,
          {
            name: uuid.v4(),
            progressCallback,
            finishedCallback: (err: any, fileId: string) => {
              if (err) reject(err)
              else resolve(fileId)
            }
          },
          {
            label: 'OneStreamOnly',
            params: {
              source,
              useProxy: false,
              concurrency: 10
            }
          }
        )
      })

      const oldFileInCache = cache[name]

      if (oldFileInCache) {
        try {
          await fetch(
            `${process.env.API_URL}/api/storage/bucket/${bucket}/file/${oldFileInCache.fileId}`,
            {
              method: 'DELETE',
              headers
            }
          )
        } catch (err) {
          Logger.error(
            `Error trying to delete outdated remote file. ${err.name} ${err.code} ${err.stack}`
          )
        }
      }

      const encryptedName = crypt.encryptName(
        baseNameWithoutExt,
        folderIdOfTheNewFile
      )

      const modificationTime = getDateFromSeconds(modTimeInSeconds)

      try {
        const res = await fetch(`${process.env.API_URL}/api/storage/file`, {
          headers,
          method: 'POST',
          body: JSON.stringify({
            file: {
              bucket,
              encrypt_version: '03-aes',
              fileId: uploadedFileId,
              file_id: uploadedFileId,
              folder_id: folderIdOfTheNewFile,
              name: encryptedName,
              size,
              type: fileType,
              modificationTime
            }
          })
        })
        if (!res.ok) {
          Logger.error(
            'Bad response while creating file',
            JSON.stringify(res, null, 2)
          )
          throw new SyncError('BAD_RESPONSE')
        }
      } catch (err) {
        await handleFetchError(err)
      }
    },

    async existsFolder(name: string): Promise<boolean> {
      return name in cache
    },

    async deleteFolder(name: string): Promise<void> {
      const folderInCache = cache[name]

      if (folderInCache) {
        const { id } = folderInCache

        try {
          const res = await fetch(
            `${process.env.API_URL}/api/storage/folder/${id}`,
            {
              headers,
              method: 'DELETE'
            }
          )
          if (!res.ok) {
            Logger.error(
              `Bad response wihle deleting folder`,
              JSON.stringify(res, null, 2)
            )
            throw new SyncError('BAD_RESPONSE')
          }
        } catch (err) {
          await handleFetchError(err)
        }
      } else
        throw new Error(
          `${name} folder not found in remote cache when tried to delete`
        )
    },

    getSource(
      name: string,
      progressCallback: FileSystemProgressCallback
    ): Promise<Source> {
      const fileInCache = cache[name]

      if (!fileInCache)
        throw new Error(
          `${name} file not found in remote cache when tried to return a source`
        )

      const environment = new Environment({
        bridgeUrl: process.env.BRIDGE_URL,
        bridgeUser: userInfo.bridgeUser,
        bridgePass: userInfo.userId,
        encryptionKey: mnemonic
      })

      return new Promise((resolve, reject) => {
        environment.download(
          fileInCache.bucket,
          fileInCache.fileId,
          {
            progressCallback,
            finishedCallback: (err: any, downloadStream: Readable) => {
              if (err) reject(err)
              else {
                resolve({
                  stream: downloadStream,
                  size: fileInCache.size,
                  modTime: fileInCache.modificationTime
                })
              }
            }
          },
          {
            label: 'OneStreamOnly',
            params: {
              useProxy: false,
              concurrency: 10
            }
          }
        )
      })
    },

    async smokeTest() {
      if (!navigator.onLine) {
        Logger.error(`No internet connection`)
        throw new SyncFatalError('NO_INTERNET')
      }

      const res = await fetch(
        `${process.env.API_URL}/api/storage/v2/folder/${baseFolderId}`,
        { headers }
      )

      if (!res.ok) {
        Logger.error(
          `Tried to get base folder (${baseFolderId}) and response was not ok`
        )
        throw new SyncFatalError('NO_REMOTE_CONNECTION')
      }
    }
  }
}
