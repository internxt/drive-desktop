import Sync, {FileSystem} from "../sync"

describe('sync tests', () => {
		const mockBase: () => FileSystem = () => ({
			async getCurrentListing() {
				return {}
			},
			async getLastSavedListing(){
				return null
			},
			async saveListing() {
				return;
			},
			async removeSavedListing() {
				return;
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

		const sync = new Sync(local, remote)

		const spyRemotePull = jest.spyOn(remote, 'pullFile')
		const spyRemoteRename = jest.spyOn(remote, 'renameFile')

		const spyLocalPull = jest.spyOn(local, 'pullFile')
		const spyLocalRename = jest.spyOn(local, 'renameFile')

		await sync.run()
		
		expect(spyRemoteRename).toBeCalledWith('folder/nested/existInBoth.txt', 'folder/nested/existInBoth_remote.txt')
		expect(spyRemotePull).toHaveBeenCalledWith('notExistInRemote')
		expect(spyRemotePull).toHaveBeenCalledWith('folder/nested/existInBoth_local.txt')

		expect(spyLocalRename).toBeCalledWith('folder/nested/existInBoth.txt', 'folder/nested/existInBoth_local.txt')
		expect(spyLocalPull).toHaveBeenCalledWith('notExistInLocal')
		expect(spyLocalPull).toHaveBeenCalledWith('folder/nested/existInBoth_remote.txt')
	})

	it ('should do a default run correctly', async () => {
		const local: FileSystem = {
			...mockBase(),
			async getLastSavedListing() {
				return {
					'aFile': 33,
					'nested/anotherFile.pdf': 44,
					'nested/quiteNested/oneMoreFile.pdf': 44,
					'anotherRootFile': 10,
					'oneMoreRootFile': 20,
					'olderInBoth': 2
				}
			},
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
			async getLastSavedListing() {
				return {
					'aFile': 33,
					'nested/anotherFile.pdf': 44,
					'nested/quiteNested/oneMoreFile.pdf': 44,
					'anotherRootFile': 10,
					'oneMoreRootFile': 20,
					'olderInBoth': 2
				}
			},
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

		const sync = new Sync(local, remote)

		const spyRemotePull = jest.spyOn(remote, 'pullFile')
		const spyRemoteRename = jest.spyOn(remote, 'renameFile')
		const spyRemoteDelete = jest.spyOn(remote, 'deleteFile')

		const spyLocalPull = jest.spyOn(local, 'pullFile')
		const spyLocalRename = jest.spyOn(local, 'renameFile')
		const spyLocalDelete = jest.spyOn(local, 'deleteFile')

		await sync.run()
		
		expect(spyRemotePull).toBeCalledWith('aFile')
		expect(spyRemoteDelete).toBeCalledWith('nested/anotherFile.pdf')
		expect(spyLocalDelete).toBeCalledWith('nested/quiteNested/oneMoreFile.pdf')
		expect(spyLocalRename).toBeCalledWith('anotherRootFile', 'anotherRootFile_local')
		expect(spyLocalPull).toBeCalledWith('anotherRootFile_remote')
		expect(spyRemoteRename).toBeCalledWith('anotherRootFile', 'anotherRootFile_remote')
		expect(spyRemotePull).toBeCalledWith('anotherRootFile_local')
		expect(spyLocalDelete).not.toBeCalledWith('oneMoreRootFile')
		expect(spyRemoteDelete).not.toBeCalledWith('oneMoreRootFile')
		expect(spyRemotePull).toBeCalledWith('oneNewFileInLocal')
		expect(spyLocalPull).toBeCalledWith('oneNewFileInRemote')
		expect(spyRemoteRename).toBeCalledWith('olderInBoth','olderInBoth_remote')
		expect(spyLocalRename).toBeCalledWith('olderInBoth','olderInBoth_local')
		expect(spyLocalPull).toBeCalledWith('olderInBoth_remote')
		expect(spyRemotePull).toBeCalledWith('olderInBoth_local')
	})

})