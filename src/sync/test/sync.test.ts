import { Readable } from "stream";
import Sync, {Deltas, FileSystem, Listing, ListingStore} from "../sync"

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
		async existsFolder(){
			return false;
		},
		async deleteFolder(){
			return;
		},
		async getSource(){
			return {modTime:4, size:4, stream: {} as Readable}
		}
	})

	function setupEventSpies(sync: Sync) {
		const checkingLastRunCB = jest.fn()
		const needResyncCB = jest.fn()
		const generatingActionsCB = jest.fn()
		const pullingFileCB = jest.fn()
		const pulledFileCB = jest.fn()
		const deletingFileCB = jest.fn()
		const deletedFileCB = jest.fn()
		const deletingFolderCB = jest.fn()
		const deletedFolderCB = jest.fn()
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
		sync.on('DELETING_FOLDER', deletingFolderCB)
		sync.on('FOLDER_DELETED', deletedFolderCB)
		sync.on('RENAMING_FILE', renamingFileCB)
		sync.on('FILE_RENAMED', renamedFileCB)
		sync.on('SAVING_LISTINGS', savingListingsCB)
		sync.on('DONE', doneCB)

		return {
			checkingLastRunCB, needResyncCB, generatingActionsCB, 
			pullingFileCB, pulledFileCB, deletingFileCB, deletedFileCB,
			deletingFolderCB, deletedFolderCB,
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
		expect(spyRemotePull).toHaveBeenCalledWith('notExistInRemote', expect.anything(), expect.anything())
		expect(spyRemotePull).toHaveBeenCalledWith('folder/nested/existInBoth_local.txt', expect.anything(), expect.anything())

		expect(spyLocalRename).toBeCalledWith('folder/nested/existInBoth.txt', 'folder/nested/existInBoth_local.txt')
		expect(spyLocalPull).toHaveBeenCalledWith('notExistInLocal', expect.anything(), expect.anything())
		expect(spyLocalPull).toHaveBeenCalledWith('folder/nested/existInBoth_remote.txt', expect.anything(), expect.anything())

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
					'newer/newer/different': 4,
					'newer/newer/same': 4,
					'newer/deleted': 5,
					'newer/older': 5,
					'newer/unchanged': 4,
					'deleted/newer': 4,
					'deleted/deleted': 4,
					'deleted/older': 4,
					'deleted/unchanged': 4,
					'older/newer': 4,
					'older/deleted': 4,
					'older/older/same': 4,
					'older/older/different': 4,
					'older/unchanged': 4,
					'unchanged/newer': 4,
					'unchanged/deleted': 4,
					'unchanged/older': 4,
					'unchanged/unchanged': 4,
				}
			}
		}
		const local: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					'new/new/different': 4,
					'new/new/same': 4,
					'new/noexist': 43,
					'newer/newer/different': 5,
					'newer/newer/same': 5,
					'newer/deleted': 6,
					'newer/older': 6,
					'newer/unchanged': 5,
					'older/newer': 3,
					'older/deleted': 3,
					'older/older/same': 3,
					'older/older/different': 3,
					'older/unchanged': 3,
					'unchanged/newer': 4,
					'unchanged/deleted': 4,
					'unchanged/older': 4,
					'unchanged/unchanged': 4,
				}
			},
		}

		const remote: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					'new/new/different': 5,
					'new/new/same': 4,
					'newer/newer/different': 6,
					'newer/newer/same': 5,
					'newer/older': 4,
					'newer/unchanged': 4,
					'deleted/newer': 5,
					'deleted/older': 3,
					'deleted/unchanged': 4,
					'older/newer': 5,
					'older/older/same': 3,
					'older/older/different': 2,
					'older/unchanged': 4,
					'unchanged/newer': 5,
					'unchanged/older': 3,
					'unchanged/unchanged': 4,
					'noexist/new': 4
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
			deletingFolderCB,
			deletedFolderCB,
			renamingFileCB, 
			renamedFileCB, 
			savingListingsCB, 
			doneCB
		} = setupEventSpies(sync)

		const spyRemotePull = jest.spyOn(remote, 'pullFile')
		const spyRemoteRename = jest.spyOn(remote, 'renameFile')
		const spyRemoteDelete = jest.spyOn(remote, 'deleteFile')
		const spyRemoteDeleteFolder = jest.spyOn(remote, 'deleteFolder')

		const spyLocalPull = jest.spyOn(local, 'pullFile')
		const spyLocalRename = jest.spyOn(local, 'renameFile')
		const spyLocalDelete = jest.spyOn(local, 'deleteFile')
		const spyLocalDeleteFolder = jest.spyOn(local, 'deleteFolder')

		await sync.run()

		const expectPullRemote = ['new/new/different_local', 'new/noexist', 'newer/newer/different_local', 'newer/deleted', 'newer/unchanged', 'newer/older_local', 'older/deleted', 'older/newer_local', 'older/older/different_local', 'older/unchanged']
		const expectPullLocal = ['new/new/different_remote', 'noexist/new', 'newer/newer/different_remote', 'deleted/newer', 'newer/older_remote', 'unchanged/newer', 'older/newer_remote', 'deleted/older', 'older/older/different_remote', 'unchanged/older']
		const notExpectPullRemote = ['new/new/same_local', 'newer/newer/same_local', 'unchanged/unchanged', 'older/older/same_local']
		const notExpectPullLocal = ['new/new/same_remote', 'newer/newer/same_remote', 'unchanged/unchanged', 'older/older/same_remote']


		expectPullRemote.forEach(name => expect(spyRemotePull).toBeCalledWith(name, expect.anything(), expect.anything()))
		expectPullLocal.forEach(name => expect(spyLocalPull).toBeCalledWith(name, expect.anything(), expect.anything()))

		notExpectPullRemote.forEach(name => expect(spyRemotePull).not.toBeCalledWith(name, expect.anything(), expect.anything()))
		notExpectPullLocal.forEach(name => expect(spyLocalPull).not.toBeCalledWith(name, expect.anything(), expect.anything()))

		const expectRenameRemote = [['new/new/different', 'new/new/different_remote'], ['newer/newer/different', 'newer/newer/different_remote'], ['older/older/different', 'older/older/different_remote'], ['newer/older', 'newer/older_remote'], ['older/newer', 'older/newer_remote']]
		const expectRenameLocal = [['new/new/different', 'new/new/different_local'], ['newer/newer/different', 'newer/newer/different_local'], ['older/older/different', 'older/older/different_local'], ['newer/older', 'newer/older_local'], ['newer/older', 'newer/older_local']]

		expectRenameLocal.forEach(args => expect(spyLocalRename).toBeCalledWith(...args))
		expectRenameRemote.forEach(args => expect(spyRemoteRename).toBeCalledWith(...args))

		expect(spyLocalDelete).not.toBeCalledWith('deleted/deleted')
		expect(spyRemoteDelete).not.toBeCalledWith('deleted/deleted')

		expect(spyLocalDelete).toBeCalledWith('unchanged/deleted')
		expect(spyRemoteDelete).toBeCalledWith('deleted/unchanged')
		
		expect(spyRemoteDeleteFolder).toBeCalledWith('deleted')
		expect(spyLocalDeleteFolder).not.toBeCalled()

		expect(checkingLastRunCB).toBeCalledTimes(1)
		expect(needResyncCB).toBeCalledTimes(0)
		expect(generatingActionsCB).toBeCalledTimes(1)

		const expectedPulls = expectPullLocal.length + expectPullRemote.length
		expect(pullingFileCB).toBeCalledTimes(expectedPulls)
		expect(pulledFileCB).toBeCalledTimes(expectedPulls)

		expect(deletingFileCB).toBeCalledTimes(2)
		expect(deletedFileCB).toBeCalledTimes(2)

		expect(deletingFolderCB).toBeCalledTimes(1)
		expect(deletedFolderCB).toBeCalledTimes(1)

		const expectedRenames = expectRenameLocal.length + expectRenameRemote.length
		expect(renamingFileCB).toBeCalledTimes(expectedRenames)
		expect(renamedFileCB).toBeCalledTimes(expectedRenames)

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

		const localListing: Listing = {
			a: 2,
			aa: 2,
			b: 2,

			c: 2,
			cc: 2,
			d: 2,
			e: 2,
			f: 2,

			k: 2,
			m: 2,
			n: 2,
			nn: 2,
			l: 2,

			o: 2,
			p: 2,
			q: 2,
			r: 2
		}

		const remoteListing: Listing = {
			a: 1,
			aa: 2,
			b: 2,

			c: 1,
			cc: 2,
			e: 2,
			f: 2,

			g: 2,
			h: 2,
			i: 2,
			j: 2,

			k: 2,
			n: 1,
			nn: 2,
			l: 2,

			o: 2,
			q: 2,
			r: 2
		}

		const deltasLocal: Deltas = {
			a: 'NEW',
			aa: 'NEW',
			b: 'NEW',

			c: 'NEWER',
			cc: 'NEWER',
			d: 'NEWER',
			e: 'NEWER',
			f: 'NEWER',

			g: 'DELETED',
			i: 'DELETED',
			j: 'DELETED',

			k: 'OLDER',
			m: 'OLDER',
			n: 'OLDER',
			nn: 'OLDER',
			l: 'OLDER',

			o: 'UNCHANGED',
			p: 'UNCHANGED',
			q: 'UNCHANGED',
			r: 'UNCHANGED'
		}

		const deltasRemote: Deltas = {
			a: 'NEW',
			aa: 'NEW',

			c: 'NEWER',
			cc: 'NEWER',
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
			nn: 'OLDER',
			l: 'UNCHANGED',

			o: 'NEWER',
			p: 'DELETED',
			q: 'OLDER',
			r: 'UNCHANGED',

			s: 'NEW'
		}

		const {pullFromLocal, pullFromRemote, renameInLocal, renameInRemote, deleteInLocal, deleteInRemote} = sync['generateActionQueues'](deltasLocal, deltasRemote, localListing, remoteListing)

		expect(pullFromLocal.sort()).toEqual(['a_remote', 'c_remote', 'e_remote', 'g', 'i', 'k_remote', 'n_remote', 'o', 'q', 's'].sort())
		expect(pullFromRemote.sort()).toEqual(['a_local', 'c_local', 'e_local', 'k_local', 'n_local', 'b', 'd', 'f', 'm', 'l'].sort())

		expect(renameInLocal.sort()).toEqual([['a', 'a_local'],['c', 'c_local'],['e', 'e_local'],['k', 'k_local'],['n', 'n_local']].sort())
		expect(renameInRemote.sort()).toEqual([['a', 'a_remote'],['c', 'c_remote'],['e', 'e_remote'],['k', 'k_remote'],['n', 'n_remote']].sort())

		expect(deleteInLocal).toEqual(['p'])
		expect(deleteInRemote).toEqual(['j'])
	})

	it('should detect folder that has been deleted', async () => {
		const sync = dummySync()

		const savedListing: Listing = {
			'a': 4,
			'b': 4,
			'c/d': 5,
			'c/e': 6,
			'c/f': 7,
			'd/a': 2,
			'd/b': 2,
			'e/a': 1,
			'e/b': 2,
			'nested/quite/a': 1,
			'nested/quite/b': 1,
			'nested/dontDisapear/a': 1,
			'nested/dontDisapear/b': 1,
			'disapear/but/returnfalse': 2
		}

		const currentListing: Listing = {
			'a': 4,
			'c/d': 5,
			'c/e': 6,
			'c/f': 7,
			'd/a': 2,
			'nested/dontDisapear/a': 1,
		}

		const fileSystem = {
			async existsFolder(name: string){
				return name === 'disapear/but' || name === 'disapear'
			}
		}

		const result = await sync['listDeletedFolders'](savedListing, currentListing, fileSystem)

		expect(result.sort()).toEqual(['e', 'nested/quite'].sort())
	})
})