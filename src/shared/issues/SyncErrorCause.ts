export type SyncErrorCause =
  // File or folder does not exist
  | 'NOT_EXISTS'

  // No permission to read or write file or folder
  | 'NO_PERMISSION'

  // No internet connection
  | 'NO_INTERNET'

  // Could not connect to Internxt servers
  | 'NO_REMOTE_CONNECTION'

  // Had a bad response (not in the 200 status range) from the server
  | 'BAD_RESPONSE'

  // The file has a size of 0 bytes
  | 'EMPTY_FILE'

  // The file is bigger than the current upload limit
  | 'FILE_TOO_BIG'

  // The file don't have an extension
  | 'FILE_NON_EXTENSION'

  // Unknown error
  | 'UNKNOWN'

  // Duplicated node path
  | 'DUPLICATED_NODE'
  | 'ACTION_NOT_PERMITTED'
  | 'FILE_ALREADY_EXISTS';
