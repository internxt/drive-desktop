import Sync, {FileSystem} from "../sync"

describe('sync tests', () => {
	
	it ('should do resync correctly', async () => {
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

		const local: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					notExistInRemote: 40,
					existInBoth: 30,
					'folder/nested/existInBoth.txt': 44
				}
			},
		}

		const remote: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					notExistInLocal: 40,
					existInBoth: 30,
					'folder/nested/existInBoth.txt': 44
				}
			},
		}

		const sync = new Sync(local, remote)

		const spyRemotePull = jest.spyOn(remote, 'pullFile')
		const spyRemoteRename = jest.spyOn(remote, 'renameFile')

		const spyLocalPull = jest.spyOn(local, 'pullFile')
		const spyLocalRename = jest.spyOn(local, 'renameFile')

		await sync.run()
		
		expect(spyRemoteRename).toBeCalledWith('existInBoth', 'existInBoth_remote')
		expect(spyRemoteRename).toBeCalledWith('folder/nested/existInBoth.txt', 'folder/nested/existInBoth_remote.txt')
		expect(spyRemotePull).toHaveBeenCalledWith('notExistInRemote')
		expect(spyRemotePull).toHaveBeenCalledWith('existInBoth_local')
		expect(spyRemotePull).toHaveBeenCalledWith('folder/nested/existInBoth_local.txt')

		expect(spyLocalRename).toBeCalledWith('existInBoth', 'existInBoth_local')
		expect(spyLocalRename).toBeCalledWith('folder/nested/existInBoth.txt', 'folder/nested/existInBoth_local.txt')
		expect(spyLocalPull).toHaveBeenCalledWith('notExistInLocal')
		expect(spyLocalPull).toHaveBeenCalledWith('existInBoth_remote')
		expect(spyLocalPull).toHaveBeenCalledWith('folder/nested/existInBoth_remote.txt')
	})
})