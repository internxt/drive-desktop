export const en = {
  login: {
    email: {
      section: 'Email address',
    },
    password: {
      section: 'Password',
      placeholder: 'Password',
      forgotten: 'Forgot your password?',
      hide: 'Hide',
      show: 'Show',
    },
    action: {
      login: 'Log in',
      'is-logging-in': 'Logging you in...',
    },
    'create-account': 'Create account',
    '2fa': {
      section: 'Authentication code',
      description: 'You have configured two factor authentication, please enter the 6 digit code',
      'change-account': 'Change account',
      'wrong-code': 'Incorrect code, try again',
    },
    error: {
      'empty-fields': 'Incorrect password or email',
    },
    warning: {
      'no-internet': 'No internet connection',
    },
  },
  onboarding: {
    slides: {
      welcome: {
        title: 'Internxt Desktop',
        description:
          'Welcome to Internxt!\n\nBack up your files with Drive, secure against malware with Antivirus, and optimize performance with Cleaner — all while keeping your privacy protected.',
        'take-tour': 'Take a tour',
      },
      drive: {
        title: 'Drive',
        description:
          'Access all your files from the Internxt Drive folder in your {{platform_app}} sidebar.\n\nChoose to save space with online-only files, or keep essentials available offline — everything stays secure and in sync across your devices.',
      },
      antivirus: {
        title: 'Antivirus',
        description:
          'Protect your device from malware and online threats.\n\nInternxt Antivirus keeps you safe with real-time scans and privacy-first security.',
      },
      backups: {
        title: 'Backup',
        description:
          "With Internxt's upgraded backup feature, you can now safely backup folders on the cloud in order to free up space locally. You can also adjust the backup frequency as you need.",
      },
      cleaner: {
        title: 'Cleaner',
        description:
          'Free up space locally and optimize your device’s performance.\n\nOur cleaner finds and removes unnecessary files, so your device runs smoothly.',
      },
      'onboarding-completed': {
        title: "You're all set, enjoy your privacy!",
        'desktop-ready': {
          title: 'Internxt is ready',
          description: 'Access your stored files from your {{platform_phrase}}’s sidebar',
        },
      },
    },
    common: {
      'onboarding-progress': '{{current_slide}} of {{total_slides}}',
      continue: 'Continue',
      skip: 'Skip',
      'open-drive': 'Open Internxt',
      'platform-phrase': {
        windows: 'file explorer',
      },
      new: 'New',
    },
  },
  widget: {
    header: {
      usage: {
        of: 'of',
        upgrade: 'Upgrade',
      },
      dropdown: {
        new: 'New',
        preferences: 'Preferences',
        sync: 'Sync',
        issues: 'Issues',
        support: 'Support',
        antivirus: 'Antivirus',
        logout: 'Log out',
        quit: 'Quit',
        'logout-confirmation': {
          title: 'Log out from this device?',
          message: 'Internxt Drive will not show up without an account logged in.',
          confirm: 'Log out',
          cancel: 'Cancel',
        },
        cleaner: 'Cleaner',
      },
    },
    body: {
      activity: {
        operation: {
          downloading: 'Downloading',
          preparing: 'Preparing',
          decrypting: 'Decrypting',
          uploading: 'Uploading',
          encrypting: 'Encrypting',
          downloaded: 'Downloaded',
          cancel_downloaded: 'Downloaded Cancel',
          uploaded: 'Uploaded',
          deleting: 'Moving to trash',
          deleted: 'Moved to trash',
          moved: 'Moved',
        },
      },
      'no-activity': {
        title: 'There is no recent activity',
        description: 'Information will show up here when changes are made to sync your local folder with Internxt Drive',
      },
      upToDate: {
        title: 'Your files are up to date',
        subtitle: 'Sync activity will show up here',
      },
    },
    footer: {
      'action-description': {
        syncing: 'Syncing your files',
        updated: 'Fully synced',
        failed: 'Sync failed',
        'sync-pending': 'Sync pending',
      },
      errors: {
        lock: 'Sync locked by other device',
        offline: 'Not connected to the internet',
      },
    },
    'sync-error': {
      title: "Can't get remote content",
      message: 'We are having issues retrieving your content from the cloud, please try again',
      button: 'Try again',
    },
    banners: {
      'discover-backups': {
        title: 'INTERNXT BACKUPS',
        body: 'Keep a lifesaver copy of your most important folders and files.',
        action: 'Backup this device',
      },
    },
  },
  settings: {
    header: {
      section: {
        GENERAL: 'general',
        ACCOUNT: 'account',
        BACKUPS: 'backups',
        ANTIVIRUS: 'Antivirus',
        CLEANER: 'Cleaner',
      },
    },
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

      device: {
        section: 'Device name',
        action: {
          edit: 'Edit',
          cancel: 'Cancel',
          save: 'Save',
        },
      },
      'auto-startup': 'Start Internxt on system startup',
      sync: {
        folder: 'Virtual Drive location',
        changeLocation: 'Change location',
      },
      'app-info': {
        'open-logs': 'Open logs',
        more: 'Learn more about Internxt',
      },
    },
    account: {
      logout: 'Log out',
      usage: {
        display: 'Used {{used}} of {{total}}',
        upgrade: 'Upgrade',
        change: 'Change',
        plan: 'Current plan',
        free: 'Free',
        loadError: {
          title: "Couldn't fetch your usage details",
          action: 'Retry',
        },
        current: {
          used: 'Used',
          of: 'of',
          'in-use': 'in use',
        },
        full: {
          title: 'Your storage is full',
          subtitle: "You can't upload, sync, or backup files. Upgrade now your plan or remove files to save up space.",
        },
      },
    },
    backups: {
      title: 'Backup folders',
      'selected-folder_one': '{{count}} folder',
      'selected-folder_other': '{{count}} folders',
      'add-folders': 'Click + to select the folders\n you want to back up',
      activate: 'Back up your folders and files',
      'view-backups': 'Browse Backups',
      'selected-folders-title': 'Selected folders',
      'select-folders': 'Change folders',
      'last-backup-had-issues': 'Last backup had some issues',
      'see-issues': 'See issues',
      'backing-up': 'Backing up...',
      enable: {
        message: 'Save a copy of your most important files on the cloud automatically',
        action: 'Backup now',
      },
      action: {
        start: 'Backup now',
        stop: 'Stop backup',
        'last-run': 'Last updated',
        download: 'Download',
        stopDownload: 'Stop download',
        downloading: 'Downloading backup',
      },
      frequency: {
        title: 'Upload frequency',
        options: {
          '1h': 'Every hour',
          '6h': 'Every 6 hours',
          '12h': 'Every 12 hours',
          '24h': 'Every day',
          manually: 'Backup manually',
        },
        warning: "Folders won't automatically backup until you click 'Backup now'. This mode is not recommended.",
      },
      folders: {
        'no-folders': 'empty folder, no folder available',
        'no-folders-to-download': 'No folders available for download',
        save: 'Save',
        cancel: 'Cancel',
        error: 'We could not load your backups',
      },
      delete: {
        title: 'Delete backup',
        explanation: 'This backup will be removed from the cloud, all folders and files will remain in this computer',
        action: 'Delete backup',
        'deletion-modal': {
          title: 'Delete backup?',
          explanation: 'This backup will be removed from the cloud permanently, all folders and files will remain in this computer.',
          'explanation-2': 'This action cannot be undone.',
          confirm: 'Yes, delete',
          cancel: 'Cancel',
        },
      },
      stop: {
        modal: {
          title: 'Stop ongoing backup',
          explanation: 'There are still files that have not yet been uploaded. Stop backup anyway?',
          'explanation-2': '',
          confirm: 'Stop backup',
          cancel: 'Cancel',
        },
      },
    },
    antivirus: {
      featureLocked: {
        title: 'Feature locked',
        subtitle: 'Please upgrade your plan to use this feature.',
        action: 'Upgrade',
      },
      errorState: {
        title: 'Something went wrong while scanning the directory',
        button: 'Try again',
      },
      scanOptions: {
        stopScan: 'Stop scan',
        systemScan: {
          text: 'Antivirus system scan',
          action: 'Start scan',
        },
        customScan: {
          text: 'Antivirus custom scan',
          action: 'Choose',
          selector: {
            files: 'Files',
            folders: 'Folders',
          },
        },
        removeMalware: {
          actions: {
            cancel: 'Cancel',
            remove: 'Remove',
          },
          actionRequired: {
            title: 'Action required',
            description:
              'Removing the malware will also permanently delete the folder from your storage to protect your device. This action cannot be undone.',
            confirmToContinue: 'Please confirm to continue.',
          },
          securityWarning: {
            title: 'Security warning',
            description: 'Malware is still present, and your device is at risk.',
            confirmToCancel: 'Are you sure you want to cancel?',
          },
        },
      },
      scanProcess: {
        countingFiles: 'Counting files...',
        scanning: 'Scanning...',
        scannedFiles: 'Scanned files',
        detectedFiles: 'Detected files',
        errorWhileScanning: 'An error occurred while scanning the items. Please try again.',
        noFilesFound: {
          title: 'No threats were found',
          subtitle: 'No further actions are necessary',
        },
        malwareFound: {
          title: 'Malware detected',
          subtitle: 'Please review and remove threats.',
          action: 'Remove malware',
        },
        scanAgain: 'Scan again',
      },
      filesContainingMalwareModal: {
        title: 'Files containing malware',
        selectedItems: 'Selected {{selectedFiles}} out of {{totalFiles}}',
        selectAll: 'Select all',
        actions: {
          cancel: 'Cancel',
          remove: 'Remove',
        },
      },
    },
    cleaner: {
      selectAllCheckbox: 'Select all',
      mainView: {
        cleanup: 'Clean Up',
      },
      generateReportView: {
        title: 'No scan yet',
        description: 'Scan your system to find files you can safely remove and free up space.',
        generateReport: 'Run scan',
      },
      loadingView: {
        title: 'Please wait a moment.',
        description: 'We are generating your report...',
      },
      sizeIndicatorView: {
        selectCategory: 'Select a category to',
        previewContent: 'preview content',
        saveUpTo: 'Save up to',
        ofYourSpace: 'of your space',
      },
      cleanupConfirmDialogView: {
        title: 'Confirm cleanup',
        description:
          'This action will permanently delete the selected files from your device. This cannot be undone. Please, confirm to continue.',
        cancelButton: 'Cancel',
        confirmButton: 'Delete files',
      },
      cleaningView: {
        cleaningProcess: {
          title: 'Cleaning...',
          stopCleanButton: 'Stop clean',
          deletedFiles: 'Deleted files',
          freeSpaceGained: 'Free space gained',
        },
        cleaningFinished: {
          title: 'Your device is clean',
          subtitle: 'No further actions are necessary',
          finish: 'Finish',
        },
      },
    },
  },
  issues: {
    title: 'Issues',
    tabs: {
      sync: 'Sync',
      backups: 'Backups',
      antivirus: 'Antivirus',
      general: 'General',
    },
    'no-issues': 'No issues found',
    actions: {
      'select-folder': 'Select folder',
      'find-folder': 'Find folder',
      'try-again': 'Try again',
    },
    'report-modal': {
      actions: {
        close: 'Close',
        cancel: 'Cancel',
        report: 'Report',
        send: 'Send',
      },
      'help-url': 'To get help visit',
      report: 'You can also send a report about this error.',
      'user-comments': 'Comments',
      'include-logs': 'Include the logs of this sync process for debug purposes',
    },
    errors: {
      ABORTED: 'Aborted',
      CANNOT_REGISTER_VIRTUAL_DRIVE: 'Cannot register virtual drive',
      CREATE_FOLDER_FAILED: 'Failed to create folder',
      DELETE_ERROR: 'Cannot delete item',
      FILE_MODIFIED: 'File modified while uploading',
      FILE_SIZE_TOO_BIG: 'File size too big (max 40GB)',
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
  common: {
    cancel: 'Cancel',
  },
};
