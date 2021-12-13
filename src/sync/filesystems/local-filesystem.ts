import { FileSystem, SyncFatalError, Listing, Source, SyncError } from '../sync'
import * as fs from 'fs/promises'
import glob from 'tiny-glob'
import path from 'path'
import * as uuid from 'uuid'
import { getDateFromSeconds, getLocalMeta } from '../utils'
import Logger from '../../libs/logger'
import { constants, createReadStream, createWriteStream } from 'fs'

export function getLocalFilesystem(
  localPath: string,
  tempDirectory: string
): FileSystem {
  /**
   *
   * @param actualPath OS Specific absolute path
   * @returns Listing path relative to localPath with '/' as separator
   */
  function getListingPath(actualPath: string) {
    return actualPath.split(localPath)[1].replaceAll(path.sep, '/')
  }

  /**
   *
   * @param listingPath Relative to localPath with '/' as separator
   * @returns OS Specific absolute path
   */
  function getActualPath(listingPath: string) {
    const osSpecificRelative = listingPath.replaceAll('/', path.sep)

    return path.join(localPath, osSpecificRelative)
  }

  async function saferRenameFile(oldPath: string, newPath: string) {
    try {
      await fs.rename(oldPath, newPath)
    } catch (err) {
      if (err.code === 'EXDEV') {
        await fs.copyFile(oldPath, newPath)
        await fs.unlink(oldPath)
      } else {
        throw err
      }
    }
  }

  function getTempFilePath() {
    return path.join(tempDirectory, `${uuid.v4()}.tmp`)
  }

  return {
    kind: 'LOCAL',
    async getCurrentListing(): Promise<Listing> {
      const list = (
        await glob('**', {
          filesOnly: true,
          absolute: true,
          dot: true,
          cwd: localPath
        })
      ).filter(fileName => !/.DS_Store$/.test(fileName))
      const listing: Listing = {}

      for (const fileName of list) {
        const relativeName = getListingPath(fileName)

        const { modTimeInSeconds, size } = await getLocalMeta(fileName)

        if (size) listing[relativeName] = modTimeInSeconds
      }
      return listing
    },

    async deleteFile(name: string) {
      const actualPath = getActualPath(name)
      try {
        await fs.unlink(actualPath)
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
      }
    },

    pullFile(name: string, source: Source) {
      return new Promise((resolve, reject) => {
        const tmpFilePath = getTempFilePath()

        const { stream } = source

        Logger.log(`Downloading ${name} to temp location ${tmpFilePath}`)

        const writeStream = createWriteStream(tmpFilePath)

        stream.on('data', chunk => writeStream.write(chunk))

        stream.on('error', reject)

        stream.on('end', async () => {
          try {
            writeStream.close()

            const actualPath = getActualPath(name)

            await fs.mkdir(path.parse(actualPath).dir, { recursive: true })

            await saferRenameFile(tmpFilePath, actualPath)

            const modTime = getDateFromSeconds(source.modTime)
            fs.utimes(actualPath, modTime, modTime)

            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })
    },

    renameFile(oldName: string, newName: string) {
      const oldActualPath = getActualPath(oldName)
      const newActualPath = getActualPath(newName)
      return saferRenameFile(oldActualPath, newActualPath)
    },

    async existsFolder(name: string): Promise<boolean> {
      const actualPath = getActualPath(name)
      try {
        await fs.access(actualPath)
        return true
      } catch {
        return false
      }
    },

    deleteFolder(name: string): Promise<void> {
      const actualPath = getActualPath(name)

      return fs.rm(actualPath, { recursive: true, force: true })
    },

    async getSource(name: string): Promise<Source> {
      const actualPath = getActualPath(name)
      const tmpFilePath = getTempFilePath()

      let modTime: number
      let size: number

      try {
        const localMeta = await getLocalMeta(actualPath)
        modTime = localMeta.modTimeInSeconds
        size = localMeta.size

        await fs.copyFile(actualPath, tmpFilePath)
      } catch (err) {
        if (err.code === 'ENOENT') {
          throw new SyncError('NOT_EXISTS')
        } else if (err.code === 'EACCES') {
          throw new SyncError('NO_PERMISSION')
        } else {
          throw err
        }
      }

      const stream = createReadStream(tmpFilePath)

      const onEndOrError = () => fs.unlink(tmpFilePath)

      stream.once('end', onEndOrError)
      stream.once('error', onEndOrError)

      Logger.log(`Uploading ${name} from temp location ${tmpFilePath}`)

      return { stream, modTime, size }
    },

    async smokeTest() {
      try {
        await fs.access(localPath, constants.R_OK | constants.W_OK)
        await fs.lstat(localPath)
      } catch (err) {
        Logger.error(
          `Error accessing base directory ${localPath} (${err.name}:${err.code}: ${err.message})`
        )
        Logger.error(err.stack)
        throw new SyncFatalError('CANNOT_ACCESS_BASE_DIRECTORY')
      }

      try {
        await fs.access(tempDirectory, constants.R_OK | constants.W_OK)
      } catch (err) {
        Logger.error(
          `Error accessing temp directory ${tempDirectory} (${err.name}:${err.code}: ${err.message})`
        )
        Logger.error(err.stack)
        throw new SyncFatalError('CANNOT_ACCESS_TMP_DIRECTORY')
      }
    }
  }
}
