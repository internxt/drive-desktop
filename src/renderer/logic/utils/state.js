// define states
var state = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  SYNCED: 'synced',
  DELETE_CLOUD: 'deleteCloud',
  DELETE_LOCAL: 'deleteLocal',
  IGNORELOCALNOTEXISTS: 'ignorelocalnotexists',
  IGNORECLOUDNOTEXISTS: 'ignorecloudnotexists',
  DELETEIGNORE: 'deleteignore'
}
// define words
var word = {
  localDeleted: 'local deleted',
  uploadAndReplace: 'upload and replace',
  downloadAndReplace: 'download and replace',
  ensure: 'ensure',
  cloudDeleted: 'cloud deleted'
}
// define transitions
var upload = []
upload[word.localDeleted] = state.DELETE_CLOUD
upload[word.downloadAndReplace] = state.DOWNLOAD
var download = []
download[word.cloudDeleted] = state.DELETE_LOCAL
download[word.uploadAndReplace] = state.UPLOAD
var deleteCloud = []
deleteCloud[word.ensure] = state.UPLOAD
deleteCloud[word.uploadAndReplace] = state.UPLOAD
deleteCloud[word.downloadAndReplace] = state.DOWNLOAD
var deleteLocal = []
deleteLocal[word.ensure] = state.DOWNLOAD
deleteLocal[word.uploadAndReplace] = state.UPLOAD
deleteLocal[word.downloadAndReplace] = state.DOWNLOAD
var synced = []
synced[word.uploadAndReplace] = state.UPLOAD
synced[word.downloadAndReplace] = state.DOWNLOAD
synced[word.localDeleted] = state.DELETE_CLOUD
synced[word.cloudDeleted] = state.DELETE_LOCAL
var ignoreLocalNotExists = []
ignoreLocalNotExists[word.cloudDeleted] = state.DELETEIGNORE
var ignoreCloudNotExists = []
ignoreCloudNotExists[word.localDeleted] = state.DELETEIGNORE
var deleteIgnore = []
deleteIgnore[word.downloadAndReplace] = state.IGNORELOCALNOTEXISTS
deleteIgnore[word.uploadAndReplace] = state.IGNORECLOUDNOTEXISTS
// define machine
var machine = []
machine[state.UPLOAD] = upload
machine[state.DOWNLOAD] = download
machine[state.SYNCED] = synced
machine[state.DELETE_LOCAL] = deleteLocal
machine[state.DELETE_CLOUD] = deleteCloud
machine[state.IGNORELOCALNOTEXISTS] = ignoreLocalNotExists
machine[state.IGNORECLOUDNOTEXISTS] = ignoreCloudNotExists
machine[state.DELETEIGNORE] = deleteIgnore

const ignoredState = [state.IGNORELOCALNOTEXISTS, state.IGNORECLOUDNOTEXISTS]

function transition(state, word) {
  return machine[state][word] ? machine[state][word] : state
}
export default { state, word, transition, ignoredState }
