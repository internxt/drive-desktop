import * as EventEmitter from 'events'
import * as path from 'path'
import * as _ from 'lodash'
import Logger from '../libs/logger'

 class Sync extends EventEmitter {
	constructor (private readonly local: FileSystem, private readonly remote: FileSystem, private readonly listingStore: ListingStore) {
		super()
	}

	async run(): Promise<void> {
		this.emit('CHECKING_LAST_RUN_OUTCOME')
		const lastSavedListing = this.listingStore.getLastSavedListing()

		Logger.log("last saved listing: ", lastSavedListing)

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

		const {renameInLocal, renameInRemote, pullFromLocal, pullFromRemote, deleteInLocal, deleteInRemote} = this.generateActionQueues(deltasLocal, deltasRemote)

		this.listingStore.removeSavedListing()

		Logger.log("Queue rename in local", renameInLocal)
		Logger.log("Queue rename in remote", renameInRemote)
		Logger.log("Queue pull from local", pullFromLocal)
		Logger.log("Queue pull from remote", pullFromRemote)
		Logger.log("Queue delete from local", deleteInLocal)
		Logger.log("Queue delete from remote", deleteInRemote)

		await Promise.all([this.consumeRenameQueue(renameInLocal, this.local), this.consumeRenameQueue(renameInRemote, this.remote)])
		await Promise.all([this.consumePullQueue(pullFromLocal, this.local), this.consumePullQueue(pullFromRemote, this.remote)])
		await Promise.all([this.consumeDeleteQueue(deleteInLocal, this.local), this.consumeDeleteQueue(deleteInRemote, this.remote)])

		await this.saveListings()
	}

	private async resync(): Promise<void> {
		this.emit('NEEDS_RESYNC')

		const [currentLocal, currentRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		Logger.log("Current local before", currentLocal)
		Logger.log("Current remote before", currentRemote)

		const pullFromLocal: string[] = []
		const pullFromRemote: string[] = []
		const renameInLocal: [string, string][] = []
		const renameInRemote: [string, string][] = []

		for (const [nameLocal, modTimeLocal] of Object.entries(currentLocal)) {
			const modTimeRemote = currentRemote[nameLocal]
			if (modTimeRemote && modTimeRemote !== modTimeLocal) {
				const name = nameLocal

				const localRenamed = this.rename(name, 'local')
				const remoteRenamed = this.rename(name, 'remote')

				renameInLocal.push([name, localRenamed])
				renameInRemote.push([name, remoteRenamed])

				pullFromLocal.push(remoteRenamed)
				pullFromRemote.push(localRenamed)
			} else if(modTimeRemote === undefined) {
				pullFromRemote.push(nameLocal)
			}
		}

		for (const nameRemote of Object.keys(currentRemote)) {
			if (!(nameRemote in currentLocal)) {
				pullFromLocal.push(nameRemote)
			}
		}
		Logger.log("Queue rename in local", renameInLocal)
		Logger.log("Queue rename in remote", renameInRemote)
		Logger.log("Queue pull from local", pullFromLocal)
		Logger.log("Queue pull from remote", pullFromRemote)

		await Promise.all([this.consumeRenameQueue(renameInLocal, this.local), this.consumeRenameQueue(renameInRemote, this.remote)])
		await Promise.all([this.consumePullQueue(pullFromLocal, this.local), this.consumePullQueue(pullFromRemote, this.remote)])


		await this.saveListings()
	}

	private generateActionQueues(deltasLocal: Deltas, deltasRemote: Deltas): {renameInLocal:[string,string][], renameInRemote: [string, string][], pullFromLocal: string[], pullFromRemote: string[], deleteInLocal: string[], deleteInRemote: string[]} {
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

			if (deltaLocal === 'NEW') {
				if (deltaRemote === 'NEW') {
					renameAndKeepBoth(name)
				}
				if (doesntExistInRemote) {
					pullFromRemote.push(name)
				}
			}

			if (deltaLocal === 'NEWER' || deltaLocal === 'OLDER') {
				if (deltaRemote === 'NEWER' || deltaRemote === 'OLDER') {
					renameAndKeepBoth(name)
				}
				if (deltaRemote === 'DELETED' || deltaRemote === 'UNCHANGED') {
					pullFromRemote.push(name)
				}
			}

			if (deltaLocal === 'DELETED') {
				if (deltaRemote === 'NEWER' || deltaRemote === 'OLDER') {
					pullFromLocal.push(name)
				}
				if (deltaRemote === 'UNCHANGED') {
					deleteInRemote.push(name)
				}
			}

			if (deltaLocal === 'UNCHANGED') {
				if (deltaRemote === 'NEWER' || deltaRemote === 'OLDER') {
					pullFromLocal.push(name)
				}
				if (deltaRemote === 'DELETED') {
					deleteInLocal.push(name)
				}
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
	private async consumePullQueue(queue: string[], fileSystem: FileSystem): Promise<void> {
		for (const name of queue) {
			this.emit('PULLING_FILE', name, 0, fileSystem.kind)
			await fileSystem.pullFile(name, progress => this.emit('PULLING_FILE', name, progress, fileSystem.kind))
			this.emit('FILE_PULLED', name, fileSystem.kind)
		}
	}
	private async consumeDeleteQueue(queue: string[], fileSystem: FileSystem): Promise<void> {
		for (const name of queue) {
			this.emit('DELETING_FILE', name, fileSystem.kind)
			await fileSystem.deleteFile(name)
			this.emit('FILE_DELETED', name, fileSystem.kind)
		}
	}

	private async saveListings(){
		this.emit('SAVING_LISTINGS')

		const [newLocal, newRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		if (_.isEqual(newLocal, newRemote)) {
			Logger.log("Listings are equal: Bisync successful")
			Logger.log("Current in both:", newLocal)
			this.listingStore.saveListing(newLocal)
		} 
		else {
			Logger.warn("Listings are not equal")
			Logger.log("Current local:", newLocal)
			Logger.log("Current remote:", newRemote)
		}

		this.emit('DONE')
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
	 * Deletes a file in the FileSystem
	 * @param name 
	 */
	deleteFile(name: string): Promise<void>

	/**
	 * Pulls a file from other FileSystem into this FileSystem,
	 * overwriting it if already exists
	 * @param name 
	 * @param progressCallback 
	 */
	pullFile(name: string, progressCallback: (progress: number) => void): Promise<void>
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
	 * Triggered when a file is being renamed 
	 */
	'RENAMING_FILE': (oldName: string, newName: string, fileSystemKind: FileSystemKind) => void;
	/**
	 * Triggered when a file has been renamed 
	 */
	'FILE_RENAMED': (oldName: string, newName: string, fileSystemKind: FileSystemKind) => void;

	/**
	 * Triggered when the changed needed to be in sync
	 * has been made (either by a default run or a resync)
	 * and new listings will be generated and saved
	 */
	'SAVING_LISTINGS': () => void;

	/**
	 * Triggered when the process is done
	 */
	'DONE': () => void;
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