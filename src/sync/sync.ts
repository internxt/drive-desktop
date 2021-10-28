import * as EventEmitter from 'events'
import * as path from 'path'
import * as _ from 'lodash'
import Logger from '../libs/logger'
import { Readable } from 'stream'

 class Sync extends EventEmitter {
	constructor (private readonly local: FileSystem, private readonly remote: FileSystem, private readonly listingStore: ListingStore) {
		super()
	}

	async run(): Promise<void> {
		this.emit('CHECKING_LAST_RUN_OUTCOME')
		const lastSavedListing = this.listingStore.getLastSavedListing()

		Logger.log("Last saved listing:", lastSavedListing)

		if (!lastSavedListing) 
			return this.resync()

		this.emit('GENERATING_ACTIONS_NEEDED_TO_SYNC')
		const [currentLocal, currentRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		Logger.log("Current local before", currentLocal)
		Logger.log("Current remote before", currentRemote)

		const deltasLocal = this.generateDeltas(lastSavedListing, currentLocal)
		const deltasRemote = this.generateDeltas(lastSavedListing, currentRemote)

		Logger.log("Local deltas", deltasLocal)
		Logger.log("Remote deltas", deltasRemote)

		const { renameInLocal, renameInRemote, pullFromLocal, pullFromRemote, deleteInLocal, deleteInRemote } = this.generateActionQueues(deltasLocal, deltasRemote, currentLocal, currentRemote)

		this.listingStore.removeSavedListing()

		Logger.log("Queue rename in local", renameInLocal)
		Logger.log("Queue rename in remote", renameInRemote)
		Logger.log("Queue pull from local", pullFromLocal)
		Logger.log("Queue pull from remote", pullFromRemote)
		Logger.log("Queue delete from local", deleteInLocal)
		Logger.log("Queue delete from remote", deleteInRemote)

		await Promise.all([this.consumeRenameQueue(renameInLocal, this.local), this.consumeRenameQueue(renameInRemote, this.remote)])
		await Promise.all([this.consumePullQueue(pullFromLocal, this.local, this.remote), this.consumePullQueue(pullFromRemote, this.remote, this.local)])
		await Promise.all([this.consumeDeleteQueue(deleteInLocal, this.local), this.consumeDeleteQueue(deleteInRemote, this.remote)])

		const [foldersDeletedInLocal, foldersDeletedInRemote] = await Promise.all([this.listDeletedFolders(lastSavedListing, currentLocal, this.local), this.listDeletedFolders(lastSavedListing, currentRemote, this.remote)])

		Logger.log("Folders deleted in local", foldersDeletedInLocal)
		Logger.log("Folders deleted in remote", foldersDeletedInRemote)
		await Promise.all([this.consumeDeleteFolderQueue(foldersDeletedInRemote, this.local), this.consumeDeleteFolderQueue(foldersDeletedInLocal, this.remote)])

		await this.finalize()
	}

	private async resync(): Promise<void> {
		this.emit('NEEDS_RESYNC')

		const [currentLocal, currentRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		Logger.log("Current local before", currentLocal)
		Logger.log("Current remote before", currentRemote)

		const {filesNotInLocal: pullFromLocal, filesNotInRemote: pullFromRemote, filesWithDifferentModtime} = this.getListingsDiff(currentLocal, currentRemote)

		const renameInLocal: [string, string][] = []
		const renameInRemote: [string, string][] = []

		for (const name of filesWithDifferentModtime) {
			const localRenamed = this.rename(name, 'local')
			const remoteRenamed = this.rename(name, 'remote')

			renameInLocal.push([name, localRenamed])
			renameInRemote.push([name, remoteRenamed])

			pullFromLocal.push(remoteRenamed)
			pullFromRemote.push(localRenamed)
		}

		Logger.log("Queue rename in local", renameInLocal)
		Logger.log("Queue rename in remote", renameInRemote)
		Logger.log("Queue pull from local", pullFromLocal)
		Logger.log("Queue pull from remote", pullFromRemote)

		await Promise.all([this.consumeRenameQueue(renameInLocal, this.local), this.consumeRenameQueue(renameInRemote, this.remote)])
		await Promise.all([this.consumePullQueue(pullFromLocal, this.local, this.remote), this.consumePullQueue(pullFromRemote, this.remote, this.local)])


		await this.finalize()
	}

	private generateActionQueues(deltasLocal: Deltas, deltasRemote: Deltas, currentLocalListing: Listing, currentRemoteListing: Listing): {renameInLocal:[string,string][], renameInRemote: [string, string][], pullFromLocal: string[], pullFromRemote: string[], deleteInLocal: string[], deleteInRemote: string[]} {
		const pullFromLocal: string[] = []
		const pullFromRemote: string[] = []
		const renameInLocal: [string, string][] = []
		const renameInRemote: [string, string][] = []
		const deleteInLocal: string[] = []
		const deleteInRemote: string[] = []

		const renameAndKeepBoth = (name: string) => {
			const localRenamed = this.rename(name, 'local')
			const remoteRenamed = this.rename(name, 'remote')

			renameInLocal.push([name, localRenamed])
			renameInRemote.push([name, remoteRenamed])

			pullFromLocal.push(remoteRenamed)
			pullFromRemote.push(localRenamed)
		}

		for (const [name, deltaLocal] of Object.entries(deltasLocal)) {
			const deltaRemote = deltasRemote[name]
			const doesntExistInRemote = deltaRemote === undefined
			const sameModTime = currentLocalListing[name] === currentRemoteListing[name]

			if (deltaLocal === 'NEW' && deltaRemote === 'NEW' && !sameModTime) {
				renameAndKeepBoth(name)
			}

			if (deltaLocal === 'NEW' && doesntExistInRemote) {
				pullFromRemote.push(name)
			}

			if (deltaLocal === 'NEWER' && deltaRemote === 'NEWER' && !sameModTime) {
				renameAndKeepBoth(name)
			}

			if (deltaLocal === 'NEWER' && (deltaRemote === 'DELETED' || deltaRemote === 'UNCHANGED')) {
				pullFromRemote.push(name)
			}

			if (deltaLocal === 'NEWER' && deltaRemote === 'OLDER') {
				renameAndKeepBoth(name)
			}

			if (deltaLocal === 'DELETED' && (deltaRemote === 'NEWER' || deltaRemote === 'OLDER')) {
				pullFromLocal.push(name)
			}

			if (deltaLocal === 'DELETED' && deltaRemote === 'UNCHANGED') {
				deleteInRemote.push(name)
			}

			if (deltaLocal === 'OLDER' && deltaRemote === 'NEWER') {
				renameAndKeepBoth(name)
			}

			if (deltaLocal === 'OLDER' && (deltaRemote === 'DELETED' || deltaRemote === 'UNCHANGED')) {
				pullFromRemote.push(name)
			}

			if (deltaLocal === 'OLDER' && deltaRemote === 'OLDER' && !sameModTime) {
				renameAndKeepBoth(name)
			}

			if (deltaLocal === 'UNCHANGED' && (deltaRemote === 'NEWER' || deltaRemote === 'OLDER')) {
				pullFromLocal.push(name)
			}

			if (deltaLocal === 'UNCHANGED' && deltaRemote === 'DELETED') {
				deleteInLocal.push(name)
			}
		}

		for (const [name, deltaRemote] of Object.entries(deltasRemote)) {
			if (deltaRemote === 'NEW' && !(name in deltasLocal)) {
				pullFromLocal.push(name)
			}
		}

		return {
			pullFromLocal,
			pullFromRemote,
			renameInLocal,
			renameInRemote,
			deleteInLocal,
			deleteInRemote
		}
	}

	private generateDeltas(saved: Listing, current: Listing): Deltas {
		const deltas: Deltas = {}

		for (const [name, currentModTime] of Object.entries(current)) {
			const savedModTime = saved[name]

			if (!savedModTime) {
				deltas[name] = 'NEW'
			} else if (savedModTime === currentModTime) {
				deltas[name] = 'UNCHANGED'
			} else if (savedModTime < currentModTime) {
				deltas[name] = 'NEWER'
			} else {
				deltas[name] = 'OLDER'
			}
		}

		for (const name of Object.keys(saved)) {
			if (!(name in current)) {
				deltas[name] = 'DELETED'
			}
		}

		return deltas
	}

	private async listDeletedFolders(saved: Listing, current: Listing, filesystem: Pick<FileSystem, 'existsFolder'>): Promise<string[]> {

		function getFoldersInListing(listing: Listing): Set<string> {
			const setOfFolders = new Set<string>()
			for (const fileName of Object.keys(listing)){
				const names = fileName.split('/')
				names.pop()

				for (let i = 0 ; i < names.length ; i++) {
					const routeToThisPoint = names.slice(0, i + 1).join('/')

					setOfFolders.add(routeToThisPoint)
				}
			}
			return setOfFolders
		}

		const foldersInSaved = getFoldersInListing(saved)
		const foldersInCurrent = getFoldersInListing(current)

		const difference = [...foldersInSaved].filter(folder => !foldersInCurrent.has(folder))

		const toReturn = []

		for (const folder of difference) {
			const existsInFilesystem = await filesystem.existsFolder(folder)

			if (!existsInFilesystem)
				toReturn.push(folder)
		}

		return toReturn
	}

	private rename(name: string, sufix: string): string {
		const {dir, ext, name: base} = path.parse(name)

		return `${dir ? `${dir}/` : ''}${base}_${sufix}${ext}`
	}

	private async consumeRenameQueue(queue: [string, string][], fileSystem: FileSystem): Promise<void> {
		for (const [oldName, newName] of queue) {
			this.emit('RENAMING_FILE', oldName, newName, fileSystem.kind)
			await fileSystem.renameFile(oldName, newName)
			this.emit('FILE_RENAMED', oldName, newName,fileSystem.kind) 
		}
	}
	private async consumePullQueue(queue: string[], destFs: Pick<FileSystem, 'pullFile' | 'kind'>, srcFs: Pick<FileSystem, 'getSource'>): Promise<void> {
		for (const name of queue) {
			this.emit('PULLING_FILE', name, 0, destFs.kind)

			const progressCallback = (progress: number) => this.emit('PULLING_FILE', name, progress, destFs.kind)

			const source = await srcFs.getSource(name, progressCallback)

			await destFs.pullFile(name, source, progressCallback)

			this.emit('FILE_PULLED', name, destFs.kind)
		}
	}
	private async consumeDeleteQueue(queue: string[], fileSystem: FileSystem): Promise<void> {
		for (const name of queue) {
			this.emit('DELETING_FILE', name, fileSystem.kind)
			await fileSystem.deleteFile(name)
			this.emit('FILE_DELETED', name, fileSystem.kind)
		}
	}

	private async consumeDeleteFolderQueue(queue: string[], fileSystem: FileSystem): Promise<void> {
		for (const name of queue) {
			this.emit('DELETING_FOLDER', name, fileSystem.kind)
			await fileSystem.deleteFolder(name)
			this.emit('FOLDER_DELETED', name, fileSystem.kind)
		}
	}

	private async finalize(){
		this.emit('FINALIZING')

		const [newLocal, newRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		if (_.isEqual(newLocal, newRemote)) {
			Logger.log("Listings are equal: Bisync successful")
			Logger.log("Current in both:", newLocal)

			this.listingStore.saveListing(newLocal)

			this.emit('DONE', {status: 'IN_SYNC'})
		} 
		else {
			Logger.warn("Listings are not equal")
			Logger.log("Current local:", newLocal)
			Logger.log("Current remote:", newRemote)

			const diff = this.getListingsDiff(newLocal, newRemote)
			this.emit('DONE', {status: 'NOT_IN_SYNC', diff})
		}
	}

	private getListingsDiff(local: Listing, remote: Listing): ListingsDiff {
		const filesNotInLocal = []
		const filesNotInRemote = []
		const filesWithDifferentModtime = []

		for (const [localName, localModtime] of Object.entries(local)) {
			const remoteModTime = remote[localName]

			if (!remoteModTime) {
				filesNotInRemote.push(localName)
			}
			else if (localModtime !== remoteModTime){
				filesWithDifferentModtime.push(localName)
			}
		}

		for (const remoteName of Object.keys(remote)){
			if (!(remoteName in local)){
				filesNotInLocal.push(remoteName)
			}
		}

		return {filesNotInLocal, filesNotInRemote, filesWithDifferentModtime}
	}
}

export interface FileSystem {
	/**
	 * The kind of filesystem, it's emitted
	 * in some fs events
	 */
	kind: FileSystemKind

	/**
	 * Returns the listing of the current files 
	 * in this FileSystem
	 */
	getCurrentListing(): Promise<Listing>

	/**
	 * Renames a file in the FileSystem
	 * @param oldName 
	 * @param newName 
	 */
	renameFile(oldName: string, newName: string): Promise<void>

	/**
	 * Deletes a file in the FileSystem,
	 * doesn't throw if the file doesn't exist anymore
	 * @param name 
	 */
	deleteFile(name: string): Promise<void>

	/**
	 * Pulls a file from other FileSystem into this FileSystem,
	 * overwriting it if already exists
	 * @param name
	 * @param source 
	 * @param progressCallback 
	 */
	pullFile(name: string, source: Source, progressCallback: FileSystemProgressCallback): Promise<void>

	/**
	 * Checks if a folder exists in the filesystem 
	 * @param name 
	 */
	existsFolder(name: string): Promise<boolean>

	/**
	 * Deletes a folder in the filesystem 
	 * doesn't throw if the folder doesn't exist anymore
	 * @param name 
	 */
	deleteFolder(name: string): Promise<void>

	/**
	 * Returns an object source that contains
	 * anything that another filesystem would need
	 * to pull it 
	 * @param name 
	 * @param progressCallback 
	 */
	getSource(name: string, progressCallback: FileSystemProgressCallback): Promise<Source>
}

export type FileSystemProgressCallback = (progress:number) => void

export type Source = {
	stream: Readable
	modTime: number
	size: number
}

export type ListingStore = {
	/**
	 * Returns the listing of the files 
	 * saved the last time 
	 * a sync was completed or null otherwise
	 */
	getLastSavedListing(): Listing | null
	/**
	 * Removes the last saved listing of files
	 */
	removeSavedListing(): void
	/**
	 * Saves a listing to be queried in
	 * consecutive runs
	 */
	saveListing(listing: Listing): void
}

/**
 * Represents a list of files, each with
 * its modTime that is set as seconds since epoch
 * 
 * The name of each file can be namespaced by
 * his ancestors such as: folderA/folderB/fileName
 * It cannot start or end with "/"
 */
export type Listing = Record<string, number>

export type Deltas = Record<string, Delta>

type Delta = 'NEW' | 'NEWER' | 'DELETED' | 'OLDER' | 'UNCHANGED'

type FileSystemKind = 'LOCAL' | 'REMOTE'

interface SyncEvents {
	/**
	 * Triggered when the process tries to gather
	 * information about the outcome of the last run
	 */
  'CHECKING_LAST_RUN_OUTCOME': () => void;
	/**
	 * Triggered when the process has not enough information 
	 * to do a default sync, because either something went wrong
	 * in the last run or because it is the first one
	 */
  'NEEDS_RESYNC': () => void;
	/**
	 * Triggered when the default run has started and processing
	 * what changes need to be done in remote/local to be 
	 * properly synced
	 */
  'GENERATING_ACTIONS_NEEDED_TO_SYNC': () => void;

	/**
	 * Triggered when a file is being pulled 
	 */
  'PULLING_FILE': (name: string, progress: number, fileSystemKind: FileSystemKind) => void;
	/**
	 * Triggered when a file has been pulled 
	 */
  'FILE_PULLED': (name: string, fileSystemKind: FileSystemKind) => void;

	/**
	 * Triggered when a file is being deleted 
	 */
	'DELETING_FILE': (name: string, fileSystemKind: FileSystemKind) => void;
	/**
	 * Triggered when a file has been deleted 
	 */
	'FILE_DELETED': (name: string, fileSystemKind: FileSystemKind) => void;

	/**
	 * Triggered when a folder is being deleted 
	 */
	'DELETING_FOLDER': (name: string, fileSystemKind: FileSystemKind) => void;
	/**
	 * Triggered when a folder has been deleted 
	 */
	'FOLDER_DELETED': (name: string, fileSystemKind: FileSystemKind) => void;

	/**
	 * Triggered when a file is being renamed 
	 */
	'RENAMING_FILE': (oldName: string, newName: string, fileSystemKind: FileSystemKind) => void;
	/**
	 * Triggered when a file has been renamed 
	 */
	'FILE_RENAMED': (oldName: string, newName: string, fileSystemKind: FileSystemKind) => void;

	/**
	 * Triggered when the changes needed to be in sync
	 * have been made (either by a default run or a resync)
	 * and new listings will be generated and saved if the
	 * filesystems are in sync
	 */
	'FINALIZING': () => void;

	/**
	 * Triggered when the process is done
	 */
	'DONE': (result: SuccessfulSyncResult | UnsuccessfulSyncResult) => void;
}

type SuccessfulSyncResult = {
	status: 'IN_SYNC' 
}

type UnsuccessfulSyncResult = {
	status: 'NOT_IN_SYNC',
	diff: ListingsDiff
}

type ListingsDiff = {
	filesNotInLocal: string[],
	filesNotInRemote: string[],
	filesWithDifferentModtime: string[]
}

declare interface Sync {
  on<U extends keyof SyncEvents>(
    event: U, listener: SyncEvents[U]
  ): this;

  emit<U extends keyof SyncEvents>(
    event: U, ...args: Parameters<SyncEvents[U]>
  ): boolean;
}

export default Sync;