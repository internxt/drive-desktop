import ConfigStore from "../main/config-store";
import crypt from "../renderer/logic/crypt";
import path from 'path'
import { Listing, FileSystem } from "./sync";
import { Environment } from "@internxt/inxt-js"
import { stat, utimes } from "fs/promises";
import { createWriteStream } from "fs";
import * as uuid from 'uuid'
import { getDateFromSeconds, getModTimeInSeconds, getSecondsFromDateString } from "./utils";

/**
 * Server cannot find a file given its route,
 * while we traverse the tree we also store in a cache
 * the info of every file by its route so we can operate with them
 */
type RemoteCache = Record<string, {id: number, parentId: number, isFolder: boolean, bucket: string | null, fileId?: string, modificationTime?: number}>

type ServerFile = {
	bucket: string
	createdAt: string
	encrypt_version:string
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


export function getRemoteFilesystem(baseFolderId: number, baseLocalPath: string): FileSystem & {downloadFile: (name: string, downloadPath: string, progressCallback: (progress:number) => void) => Promise<void>}{
	const headers = ConfigStore.get('authHeaders') as HeadersInit
	const userInfo = ConfigStore.get('userData') as {email:string, userId: string, bucket: string}
	const mnemonic = ConfigStore.get('mnemonic') as string

	const cache: RemoteCache = {}

	return {
		kind: 'REMOTE',
		async getCurrentListing() {
			const tree: {files: ServerFile[], folders: ServerFolder[]} = await fetch(
				`${process.env.API_URL}/api/desktop/list/0`,
				{
					method: 'GET',
					headers
				}
			).then(res => res.json())

			const listing: Listing = {}

			traverse(baseFolderId)

			function traverse(currentId: number, currentName: string = "") {
				const filesInThisFolder = tree.files.filter((file) => file.folderId === currentId)
				const foldersInThisFolder = tree.folders.filter((folder) => folder.parent_id === currentId)

				filesInThisFolder.forEach(file => {
					const name = currentName + crypt.decryptName(file.name, file.folderId, file.encrypt_version) + (file.type ? `.${file.type}`: '')
					const modificationTime = getSecondsFromDateString(file.modificationTime)
					listing[name] = modificationTime
					cache[name] = {id: file.id, parentId: file.folderId, isFolder: false, bucket: file.bucket, fileId: file.fileId, modificationTime}
				})

				foldersInThisFolder.forEach(folder => {
					const name = currentName + crypt.decryptName(folder.name, folder.parent_id, '03-aes') 
					cache[name] = {id: folder.id, parentId: folder.parent_id, isFolder: true, bucket: folder.bucket}
					traverse(folder.id, name + '/')
				})
			}

			return listing
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
			const newNameBase = path.parse(newName).name

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

			const {base: baseName, ext} = path.parse(route.pop())
			const fileType = ext.slice(1)

			let lastParentId = baseFolderId

			if (route.length > 0) {
				for (const [i, folderName] of route.entries()) {
					const routeToThisPoint = route.slice(0, i+1).join('/')

					const folderInCache = cache[routeToThisPoint]

					if (folderInCache)
						lastParentId = folderInCache.id
					else {
						const createdFolder: ServerFolder = await fetch(`${process.env.API_URL}/api/storage/folder`, {method: 'POST', headers, body: JSON.stringify({folderName, parentFolderId: lastParentId})}).then(res => res.json())
						lastParentId = createdFolder.id
						cache[routeToThisPoint] = {id: createdFolder.id, parentId: createdFolder.parent_id, isFolder: true, bucket: createdFolder.bucket}
					}
				}
			}

			const folderIdOfTheNewFile = lastParentId

			const localUpload = new Environment({ bridgeUrl: process.env.BRIDGE_URL, bridgeUser: userInfo.email, bridgePass: userInfo.userId, encryptionKey: mnemonic })

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
				folderIdOfTheNewFile
			)

			const {size} = await stat(localPath)

			const modificationTime = getDateFromSeconds(await getModTimeInSeconds(localPath))

			await fetch(`${process.env.API_URL}/api/storage/file`, 
			{headers, method: 'POST', body: JSON.stringify(
				{file: {bucket, encrypt_version: '03-aes', fileId: uploadedFileId, file_id: uploadedFileId, 
				folder_id: folderIdOfTheNewFile, name: encryptedName, size, type: fileType, modificationTime}})
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
							const modificationTime = getDateFromSeconds(fileInCache.modificationTime)
							utimes(downloadPath, modificationTime, modificationTime)
							resolve()
						})
					}
				}}, {label: 'OneStreamOnly', params: {}})
			})
		}
	}
}
