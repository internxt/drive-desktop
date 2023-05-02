import { Environment } from '@internxt/inxt-js';
import { ipcRenderer } from 'electron';
import Logger from 'electron-log';
import EventEmitter from 'events';
import path from 'path';
import { Readable } from 'stream';
import * as uuid from 'uuid';

import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { FileCreatedResponseDTO } from '../../../shared/HttpClient/responses/file-created';
import { RemoteListing } from '../../sync/Listings/domain/Listing';
import { RemoteItemMetaData } from '../../sync/Listings/domain/RemoteItemMetaData';
import {
	FileSystemProgressCallback,
	ProcessError,
	ProcessFatalError,
	ReadingMetaErrorEntry,
	Source,
} from '../../types';
import crypt from '../../utils/crypt';
import { getDateFromSeconds, getSecondsFromDateString } from '../../utils/date';
import httpRequest from '../../utils/http-request';
import isOnline from '../../utils/is-online';
import { fileNameIsValid } from '../../utils/name-verification';
import { createErrorDetails, serializeRes } from '../../utils/reporting';
import { FileSystem } from '../domain/FileSystem';
import { ServerFile } from '../domain/ServerFile';
import { ServerFolder } from '../domain/ServerFolder';
import { TransferLimits } from '../domain/Transfer';

type CacheData = {
	id: number;
	parentId: number;
	isFolder: boolean;
	bucket: string | null;
	fileId?: string;
	modificationTime?: number;
	size?: number;
};

/**
 * Server cannot find a file given its route,
 * while we traverse the tree we also store in a cache
 * the info of every file by its route so we can operate with them
 */
type RemoteCache = Record<string, CacheData>;

