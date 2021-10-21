import {FileSystem, Listing} from './sync'
import * as fs from 'fs/promises'

import glob from 'tiny-glob'
import path from 'path'
import { getModTimeInSeconds } from './utils'

export function getLocalFilesystem(localPath:string , downloadFile: (name: string, downloadPath: string, progressCallback: (progress:number) => void) => Promise<void>): FileSystem {

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
			const destPath = path.join(localPath, name)

			await fs.mkdir(path.parse(destPath).dir, {recursive: true})

			return downloadFile(name, path.join(localPath, name), progressCallback)
		},
		renameFile(oldName: string, newName: string) {
			return fs.rename(path.join(localPath, oldName), path.join(localPath, newName))
		},
	}
}
 