import {FileSystem, Listing, Source} from './sync'
import * as fs from 'fs/promises'
import glob from 'tiny-glob'
import path from 'path'
import * as uuid from 'uuid'
import { getDateFromSeconds, getLocalMeta } from './utils'
import Logger from '../libs/logger'
import { createReadStream, createWriteStream} from 'fs'

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

		deleteFile(name:string) {
			return fs.unlink(path.join(localPath, name))
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

			const stream = createReadStream(completePath)

			const {modTimeInSeconds: modTime, size} = await getLocalMeta(completePath)

			return {stream, modTime, size}
		}
	}
}
 