import async from 'async'
import Logger from '../../../libs/logger'
import watcher from '../watcher'

/*
 * Sync Method: One Way, from LOCAL to CLOUD (Only Upload)
 */

const SYNC_METHOD = 'two-way-sync'
const isSyncing = false
const wtc = null

function SyncLogic(callback) {
  async.waterfall([
    // Start the watcher
    next => {

    }
  ], (err, results) => {
    if (callback) { callback(err, results) }
  })
}

function Monitor() {
  SyncLogic()
}

export default {
  SYNC_METHOD,
  Monitor
}
