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

})