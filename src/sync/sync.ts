import * as EventEmitter from 'events'
import * as path from 'path'

export default class Sync extends EventEmitter {
	constructor (private readonly local: FileSystem, private readonly remote: FileSystem) {
		super()
	}

	async run(): Promise<void> {
		const [lastSavedLocal, lastSavedRemote] = await Promise.all([this.local.getLastSavedListing(), this.remote.getLastSavedListing()])

		if (!lastSavedLocal || !lastSavedRemote)
			return this.resync()

		const [currentLocal, currentRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		const deltasLocal = this.generateDeltas(lastSavedLocal, currentLocal)
		const deltasRemote = this.generateDeltas(lastSavedRemote, currentRemote)

		const {renameInLocal, renameInRemote, pullFromLocal, pullFromRemote, deleteInLocal, deleteInRemote} = this.generateActionQueues(deltasLocal, deltasRemote)

		await Promise.all([this.local.removeSavedListing(), this.remote.removeSavedListing()])

		await Promise.all([this.consumeRenameQueue(renameInLocal, this.local), this.consumeRenameQueue(renameInRemote, this.remote)])
		await Promise.all([this.consumePullQueue(pullFromLocal, this.local), this.consumePullQueue(pullFromRemote, this.remote)])
		await Promise.all([this.consumeDeleteQueue(deleteInLocal, this.local), this.consumeDeleteQueue(deleteInRemote, this.remote)])


		const [newLocal, newRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		await Promise.all([this.local.saveListing(newLocal), this.remote.saveListing(newRemote)])
	}

	private async resync(): Promise<void> {
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
			} else {
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


		const [newLocal, newRemote] = await Promise.all([this.local.getCurrentListing(), this.remote.getCurrentListing()])

		await Promise.all([this.local.saveListing(newLocal), this.remote.saveListing(newRemote)])
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
			await fileSystem.renameFile(oldName, newName)
		}
	}
	private async consumePullQueue(queue: string[], fileSystem: FileSystem): Promise<void> {
		for (const name of queue) {
			await fileSystem.pullFile(name)
		}
	}
	private async consumeDeleteQueue(queue: string[], fileSystem: FileSystem): Promise<void> {
		for (const name of queue) {
			await fileSystem.deleteFile(name)
		}
	}
}

export interface FileSystem {
	getLastSavedListing(): Promise<Listing | null>
	removeSavedListing(): Promise<void>
	getCurrentListing(): Promise<Listing>
	saveListing(listing: Listing): Promise<void>

	renameFile(oldName: string, newName: string): Promise<void>
	deleteFile(name: string): Promise<void>
	pullFile(name: string): Promise<void>
}

type Listing = Record<string, number>

type Deltas = Record<string, Delta>

type Delta = 'NEW' | 'NEWER' | 'DELETED' | 'OLDER' | 'UNCHANGED'
