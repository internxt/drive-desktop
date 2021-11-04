import { FileSystem, SyncFatalError, Listing, Source } from '../sync'
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

  function getTempFilePath() {
    return path.join(tempDirectory, `${uuid.v4()}.tmp`)
  }

  return {
    kind: 'LOCAL',
    async getCurrentListing(): Promise<Listing> {
      const list = (
        await glob(`${localPath}/**/*`, {
          filesOnly: true,
          absolute: true,
          dot: true
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
          writeStream.close()

          const actualPath = getActualPath(name)

          await fs.mkdir(path.parse(actualPath).dir, { recursive: true })

          await fs.rename(tmpFilePath, actualPath)

          const modTime = getDateFromSeconds(source.modTime)
          fs.utimes(actualPath, modTime, modTime)

          resolve()
        })
      })
    },

    renameFile(oldName: string, newName: string) {
      return fs.rename(
        getActualPath(oldName),
        getActualPath(newName),
      )
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

    async deleteFolder(name: string): Promise<void> {
      const actualPath = getActualPath(name)

      await fs.rm(actualPath, { recursive: true, force: true })
    },

    async getSource(name: string): Promise<Source> {
      const actualPath = getActualPath(name)

      const { modTimeInSeconds: modTime, size } = await getLocalMeta(
        actualPath
      )

      const tmpFilePath = getTempFilePath()

      await fs.copyFile(actualPath, tmpFilePath)

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
