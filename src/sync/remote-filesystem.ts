import ConfigStore from "../main/config-store";
import crypt from "../renderer/logic/crypt";
import path from 'path'
import { Listing, FileSystem } from "./sync";
import { Environment } from "@internxt/inxt-js"
import { stat, utimes } from "fs/promises";
import { createWriteStream } from "fs";
import * as uuid from 'uuid'

type RemoteCache = Record<string, {id: number, parentId: number, isFolder: boolean, bucket: string | null, fileId?: string, modificationTime?: number}>


export function getRemoteFilesystem(baseFolderId: number, baseLocalPath: string): FileSystem & {downloadFile: (name: string, downloadPath: string, progressCallback: (progress:number) => void) => Promise<void>}{
	const headers = ConfigStore.get('authHeaders') as HeadersInit
	const userInfo = ConfigStore.get('userData') as {email:string, userId: string, bucket: string}
	const mnemonic = ConfigStore.get('mnemonic') as string

	let cache: RemoteCache = {}
	function getRemoteListings() {
		return ConfigStore.get('remoteListings') as Record<string, Listing | undefined>
	}

	return {
		kind: 'REMOTE',
		async getCurrentListing() {
			const tree = await fetch(
				`${process.env.API_URL}/api/desktop/list/0`,
				{
					method: 'GET',
					headers
				}
			).then(res => res.json())

			const listing: Listing = {}

			cache = {}

			traverse(baseFolderId)

			function traverse(currentId: number, currentName = "") {
				const filesInThisFolder = tree.files.filter((file: any) => file.folderId === currentId)
				const foldersInThisFolder = tree.folders.filter((folder:any) => folder.parent_id === currentId)

				filesInThisFolder.forEach((file:any) => {
					const name = currentName + crypt.decryptName(file.name, file.folderId, file.encrypt_version) + (file.type ? `.${file.type}`: '')
					const modificationTime = new Date(file.modificationTime).valueOf()
					listing[name] = modificationTime
					cache[name] = {id: file.id, parentId: file.folderId, isFolder: false, bucket: file.bucket, fileId: file.fileId, modificationTime}
				})

				foldersInThisFolder.forEach((folder:any) => {
					const name = currentName + crypt.decryptName(folder.name, folder.parent_id, folder.encrypt_version) 
					cache[name] = {id: folder.id, parentId: folder.parent_id, isFolder: true, bucket: folder.bucket}
					traverse(folder.id, name + '/')
				})
			}

			return listing
		},
		saveListing(listing: Listing): void {
			const remoteListings = getRemoteListings()
			ConfigStore.set('remoteListings', {...remoteListings, [baseFolderId]: listing})
		},
		removeSavedListing(): void {
			const remoteListings = getRemoteListings()
			delete remoteListings[baseFolderId]
			ConfigStore.set('remoteListings', remoteListings)
		},
		getLastSavedListing(): Listing | null {
			const remoteListings = getRemoteListings()
			const listing = remoteListings[baseFolderId]

			return listing ?? null
		},
		async deleteFile(name: string): Promise<void> {
			const fileInCache = cache[name]

			if(fileInCache)
		  	await fetch(`${process.env.API_URL}/api/storage/bucket/${fileInCache.bucket}/file/${fileInCache.fileId}`, {method: 'DELETE', headers})
			else
				throw new Error()
		},
		async renameFile(oldName: string, newName: string): Promise<void> {
			const fileInCache = cache[oldName]
			const newNameBase = path.parse(newName.split('/').pop()).base

			if(fileInCache) {
				await fetch(`${process.env.API_URL}/api/storage/file/${fileInCache.fileId}/meta`, {method: 'POST', headers: {...headers, 'internxt-mnemonic': mnemonic}, body: JSON.stringify({metadata:{itemName: newNameBase}, bucketId: fileInCache.bucket, relativePath: uuid.v4() })})
				delete cache[oldName]
				cache[newName] = fileInCache
			}
			else
				throw new Error()
		},
		async pullFile(name: string, progressCallback: (progress:number) => void): Promise<void> {
			const route = name.split('/')
			const routeIds = [baseFolderId]
			let baseName

			if(route.length > 1) {
				baseName = path.parse(route.pop()).base

				for (const [i, folderName] of route.entries()) {
					const routeToThisPoint = route.slice(0, i+1).join('/')

					const folderInCache = cache[routeToThisPoint]

					if (folderInCache)
						routeIds.push(folderInCache.id)
					else {
						const createdFolder = await fetch(`${process.env.API_URL}/api/storage/folder`, {method: 'POST', headers, body: JSON.stringify({folderName, parentFolderId: routeIds[i]})}).then(res => res.json())
						routeIds.push(createdFolder.id)
						cache[routeToThisPoint] = {id: createdFolder.id, parentId: createdFolder.parent_id, isFolder: true, bucket: createdFolder.bucket}
					}
				}
			} else {
				baseName = path.parse(name).base
			}

			const folderId = routeIds.pop()

			const localUpload = new Environment({bridgeUrl: process.env.BRIDGE_URL, bridgeUser: userInfo.email, bridgePass: userInfo.userId, encryptionKey: mnemonic })

			const { bucket } = userInfo

			const oldFileInCache = cache[name]

			if (oldFileInCache) {
				await fetch(
					`${process.env.API_URL}/api/storage/bucket/${bucket}/file/${oldFileInCache.fileId}`,
					{
						method: 'DELETE',
						headers
					})
			}

			const localPath = path.join(baseLocalPath, name)
			const uploadedFileId: string = await new Promise((resolve,reject) => {
				localUpload.storeFile(bucket, localPath, {
					progressCallback,
					finishedCallback: (err, newFileId) => {
						if (err)
							reject(err)
						
						resolve(newFileId)
					}
				} )
			})

			const encryptedName = crypt.encryptFilename(
				baseName,
				folderId
			)

			const {size, mtimeMs } = await stat(localPath)

			const modificationTime = new Date(Math.trunc(mtimeMs / 1000) * 1000)

			const fileType = path.parse(name).ext.slice(1)

			await fetch(`${process.env.API_URL}/api/storage/file`, 
			{headers, method: 'POST', body: JSON.stringify(
				{file: {bucket, encrypt_version: '03-aes', fileId: uploadedFileId, file_id: uploadedFileId, 
				folder_id: folderId, name: encryptedName, size, type: fileType, modificationTime}})
			})
		},
		downloadFile(name: string, downloadPath: string, progressCallback: (progress:number) => void): Promise<void> {
			const environment = new Environment({bridgeUrl: process.env.BRIDGE_URL, bridgeUser: userInfo.email, bridgePass: userInfo.userId, encryptionKey: mnemonic })

			environment.config.download = { concurrency: 10 }

			const fileInCache = cache[name]

			if (!fileInCache)
				throw new Error(`${name} not in remote cache`)

			return new Promise((resolve, reject) => {
				environment.download(fileInCache.bucket, fileInCache.fileId, {progressCallback, finishedCallback: (err, downloadStream) => {
					if (err)
						reject(err)
					else {
						const writable = createWriteStream(downloadPath)

						downloadStream.on('data', chunk => writable.write(chunk))
						downloadStream.on('end', () => {
							writable.close()
							const modificationTime = new Date(fileInCache.modificationTime)
							utimes(downloadPath, modificationTime, modificationTime)
							resolve()
						})
					}
					
					
				}}, {label: 'OneStreamOnly', params: {}})
			})
		}

	}
}
