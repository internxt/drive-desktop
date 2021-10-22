import {FileSystem, Listing} from './sync'
import * as fs from 'fs/promises'

import glob from 'tiny-glob'
import path from 'path'
import * as uuid from 'uuid'
import { getModTimeInSeconds } from './utils'
import Logger from '../libs/logger'

export function getLocalFilesystem(localPath:string , downloadFile: (name: string, downloadPath: string, progressCallback: (progress:number) => void) => Promise<void>, tempDirectory: string): FileSystem {

	return {
		kind: 'LOCAL',
		async getCurrentListing(): Promise<Listing> {
			const list = (await glob(`${localPath}/**/*`, { filesOnly: true, absolute: true, dot: true })).filter(fileName => !/.DS_Store$/.test(fileName))
			const listing: Listing = {}

			for (const fileName of list) {
				const nameRelativeToBase = fileName.split(localPath)[1]

				listing[nameRelativeToBase] = await getModTimeInSeconds(fileName)
			}
			return listing
		},
		deleteFile(name:string) {
			return fs.unlink(path.join(localPath, name))
		},
		async pullFile(name: string, progressCallback: (progress: number) => void) {
			const tmpFilePath = path.join(tempDirectory, `${uuid.v4()}.tmp`)

			Logger.log(`Downloading ${name} to temp location ${tmpFilePath}`)

			await downloadFile(name, tmpFilePath, progressCallback)

			const destPath = path.join(localPath, name)

			await fs.mkdir(path.parse(destPath).dir, {recursive: true})

			await fs.rename(tmpFilePath, destPath)
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
		}
	}
}
 