import ConfigStore from "../main/config-store";
import crypt from "../renderer/logic/crypt";
import path from 'path'
import { Listing, FileSystem, FileSystemProgressCallback, Source } from "./sync";
import { Environment } from "@internxt/inxt-js"
import * as uuid from 'uuid'
import { getDateFromSeconds, getSecondsFromDateString } from "./utils";

/**
 * Server cannot find a file given its route,
 * while we traverse the tree we also store in a cache
 * the info of every file by its route so we can operate with them
 */
type RemoteCache = Record<string, {id: number, parentId: number, isFolder: boolean, bucket: string | null, fileId?: string, modificationTime?: number, size?: number}>

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


export function getRemoteFilesystem(baseFolderId: number): FileSystem {
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
					cache[name] = {id: file.id, parentId: file.folderId, isFolder: false, bucket: file.bucket, fileId: file.fileId, modificationTime, size: file.size}
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

			if (fileInCache) 
		  	await fetch(`${process.env.API_URL}/api/storage/bucket/${fileInCache.bucket}/file/${fileInCache.fileId}`, {method: 'DELETE', headers})
			else
				throw new Error(`${name} file not found in remote cache when tried to delete it`)
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
				throw new Error(`${oldName} file not found in remote cache when tried to rename it`)
		},

		async pullFile(name: string, source: Source, progressCallback: (progress:number) => void): Promise<void> {
			const { size, modTime: modTimeInSeconds } = source
			const route = name.split('/')

			const {name: baseNameWithoutExt, ext} = path.parse(route.pop())
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

			const uploadedFileId: string = await new Promise((resolve,reject) => {
				localUpload.upload(bucket, {
					filename: uuid.v4(),
					progressCallback,
					finishedCallback: (err, fileId) => {
						if (err)
							reject(err)
						else
							resolve(fileId)
					}
				}, {
					label: 'OneStreamOnly',
					params: {
						source
					}
				})
			})

			const oldFileInCache = cache[name]

			if (oldFileInCache) {
				await fetch(
					`${process.env.API_URL}/api/storage/bucket/${bucket}/file/${oldFileInCache.fileId}`,
					{
						method: 'DELETE',
						headers
					})
			}

			const encryptedName = crypt.encryptName(
				baseNameWithoutExt,
				folderIdOfTheNewFile
			)

			const modificationTime = getDateFromSeconds(modTimeInSeconds)

			await fetch(`${process.env.API_URL}/api/storage/file`, 
			{headers, method: 'POST', body: JSON.stringify(
				{file: {bucket, encrypt_version: '03-aes', fileId: uploadedFileId, file_id: uploadedFileId, 
				folder_id: folderIdOfTheNewFile, name: encryptedName, size, type: fileType, modificationTime}})
			})
		},

		async existsFolder(name: string): Promise<boolean> {
			return name in cache
		},

		async deleteFolder(name: string): Promise<void> {
			const folderInCache = cache[name]

			if (folderInCache) {
				const { id } = folderInCache

				await fetch(`${process.env.API_URL}/api/storage/folder/${id}`, 
				{headers, method: 'DELETE'})
			} else 
				throw new Error(`${name} folder not found in remote cache when tried to delete`)
			
		},

		getSource(name: string, progressCallback: FileSystemProgressCallback): Promise<Source> {
			const fileInCache = cache[name]

			if (!fileInCache)
				throw new Error(`${name} file not found in remote cache when tried to return a source`)

			const environment = new Environment({bridgeUrl: process.env.BRIDGE_URL, bridgeUser: userInfo.email, bridgePass: userInfo.userId, encryptionKey: mnemonic })

			environment.config.download = { concurrency: 10 }

			return new Promise((resolve, reject) => {
				environment.download(fileInCache.bucket, fileInCache.fileId, {progressCallback, finishedCallback: (err, downloadStream) => {
					if (err)
						reject(err)
					else {
						resolve({stream: downloadStream, size: fileInCache.size, modTime: fileInCache.modificationTime})
					}
				}}, {label: 'OneStreamOnly', params: {}})
			})
		}
	}
}
