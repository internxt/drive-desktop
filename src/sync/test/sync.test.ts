import Sync, {Deltas, FileSystem, ListingStore} from "../sync"

describe('sync tests', () => {
	const mockBase: () => FileSystem = () => ({
		kind: 'LOCAL',
		async getCurrentListing() {
			return {}
		},
		async deleteFile() {
			return;
		},
		async pullFile() {
			return;
		},
		async renameFile() {
			return;
		},
	})

	function setupEventSpies(sync: Sync) {
		const checkingLastRunCB = jest.fn()
		const needResyncCB = jest.fn()
		const generatingActionsCB = jest.fn()
		const pullingFileCB = jest.fn()
		const pulledFileCB = jest.fn()
		const deletingFileCB = jest.fn()
		const deletedFileCB = jest.fn()
		const renamingFileCB = jest.fn()
		const renamedFileCB = jest.fn()
		const savingListingsCB = jest.fn()
		const doneCB = jest.fn()
		

		sync.on('CHECKING_LAST_RUN_OUTCOME', checkingLastRunCB)
		sync.on('NEEDS_RESYNC', needResyncCB)
		sync.on('GENERATING_ACTIONS_NEEDED_TO_SYNC', generatingActionsCB)
		sync.on('PULLING_FILE', pullingFileCB)
		sync.on('FILE_PULLED', pulledFileCB)
		sync.on('DELETING_FILE', deletingFileCB)
		sync.on('FILE_DELETED', deletedFileCB)
		sync.on('RENAMING_FILE', renamingFileCB)
		sync.on('FILE_RENAMED', renamedFileCB)
		sync.on('SAVING_LISTINGS', savingListingsCB)
		sync.on('DONE', doneCB)

		return {
			checkingLastRunCB, needResyncCB, generatingActionsCB, 
			pullingFileCB, pulledFileCB, deletingFileCB, deletedFileCB,
			renamingFileCB, renamedFileCB, savingListingsCB, doneCB
		}
	}

	function listingStore(): ListingStore {
		return {
			getLastSavedListing(){
				return null 
			},
			removeSavedListing() {
				return
			},
			saveListing() {
				return
			}
		}
	}

	function dummySync() {
		return new Sync(mockBase(), mockBase(), listingStore())
	}
	
	it ('should do resync correctly', async () => {
		const local: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					notExistInRemote: 40,
					existInBothButIsTheSame: 30,
					'folder/nested/existInBoth.txt': 44
				}
			},
		}

		const remote: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					notExistInLocal: 40,
					existInBothButIsTheSame: 30,
					'folder/nested/existInBoth.txt': 55
				}
			},
		}

		const sync = new Sync(local, remote, listingStore())

		const {
			checkingLastRunCB, 
			needResyncCB, 
			generatingActionsCB, 
			pullingFileCB, 
			pulledFileCB, 
			deletingFileCB,
			deletedFileCB, 
			renamingFileCB, 
			renamedFileCB, 
			savingListingsCB, 
			doneCB
		} = setupEventSpies(sync)

		const spyRemotePull = jest.spyOn(remote, 'pullFile')
		const spyRemoteRename = jest.spyOn(remote, 'renameFile')

		const spyLocalPull = jest.spyOn(local, 'pullFile')
		const spyLocalRename = jest.spyOn(local, 'renameFile')

		await sync.run()
		
		expect(spyRemoteRename).toBeCalledWith('folder/nested/existInBoth.txt', 'folder/nested/existInBoth_remote.txt')
		expect(spyRemotePull).toHaveBeenCalledWith('notExistInRemote', expect.anything())
		expect(spyRemotePull).toHaveBeenCalledWith('folder/nested/existInBoth_local.txt', expect.anything())

		expect(spyLocalRename).toBeCalledWith('folder/nested/existInBoth.txt', 'folder/nested/existInBoth_local.txt')
		expect(spyLocalPull).toHaveBeenCalledWith('notExistInLocal', expect.anything())
		expect(spyLocalPull).toHaveBeenCalledWith('folder/nested/existInBoth_remote.txt', expect.anything())

		expect(checkingLastRunCB).toBeCalledTimes(1)
		expect(needResyncCB).toBeCalledTimes(1)
		expect(generatingActionsCB).toBeCalledTimes(0)
		expect(pullingFileCB).toBeCalledTimes(4)
		expect(pulledFileCB).toBeCalledTimes(4)
		expect(deletingFileCB).toBeCalledTimes(0)
		expect(deletedFileCB).toBeCalledTimes(0)
		expect(renamingFileCB).toBeCalledTimes(2)
		expect(renamedFileCB).toBeCalledTimes(2)
		expect(savingListingsCB).toBeCalledTimes(1)
		expect(doneCB).toBeCalledTimes(1)
	})

	it ('should do a default run correctly', async () => {
		const listingStoreMocked: ListingStore = {
			...listingStore(),
			getLastSavedListing(){
				return {
					'aFile': 33,
					'nested/anotherFile.pdf': 44,
					'nested/quiteNested/oneMoreFile.pdf': 44,
					'anotherRootFile': 10,
					'oneMoreRootFile': 20,
					'olderInBoth': 2
				}
			}
		}
		const local: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					'aFile': 35,
					'nested/quiteNested/oneMoreFile.pdf': 44,
					'anotherRootFile': 12,
					'oneNewFileInLocal': 12,
					'olderInBoth': 1
				}
			},
		}

		const remote: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					'aFile': 33,
					'nested/anotherFile.pdf': 44,
					'anotherRootFile': 11,
					'oneNewFileInRemote': 13,
					'olderInBoth': 1
				}
			},
		}

		const sync = new Sync(local, remote, listingStoreMocked)

		const {
			checkingLastRunCB, 
			needResyncCB, 
			generatingActionsCB, 
			pullingFileCB, 
			pulledFileCB, 
			deletingFileCB,
			deletedFileCB, 
			renamingFileCB, 
			renamedFileCB, 
			savingListingsCB, 
			doneCB
		} = setupEventSpies(sync)

		const spyRemotePull = jest.spyOn(remote, 'pullFile')
		const spyRemoteRename = jest.spyOn(remote, 'renameFile')
		const spyRemoteDelete = jest.spyOn(remote, 'deleteFile')

		const spyLocalPull = jest.spyOn(local, 'pullFile')
		const spyLocalRename = jest.spyOn(local, 'renameFile')
		const spyLocalDelete = jest.spyOn(local, 'deleteFile')

		await sync.run()
		
		expect(spyRemotePull).toBeCalledWith('aFile', expect.anything())
		expect(spyRemoteDelete).toBeCalledWith('nested/anotherFile.pdf')
		expect(spyLocalDelete).toBeCalledWith('nested/quiteNested/oneMoreFile.pdf')
		expect(spyLocalRename).toBeCalledWith('anotherRootFile', 'anotherRootFile_local')
		expect(spyLocalPull).toBeCalledWith('anotherRootFile_remote', expect.anything())
		expect(spyRemoteRename).toBeCalledWith('anotherRootFile', 'anotherRootFile_remote')
		expect(spyRemotePull).toBeCalledWith('anotherRootFile_local', expect.anything())
		expect(spyLocalDelete).not.toBeCalledWith('oneMoreRootFile')
		expect(spyRemoteDelete).not.toBeCalledWith('oneMoreRootFile')
		expect(spyRemotePull).toBeCalledWith('oneNewFileInLocal', expect.anything())
		expect(spyLocalPull).toBeCalledWith('oneNewFileInRemote', expect.anything())
		expect(spyRemoteRename).toBeCalledWith('olderInBoth','olderInBoth_remote')
		expect(spyLocalRename).toBeCalledWith('olderInBoth','olderInBoth_local')
		expect(spyLocalPull).toBeCalledWith('olderInBoth_remote', expect.anything())
		expect(spyRemotePull).toBeCalledWith('olderInBoth_local', expect.anything())

		expect(checkingLastRunCB).toBeCalledTimes(1)
		expect(needResyncCB).toBeCalledTimes(0)
		expect(generatingActionsCB).toBeCalledTimes(1)
		expect(pullingFileCB).toBeCalledTimes(7)
		expect(pulledFileCB).toBeCalledTimes(7)
		expect(deletingFileCB).toBeCalledTimes(2)
		expect(deletedFileCB).toBeCalledTimes(2)
		expect(renamingFileCB).toBeCalledTimes(4)
		expect(renamedFileCB).toBeCalledTimes(4)
		expect(savingListingsCB).toBeCalledTimes(1)
		expect(doneCB).toBeCalledTimes(1)
	})

	it('should rename correctly', () => {
		const sync = dummySync()

		expect(sync['rename']('whatever', 'sufix')).toBe('whatever_sufix')

		expect(sync['rename']('whatever.txt', 'sufix')).toBe('whatever_sufix.txt')

		expect(sync['rename']('nested/whatever.txt', 'sufix')).toBe('nested/whatever_sufix.txt')

		expect(sync['rename']('nested/deep/whatever.txt', 'sufix')).toBe('nested/deep/whatever_sufix.txt')

		expect(sync['rename']('nested/deep/whatever', 'sufix')).toBe('nested/deep/whatever_sufix')

		expect(sync['rename']('.hidden', 'sufix')).toBe('.hidden_sufix')

		expect(sync['rename']('.hidden.txt', 'sufix')).toBe('.hidden_sufix.txt')

		expect(sync['rename']('nested/.hidden.txt', 'sufix')).toBe('nested/.hidden_sufix.txt')

		expect(sync['rename']('nested/.hidden', 'sufix')).toBe('nested/.hidden_sufix')
	})

	it('should generate deltas correctly', () => {
		const sync = dummySync()

		const savedListing = {
			unchanged: 44,
			newer: 44,
			older: 44,
			deleted: 44
		}

		const currentListing = {
			unchanged: 44,
			newer: 45,
			older: 43,
			new: 44
		}

		const deltas = sync['generateDeltas'](savedListing, currentListing)

		expect(deltas.unchanged).toBe('UNCHANGED')
		expect(deltas.newer).toBe('NEWER')
		expect(deltas.older).toBe('OLDER')
		expect(deltas.deleted).toBe('DELETED')
		expect(deltas.new).toBe('NEW')
	})

	it('should generate action queues correctly', () => {
		const sync = dummySync()

		const deltasLocal: Deltas = {
			a: 'NEW',
			b: 'NEW',

			c: 'NEWER',
			d: 'NEWER',
			e: 'NEWER',
			f: 'NEWER',

			g: 'DELETED',
			h: 'DELETED',
			i: 'DELETED',
			j: 'DELETED',

			k: 'OLDER',
			m: 'OLDER',
			n: 'OLDER',
			l: 'OLDER',

			o: 'UNCHANGED',
			p: 'UNCHANGED',
			q: 'UNCHANGED',
			r: 'UNCHANGED'
		}

		const deltasRemote: Deltas = {
			a: 'NEW',

			c: 'NEWER',
			d: 'DELETED',
			e: 'OLDER',
			f: 'UNCHANGED',

			g: 'NEWER',
			h: 'DELETED',
			i: 'OLDER',
			j: 'UNCHANGED',

			k: 'NEWER',
			m: 'DELETED',
			n: 'OLDER',
			l: 'UNCHANGED',

			o: 'NEWER',
			p: 'DELETED',
			q: 'OLDER',
			r: 'UNCHANGED',

			s: 'NEW'
		}

		const {pullFromLocal, pullFromRemote, renameInLocal, renameInRemote, deleteInLocal, deleteInRemote} = sync['generateActionQueues'](deltasLocal, deltasRemote)

		expect(pullFromLocal.sort()).toEqual(['a_remote', 'c_remote', 'e_remote', 'g', 'i', 'k_remote', 'n_remote', 'o', 'q', 's'].sort())
		expect(pullFromRemote.sort()).toEqual(['a_local', 'c_local', 'e_local', 'k_local', 'n_local', 'b', 'd', 'f', 'm', 'l'].sort())

		expect(renameInLocal.sort()).toEqual([['a', 'a_local'],['c', 'c_local'],['e', 'e_local'],['k', 'k_local'],['n', 'n_local']].sort())
		expect(renameInRemote.sort()).toEqual([['a', 'a_remote'],['c', 'c_remote'],['e', 'e_remote'],['k', 'k_remote'],['n', 'n_remote']].sort())

		expect(deleteInLocal).toEqual(['p'])
		expect(deleteInRemote).toEqual(['j'])
	})
})