export function getRemoteFilesystem({
	baseFolderId,
	headers,
	userInfo,
	mnemonic,
	bucket,
	clients,
}: {
	baseFolderId: number;
	headers: HeadersInit;
	userInfo: { email: string; userId: string; bridgeUser: string };
	mnemonic: string;
	bucket: string;
	clients: AuthorizedClients;
}): FileSystem<RemoteListing> {
	const cache: RemoteCache = {};
	const createFolderQueue = new EventEmitter().setMaxListeners(0);

	async function getTree(): Promise<{
		files: ServerFile[];
		folders: ServerFolder[];
	}> {
		const PAGE_SIZE = 5000;

		let thereIsMore = true;
		let offset = 0;

		const files: ServerFile[] = [];
		const folders: ServerFolder[] = [];

		while (thereIsMore) {
			try {
				const batch = await httpRequest(`${process.env.API_URL}/api/desktop/list/${offset}`, {
					method: 'GET',
					headers,
				}).then((res) => res.json());

				// We can't use spread operator with big arrays
				// see: https://anchortagdev.com/range-error-maximum-call-stack-size-exceeded-error-using-spread-operator-in-node-js-javascript/

				for (const file of batch.files) {
					files.push(file);
				}

				for (const folder of batch.folders) {
					folders.push(folder);
				}

				thereIsMore = batch.folders.length === PAGE_SIZE;

				if (thereIsMore) {
					offset += PAGE_SIZE;
				}
			} catch (err) {
				await handleFetchError(err, 'Fetching tree', `offset: ${offset}`);
			}
		}

		return { files, folders };
	}

	async function handleFetchError(err: any, action: string, additionalInfo?: string) {
		if (err instanceof ProcessError) {
			throw err;
		}

		const details = createErrorDetails(err, action, additionalInfo);

		if (await isOnline()) {
			throw new ProcessError('NO_REMOTE_CONNECTION', details);
		} else {
			throw new ProcessError('NO_INTERNET', details);
		}
	}

	return {
		kind: 'REMOTE',

		async getCurrentListing() {
			const tree = await getTree();

			const listing: RemoteListing = {};
			const readingMetaErrors: Array<ReadingMetaErrorEntry> = [];

			traverse(baseFolderId);

			function traverse(currentId: number, currentName = '') {
				const filesInThisFolder = tree.files.filter((file) => file.folderId === currentId);
				const foldersInThisFolder = tree.folders.filter((folder) => folder.parent_id === currentId);

				filesInThisFolder
					.map((file) => ({
						name:
							currentName +
							crypt.decryptName(file.name, file.folderId.toString(), file.encrypt_version) +
							(file.type ? `.${file.type}` : ''),
						file,
					}))
					.filter(({ name }) => {
						const isValid = fileNameIsValid(name);

						if (!isValid) {
							Logger.warn(`REMOTE file with name ${name} will be ignored due an invalid name`);

							return false;
						}

						return true;
					})
					.forEach(({ file, name }) => {
						const modificationTime = getSecondsFromDateString(file.modificationTime);
						listing[name] = RemoteItemMetaData.from({
							modtime: modificationTime,
							size: file.size,
							isFolder: false,
							id: file.id,
						});
						cache[name] = {
							id: file.id,
							parentId: file.folderId,
							isFolder: false,
							bucket: file.bucket,
							fileId: file.fileId,
							modificationTime,
							size: file.size,
						};
					});

				foldersInThisFolder.forEach((folder: ServerFolder) => {
					const plainName =
						folder.plain_name ||
						crypt.decryptName(folder.name, (folder.parent_id as number).toString(), '03-aes');

					const name = currentName + plainName;

					listing[name] = RemoteItemMetaData.from({
						modtime: getSecondsFromDateString(folder.updated_at),
						size: 0,
						isFolder: true,
						id: folder.id,
					});
					cache[name] = {
						id: folder.id,
						parentId: folder.parent_id as number,
						isFolder: true,
						bucket: folder.bucket,
						modificationTime: getSecondsFromDateString(folder.updated_at),
					};
					traverse(folder.id, `${name}/`);
				});
			}

			return { listing, readingMetaErrors };
		},

		async deleteFile(name: string): Promise<void> {
			const fileInCache = cache[name];

			const result = await clients.newDrive.post(
				`${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
				{
					items: [
						{
							type: 'file',
							id: fileInCache.fileId,
						},
					],
				}
			);

			if (result.status !== 200) {
				await handleFetchError(
					result.data(),
					'Moving remote file to trash',
					`Name: ${name}, fileInCache: ${JSON.stringify(fileInCache, null, 2)}`
				);
			}
		},

		async renameFile(oldName: string, newName: string): Promise<void> {
			const fileInCache = cache[oldName];
			const newNameBase = path.parse(newName).name;

			try {
				const res = await httpRequest(
					`${process.env.API_URL}/api/storage/file/${fileInCache.fileId}/meta`,
					{
						method: 'POST',
						headers,
						body: JSON.stringify({
							metadata: { itemName: newNameBase },
							bucketId: fileInCache.bucket,
							relativePath: uuid.v4(),
						}),
					}
				);
				if (!res.ok) {
					throw new ProcessError(
						'BAD_RESPONSE',
						createErrorDetails(
							{},
							'Renaming remote file',
							`oldName: ${oldName}, newName: ${newName}, fileInCache: ${JSON.stringify(
								fileInCache,
								null,
								2
							)}, res: ${await serializeRes(res)}`
						)
					);
				}
				delete cache[oldName];
				cache[newName] = fileInCache;
			} catch (err) {
				await handleFetchError(
					err,
					'Renaming remote file',
					`oldName: ${oldName}, newName: ${newName}, fileInCache: ${JSON.stringify(
						fileInCache,
						null,
						2
					)}`
				);
			}
		},

		async pullFile(
			name: string,
			source: Source,
			progressCallback: (progress: number) => void,
			abortSignal: AbortSignal
		): Promise<number> {
			const { size, modTime: modTimeInSeconds } = source;
			const route = name.split('/');

			const { name: baseNameWithoutExt, ext } = path.parse(route.pop() as string);
			const fileType = ext.slice(1);

			let lastParentId = baseFolderId;

			if (route.length > 0) {
				for (const [i] of route.entries()) {
					const routeToThisPoint = route.slice(0, i + 1).join('/');

					const folderInCache = cache[routeToThisPoint];

					if (folderInCache) {
						lastParentId = folderInCache.id;
					}
				}
			}

			const folderIdOfTheNewFile = lastParentId;

			const localUpload = new Environment({
				bridgeUrl: process.env.BRIDGE_URL,
				bridgeUser: userInfo.bridgeUser,
				bridgePass: userInfo.userId,
				encryptionKey: mnemonic,
			});

			if (source.size > TransferLimits.UploadFileSize) {
				source.stream.destroy(new Error('FILE TOO BIG'));

				throw new ProcessError(
					'FILE_TOO_BIG',
					createErrorDetails(
						{},
						'Uploading a file',
						`name: ${name}, source: ${JSON.stringify(source, null, 2)}`
					)
				);
			}

			const uploadedFileId: string = await new Promise((resolve, reject) => {
				if (source.size > TransferLimits.MultipartUploadThreshold) {
					const state = localUpload.uploadMultipartFile(bucket, {
						progressCallback,
						finishedCallback: async (err: any, fileId: string | null) => {
							if (err) {
								// Don't include the stream in the details
								const { stream, ...sourceWithoutStream } = source;

								source.stream.destroy(new Error('MULTIPART UPLOAD FAILED'));

								const details = createErrorDetails(
									err,
									'Uploading a file with multipart ',
									`bucket: ${bucket}, source: ${JSON.stringify(
										sourceWithoutStream,
										null,
										2
									)}, name: ${name}, userInfo: ${JSON.stringify(userInfo, null, 2)}`
								);
								reject(
									(await isOnline())
										? new ProcessError('UNKNOWN', details)
										: new ProcessError('NO_INTERNET', details)
								);
							} else {
								resolve(fileId as string);
							}
						},
						fileSize: source.size,
						source: source.stream,
					});

					abortSignal.addEventListener('abort', () => {
						Logger.debug(`[SYNC REMOTE FS] Aborting upload for ${name}`);
						// localUpload.uploadCancel(state);
						// state.emit(Events.Upload.Abort);
					});
				} else {
					localUpload.upload(bucket, {
						progressCallback,
						finishedCallback: async (err: any, fileId: string) => {
							if (err) {
								// Don't include the stream in the details
								const { stream, ...sourceWithoutStream } = source;

								stream.destroy(new Error('LOCAL UPLOADED FAILED'));

								const details = createErrorDetails(
									err,
									'Uploading a file',
									`bucket: ${bucket}, source: ${JSON.stringify(
										sourceWithoutStream,
										null,
										2
									)}, name: ${name}, userInfo: ${JSON.stringify(userInfo, null, 2)}`
								);
								reject(
									(await isOnline())
										? new ProcessError('UNKNOWN', details)
										: new ProcessError('NO_INTERNET', details)
								);
							} else {
								resolve(fileId);
							}
						},
						fileSize: source.size,
						source: source.stream,
					});
				}
			});

			const oldFileInCache = cache[name];

			if (oldFileInCache) {
				try {
					const res = await httpRequest(
						`${process.env.API_URL}/api/storage/folder/${oldFileInCache.parentId}/file/${oldFileInCache.id}`,
						{
							method: 'DELETE',
							headers,
						}
					);
					if (!res.ok) {
						Logger.warn(
							`Error trying to delete outdated remote file. res: ${await serializeRes(
								res
							)} fileInCache: ${JSON.stringify(oldFileInCache, null, 2)}`
						);
					}
				} catch (e) {
					const err = e as Error & { code: string };
					Logger.warn(
						`Error trying to delete outdated remote file. ${err.name} ${err.code} ${
							err.stack
						} fileInCache: ${JSON.stringify(oldFileInCache, null, 2)}`
					);
				}
			}

			const encryptedName = crypt.encryptName(baseNameWithoutExt, folderIdOfTheNewFile.toString());

			const modificationTime = getDateFromSeconds(modTimeInSeconds);

			try {
				const res = await httpRequest(`${process.env.API_URL}/api/storage/file`, {
					headers,
					method: 'POST',
					body: JSON.stringify({
						file: {
							bucket,
							encrypt_version: '03-aes',
							fileId: uploadedFileId,
							file_id: uploadedFileId,
							folder_id: folderIdOfTheNewFile,
							name: encryptedName,
							plain_name: baseNameWithoutExt,
							size,
							type: fileType,
							modificationTime,
						},
					}),
				});
				if (!res.ok) {
					throw new ProcessError(
						'BAD_RESPONSE',
						createErrorDetails(
							{},
							'Creating file in drive server',
							`res: ${await serializeRes(
								res
							)}, encryptedName: ${encryptedName}, modificationTime: ${modificationTime}`
						)
					);
				}

				const fileCreated: FileCreatedResponseDTO = await res.json();

				return fileCreated.id;
			} catch (err) {
				await handleFetchError(
					err,
					'Creating file in drive server',
					`encryptedName: ${encryptedName}, modificationTime: ${modificationTime}`
				);
			}

			return Promise.reject();
		},

		async pullFolder(name: string, _modtime: number): Promise<void> {
			const route = name.split('/');

			const n = route.at(-1);

			const parentFolderRoute = route.slice(0, route.length - 1).join('/');

			const folderInCache = cache[parentFolderRoute];

			const lastParentId = folderInCache !== undefined ? folderInCache.id : baseFolderId;

			await httpRequest(`${process.env.API_URL}/api/storage/folder`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					folderName: n,
					parentFolderId: lastParentId,
				}),
			})
				.then(async (res) => {
					if (!res.ok) {
						throw new ProcessError(
							'BAD_RESPONSE',
							createErrorDetails(
								{},
								'Creating folder in drive server',
								`res: ${await serializeRes(
									res
								)}, folderName: ${name}, parentFolderId: ${lastParentId}`
							)
						);
					} else {
						return res;
					}
				})
				.then((res) => res.json())
				.then((createdFolder: ServerFolder) => {
					cache[parentFolderRoute] = {
						id: createdFolder.id,
						parentId: createdFolder.parent_id as number,
						isFolder: true,
						bucket: createdFolder.bucket,
					};
					createFolderQueue.emit(parentFolderRoute, createdFolder.id);
				})
				.catch(async (err) => {
					Logger.error(JSON.stringify(err, null, 2));
					createFolderQueue.emit(parentFolderRoute, err);
				});
		},

		async existsFolder(name: string): Promise<boolean> {
			return name in cache;
		},

		async deleteFolder(name: string): Promise<void> {
			const folderInCache = cache[name];

			const { id } = folderInCache;

			try {
				const result = await clients.newDrive.post(
					`${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
					{
						items: [
							{
								type: 'folder',
								id,
							},
						],
					}
				);

				if (result.status !== 200) {
					throw new ProcessError(
						'BAD_RESPONSE',
						createErrorDetails(
							{},
							'Deleting folder from server',
							`res: ${await serializeRes(result.data)}, folderInCache: ${JSON.stringify(
								folderInCache,
								null,
								2
							)}`
						)
					);
				}
			} catch (err) {
				await handleFetchError(
					err,
					'Deleting folder from server',
					`folderInCache: ${JSON.stringify(folderInCache, null, 2)}`
				);
			}
		},

		getFolderData(folderName: string) {
			const folder = cache[folderName];

			Logger.debug('CACHE: ', JSON.stringify(cache, null, 2));
			Logger.debug('FOLDER: ', JSON.stringify(folder, null, 2));
			Logger.debug('FOLDER name: ', folderName);

			if (!folder.isFolder) {
				throw new Error('[SYNC REMOTE FS] Item is not a folder');
			}

			if (!folder.modificationTime) {
				// The end point for creating folders do not accept the modification time
				// and the update metada endpoint only workd for changing the name
				// so until the cache gets refreshed its undefined
				throw new Error('[SYNC REMOTE FS] Folder has no modificationTime');
			}

			return Promise.resolve({ modtime: folder.modificationTime });
		},

		getSource(name: string, progressCallback: FileSystemProgressCallback): Promise<Source> {
			const fileInCache = cache[name];

			Logger.log(`Getting source of ${name} fileId: ${fileInCache.fileId}`);

			const environment = new Environment({
				bridgeUrl: process.env.BRIDGE_URL,
				bridgeUser: userInfo.bridgeUser,
				bridgePass: userInfo.userId,
				encryptionKey: mnemonic,
			});

			return new Promise((resolve, reject) => {
				environment.download(
					fileInCache.bucket as string,
					fileInCache.fileId as string,
					{
						progressCallback,
						finishedCallback: async (err: any, downloadStream: Readable) => {
							if (err) {
								const details = createErrorDetails(
									err,
									'Downloading a file',
									`fileInCache: ${JSON.stringify(
										fileInCache,
										null,
										2
									)}, name: ${name}, userInfo: ${JSON.stringify(userInfo, null, 2)}`
								);
								reject(
									(await isOnline())
										? new ProcessError('UNKNOWN', details)
										: new ProcessError('NO_INTERNET', details)
								);
							} else {
								resolve({
									stream: downloadStream,
									size: fileInCache.size as number,
									modTime: fileInCache.modificationTime as number,
								});
							}
						},
					},
					{
						label: 'Dynamic',
						params: {
							useProxy: false,
							concurrency: 10,
						},
					}
				);
			});
		},

		async smokeTest() {
			if (!(await isOnline())) {
				throw new ProcessFatalError(
					'NO_INTERNET',
					createErrorDetails({}, 'Remote smoke test (online test)')
				);
			}

			const res = await httpRequest(
				`${process.env.API_URL}/api/storage/v2/folder/${baseFolderId}`,
				{ headers }
			);

			if (!res.ok) {
				if (res.status === 401) {
					ipcRenderer.emit('user-is-unauthorized');
				}
				throw new ProcessFatalError(
					'NO_REMOTE_CONNECTION',
					createErrorDetails(
						{},
						'Remote smoke test (get base folder test)',
						`res: ${await serializeRes(res)}`
					)
				);
			}
		},
	};
}
