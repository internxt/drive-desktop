export const en = {
  settings: {
    general: {
      language: {
        label: 'Language',
        options: {
          es: 'Español (Spanish)',
          en: 'English (English)',
          fr: 'Français (French)',
        },
      },
      theme: {
        label: 'Appearance',
        options: {
          system: 'System',
          light: 'Light',
          dark: 'Dark',
        },
      },
    },
  },
  issues: {
    errors: {
      ABORTED: 'Aborted',
      CREATE_FOLDER_FAILED: 'Failed to create folder',
      DELETE_ERROR: 'Cannot delete item',
      FILE_MODIFIED: 'File modified while uploading',
      FILE_SIZE_TOO_BIG: 'File size too big (max 20GB)',
      FOLDER_ACCESS_DENIED: 'The app does not have permission to access this folder',
      FOLDER_DOES_NOT_EXIST: 'Folder does not exist',
      INVALID_WINDOWS_NAME: String.raw`Windows does not allow names that include the characters \ / : * ? " < > |`,
      NETWORK_CONNECTIVITY_ERROR: 'Network connectivity error.',
      NOT_ENOUGH_SPACE: 'You have not enough space to complete the operation',
      PARENT_FOLDER_DOES_NOT_EXIST: 'Parent folder does not exist',
      ROOT_FOLDER_DOES_NOT_EXIST: 'Root folder does not exist',
      SERVER_INTERNAL_ERROR: 'Server internal error.',
      UNKNOWN_DEVICE_NAME: "Could not retrieve your device's name",
      WEBSOCKET_CONNECTION_ERROR: 'WebSocket connection error',
    },
  },
};
