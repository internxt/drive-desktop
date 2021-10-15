import * as EventEmitter from 'events'
import * as path from 'path'

 class Sync extends EventEmitter {
	constructor (private readonly local: FileSystem, private readonly remote: FileSystem) {
		super()
	}

	async run(): Promise<void> {
		this.emit('CHECKING_LAST_RUN_OUTCOME')
		const [lastSavedLocal, lastSavedRemote] = await Promise.all([this.local.getLastSavedListing(), this.remote.getLastSavedListing()])

		if (!lastSavedLocal || !lastSavedRemote)
			return this.resync()

		this.emit('GENERATING_ACTIONS_NEEDED_TO_SYNC')

		const [currentLocal, currentRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		const deltasLocal = this.generateDeltas(lastSavedLocal, currentLocal)
		const deltasRemote = this.generateDeltas(lastSavedRemote, currentRemote)

		const {renameInLocal, renameInRemote, pullFromLocal, pullFromRemote, deleteInLocal, deleteInRemote} = this.generateActionQueues(deltasLocal, deltasRemote)

		await Promise.all([this.local.removeSavedListing(), this.remote.removeSavedListing()])

		await Promise.all([this.consumeRenameQueue(renameInLocal, this.local), this.consumeRenameQueue(renameInRemote, this.remote)])
		await Promise.all([this.consumePullQueue(pullFromLocal, this.local), this.consumePullQueue(pullFromRemote, this.remote)])
		await Promise.all([this.consumeDeleteQueue(deleteInLocal, this.local), this.consumeDeleteQueue(deleteInRemote, this.remote)])

		await this.saveListings()
	}

	private async resync(): Promise<void> {
		this.emit('NEEDS_RESYNC')

		const [currentLocal, currentRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

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

	private rename(name: string, prefix: string): string {
		const {dir,ext,name: base} = path.parse(name)

		return `${dir ? `${dir}/` : ''}${base}_${prefix}${ext}`
	}

	private async consumeRenameQueue(queue: [string, string][], fileSystem: FileSystem): Promise<void> {
		for (const [oldName, newName] of queue) {
			this.emit('RENAMING_FILE', oldName, newName)
			await fileSystem.renameFile(oldName, newName)
			this.emit('FILE_RENAMED', oldName, newName)
		}
	}
	private async consumePullQueue(queue: string[], fileSystem: FileSystem): Promise<void> {
		for (const name of queue) {
			this.emit('PULLING_FILE', name, 0)
			await fileSystem.pullFile(name, progress => this.emit('PULLING_FILE', name, progress))
			this.emit('FILE_PULLED', name)
		}
	}
	private async consumeDeleteQueue(queue: string[], fileSystem: FileSystem): Promise<void> {
		for (const name of queue) {
			this.emit('DELETING_FILE', name)
			await fileSystem.deleteFile(name)
			this.emit('FILE_DELETED', name)
		}
	}

	private async saveListings(){
		this.emit('SAVING_LISTINGS')

		const [newLocal, newRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		await Promise.all([this.local.saveListing(newLocal), this.remote.saveListing(newRemote)])

		this.emit('DONE')
	}
}

export interface FileSystem {
	getLastSavedListing(): Promise<Listing | null>
	removeSavedListing(): Promise<void>
	getCurrentListing(): Promise<Listing>
	saveListing(listing: Listing): Promise<void>

	renameFile(oldName: string, newName: string): Promise<void>
	deleteFile(name: string): Promise<void>
	pullFile(name: string, progressCallback: (progress: number) => void): Promise<void>
}

type Listing = Record<string, number>

type Deltas = Record<string, Delta>

type Delta = 'NEW' | 'NEWER' | 'DELETED' | 'OLDER' | 'UNCHANGED'

interface SyncEvents {
  'CHECKING_LAST_RUN_OUTCOME': () => void;
  'NEEDS_RESYNC': () => void;
  'GENERATING_ACTIONS_NEEDED_TO_SYNC': () => void;

  'PULLING_FILE': (name: string, progress: number) => void;
  'FILE_PULLED': (name: string) => void;

	'DELETING_FILE': (name: string) => void;
	'FILE_DELETED': (name: string) => void;

	'RENAMING_FILE': (oldName: string, newName: string) => void;
	'FILE_RENAMED': (oldName: string, newName: string) => void;

	'SAVING_LISTINGS': () => void;

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