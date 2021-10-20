
import ConfigStore from '../main/config-store'
import {FileSystem, Listing} from './sync'
import * as fs from 'fs/promises'

import glob from 'tiny-glob'
import path from 'path'

export function getLocalFilesystem(localPath:string , downloadFile: (name: string, downloadPath: string, progressCallback: (progress:number) => void) => Promise<void>): FileSystem {
	function getLocalListings() {
		return ConfigStore.get('localListings') as Record<string, Listing | undefined>
	}

	return {
		kind: 'LOCAL',
		async getCurrentListing(): Promise<Listing> {
			const list = await glob(`${localPath}/**/*`, {filesOnly: true, absolute: true})
			const listing: Listing = {}

			for (const fileName of list) {
				const stat = await fs.stat(fileName)

				const nameRelativeToBase = fileName.split(localPath)[1]

				listing[nameRelativeToBase] = Math.trunc(stat.mtimeMs / 1000) * 1000
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
		saveListing(listing: Listing): void {
			const localListings = getLocalListings()
			ConfigStore.set('localListings', {...localListings, [localPath]: listing})
		},
		removeSavedListing(): void {
			const localListings = getLocalListings()
			delete localListings[localPath]
			ConfigStore.set('localListings', localListings)
		},
		getLastSavedListing(): Listing {
			const localListings = getLocalListings()
			const listing = localListings[localPath]

			return listing ?? null
		},
	}
}
 