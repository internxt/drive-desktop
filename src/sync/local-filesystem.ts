import {FileSystem, FilesystemError, Listing, Source} from './sync'
import * as fs from 'fs/promises'
import glob from 'tiny-glob'
import path from 'path'
import * as uuid from 'uuid'
import { getDateFromSeconds, getLocalMeta } from './utils'
import Logger from '../libs/logger'
import { constants, createReadStream, createWriteStream} from 'fs'

export function getLocalFilesystem(localPath:string , tempDirectory: string): FileSystem {

	return {
		kind: 'LOCAL',
		async getCurrentListing(): Promise<Listing> {
			const list = (await glob(`${localPath}/**/*`, { filesOnly: true, absolute: true, dot: true })).filter(fileName => !/.DS_Store$/.test(fileName))
			const listing: Listing = {}

			for (const fileName of list) {
				const nameRelativeToBase = fileName.split(localPath)[1]

				const {modTimeInSeconds, size} = await getLocalMeta(fileName)

				if (size)
					listing[nameRelativeToBase] = modTimeInSeconds
			}
			return listing
		},

		async deleteFile(name:string) {
			try{
				await fs.unlink(path.join(localPath, name))
			} catch(err){
				if (err.code !== 'ENOENT')
					throw err
			}
		},

		pullFile(name: string, source: Source) {
			return new Promise((resolve, reject) => {
				const tmpFilePath = path.join(tempDirectory, `${uuid.v4()}.tmp`)

				const { stream } = source

				Logger.log(`Downloading ${name} to temp location ${tmpFilePath}`)

				const writeStream = createWriteStream(tmpFilePath)

				stream.on('data', chunk => writeStream.write(chunk))

				stream.on('error', reject)

				stream.on('end', async () => {
					writeStream.close()

					const destPath = path.join(localPath, name)

					await fs.mkdir(path.parse(destPath).dir, {recursive: true})

					await fs.rename(tmpFilePath, destPath)

					const modTime = getDateFromSeconds(source.modTime)
					fs.utimes(destPath, modTime, modTime)

					resolve()
				})
			})
		},

		renameFile(oldName: string, newName: string) {
			return fs.rename(path.join(localPath, oldName), path.join(localPath, newName))
		},

		async existsFolder(name: string): Promise<boolean> {
			const completePath = path.join(localPath, name)
			try {
				await fs.access(completePath)
				return true
			} catch {
				return false
			}
		},

		async deleteFolder(name: string): Promise<void> {
			const completePath = path.join(localPath, name)

			await fs.rm(completePath, {recursive: true, force: true})
		},

		async getSource(name: string): Promise<Source> {
			const completePath = path.join(localPath, name)

			const {modTimeInSeconds: modTime, size} = await getLocalMeta(completePath)

			const tmpFilePath = path.join(tempDirectory, `${uuid.v4()}.tmp`)

			await fs.copyFile(completePath, tmpFilePath)

			const stream = createReadStream(tmpFilePath)

			const onEndOrError = () => fs.unlink(tmpFilePath)

			stream.once('end', onEndOrError)
			stream.once('error', onEndOrError)

			Logger.log(`Uploading ${name} from temp location ${tmpFilePath}`)

			return {stream, modTime, size}
		},

		async smokeTest() {
			try {
				await fs.access(localPath, constants.R_OK | constants.W_OK)
			} catch (err){
				Logger.error(`Error accessing base directory ${localPath} (${err.name}:${err.code}: ${err.message})`)
				throw new FilesystemError('CANNOT_ACCESS_BASE_DIRECTORY')
			}

			try {
				await fs.access(tempDirectory, constants.R_OK | constants.W_OK)
			} catch (err){
				Logger.error(`Error accessing temp directory ${tempDirectory} (${err.name}:${err.code}: ${err.message})`)
				throw new FilesystemError('CANNOT_ACCESS_TMP_DIRECTORY')
			}
		}
	}
}

 