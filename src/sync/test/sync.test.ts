import Sync, {FileSystem} from "../sync"
import * as _ from 'lodash'

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
					existInBoth: 30
				}
			},
		}

		const remote: FileSystem = {
			...mockBase(),
			async getCurrentListing() {
				return {
					notExistInLocal: 40,
					existInBoth: 30
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
		expect(spyRemotePull).toHaveBeenCalledWith('notExistInRemote')
		expect(spyRemotePull).toHaveBeenCalledWith('existInBoth_local')

		expect(spyLocalRename).toBeCalledWith('existInBoth', 'existInBoth_local')
		expect(spyLocalPull).toHaveBeenCalledWith('notExistInLocal')
		expect(spyLocalPull).toHaveBeenCalledWith('existInBoth_remote')
	})
})