import getListingStore from '../listing-store'
import { Listing } from '../sync'

describe('Listing store tests', () => {
  const localPath = '/'
  const folderId = 4

  it('should get last saved listing if it exists', () => {
    const exampleListing: Listing = { aFile: 8 }

    const configStore = {
      get() {
        return { [`local:${localPath}--remote:${folderId}`]: exampleListing }
      },
      set() {}
    }

    const listingStore = getListingStore(localPath, folderId, configStore)

    expect(listingStore.getLastSavedListing()).toEqual(exampleListing)
  })

  it('should return null if a listing does not exist', () => {
    const configStore = {
      get() {
        return {}
      },
      set() {}
    }

    const listingStore = getListingStore(localPath, folderId, configStore)

    expect(listingStore.getLastSavedListing()).toBeNull()
  })
})
