export const de = {
  login: {
    signInBrowser: 'Im Browser anmelden',
    createAccount: 'Konto erstellen',
    welcome: 'Willkommen bei Internxt',
    noAccount: 'Sie haben noch kein Konto?',
  },
  onboarding: {
    slides: {
      welcome: {
        title: 'Internxt Desktop',
        description:
          'Willkommen bei Internxt!\n\nSichern Sie Ihre Dateien mit Drive, schützen Sie sich vor Malware mit Antivirus und optimieren Sie die Leistung mit Cleaner – und das alles bei gewahrtem Datenschutz.',
        'take-tour': 'Tour machen',
      },
      drive: {
        title: 'Drive',
        description:
          'Greifen Sie auf alle Ihre Dateien über den Internxt Drive-Ordner in Ihrer {{platform_app}}-Seitenleiste zu.\n\nWählen Sie, ob Sie Platz sparen möchten mit reinen Online-Dateien, oder halten Sie Wichtiges offline verfügbar – alles bleibt sicher und auf Ihren Geräten synchronisiert.',
      },
      antivirus: {
        title: 'Antivirus',
        description:
          'Schützen Sie Ihr Gerät vor Malware und Online-Bedrohungen.\n\nInternxt Antivirus schützt Sie mit Echtzeit-Scans und Privacy-First-Sicherheit.',
      },
      backups: {
        title: 'Backup',
        description:
          'Mit der verbesserten Backup-Funktion von Internxt können Sie jetzt Ordner sicher in der Cloud sichern, um lokal Platz freizugeben. Sie können auch die Backup-Häufigkeit nach Bedarf anpassen.',
      },
      cleaner: {
        title: 'Cleaner',
        description:
          'Geben Sie lokal Platz frei und optimieren Sie die Leistung Ihres Geräts.\n\nUnser Cleaner findet und entfernt unnötige Dateien, damit Ihr Gerät reibungslos läuft.',
      },
      'onboarding-completed': {
        title: 'Alles bereit, genießen Sie Ihre Privatsphäre!',
        'desktop-ready': {
          title: 'Internxt ist bereit',
          description: 'Greifen Sie auf Ihre gespeicherten Dateien über die Seitenleiste Ihres {{platform_phrase}} zu',
        },
      },
    },
    common: {
      'onboarding-progress': '{{current_slide}} von {{total_slides}}',
      continue: 'Weiter',
      skip: 'Überspringen',
      'open-drive': 'Internxt öffnen',
      'platform-phrase': {
        windows: 'Datei-Explorer',
      },
      new: 'Neu',
    },
  },
  widget: {
    header: {
      usage: {
        of: 'von',
        upgrade: 'Upgrade',
      },
      dropdown: {
        new: 'Neu',
        preferences: 'Einstellungen',
        sync: 'Synchronisierung',
        issues: 'Probleme',
        support: 'Support',
        antivirus: 'Antivirus',
        logout: 'Abmelden',
        quit: 'Beenden',
        'logout-confirmation': {
          title: 'Von diesem Gerät abmelden?',
          message: 'Internxt Drive wird ohne angemeldetes Konto nicht angezeigt.',
          confirm: 'Abmelden',
          cancel: 'Abbrechen',
        },
        cleaner: 'Cleaner',
      },
    },
    body: {
      activity: {
        operation: {
          DELETE_ERROR: 'Fehler beim Löschen',
          DELETED: 'In den Papierkorb verschoben',
          DOWNLOAD_CANCEL: 'Download abgebrochen',
          DOWNLOAD_ERROR: 'Download-Fehler',
          DOWNLOADED: 'Heruntergeladen',
          DOWNLOADING: 'Wird heruntergeladen',
          MODIFIED: 'Geändert',
          MODIFY_ERROR: 'Fehler beim Ändern',
          MOVE_ERROR: 'Fehler beim Verschieben',
          MOVED: 'Verschoben',
          RENAME_ERROR: 'Fehler beim Umbenennen',
          RENAMED: 'Umbenannt',
          UPLOAD_ERROR: 'Upload-Fehler',
          UPLOADED: 'Hochgeladen',
          UPLOADING: 'Wird hochgeladen',
        },
      },
      upToDate: {
        title: 'Ihre Dateien sind auf dem neuesten Stand',
        subtitle: 'Synchronisierungsaktivitäten werden hier angezeigt',
      },
    },
    footer: {
      'action-description': {
        syncing: 'Dateien werden synchronisiert',
        updated: 'Vollständig synchronisiert',
        failed: 'Synchronisierung fehlgeschlagen',
        'sync-pending': 'Synchronisierung ausstehend',
      },
      errors: {
        lock: 'Synchronisierung durch ein anderes Gerät gesperrt',
        offline: 'Keine Verbindung zum Internet',
      },
    },
    'sync-error': {
      title: 'Remote-Inhalt konnte nicht abgerufen werden',
      message: 'Wir haben Probleme beim Abrufen Ihrer Inhalte aus der Cloud. Bitte versuchen Sie es erneut.',
      button: 'Erneut versuchen',
    },
    banners: {
      'discover-backups': {
        title: 'INTERNXT BACKUPS',
        body: 'Behalten Sie eine lebensrettende Kopie Ihrer wichtigsten Ordner und Dateien.',
        action: 'Dieses Gerät sichern',
      },
    },
  },
  settings: {
    header: {
      section: {
        GENERAL: 'Allgemein',
        ACCOUNT: 'Konto',
        BACKUPS: 'Backups',
        ANTIVIRUS: 'Antivirus',
        CLEANER: 'Cleaner',
      },
    },
    general: {
      language: {
        label: 'Sprache',
        options: {
          es: 'Español (Spanisch)',
          en: 'English (Englisch)',
          fr: 'Français (Französisch)',
          de: 'Deutsch (Deutsch)',
        },
      },
      theme: {
        label: 'Erscheinungsbild',
        options: {
          system: 'System',
          light: 'Hell',
          dark: 'Dunkel',
        },
      },
      device: {
        section: 'Gerätename',
        action: {
          edit: 'Bearbeiten',
          cancel: 'Abbrechen',
          save: 'Speichern',
        },
      },
      'auto-startup': 'Internxt beim Systemstart starten',
      sync: {
        folder: 'Speicherort des virtuellen Laufwerks',
        changeLocation: 'Speicherort ändern',
      },
      'app-info': {
        'open-logs': 'Logs öffnen',
        more: 'Erfahren Sie mehr über Internxt',
      },
    },
    account: {
      logout: 'Abmelden',
      usage: {
        display: '{{used}} von {{total}} verwendet',
        upgrade: 'Upgrade',
        change: 'Ändern',
        plan: 'Aktueller Plan',
        free: 'Kostenlos',
        loadError: {
          title: 'Ihre Nutzungsdaten konnten nicht geladen werden',
          action: 'Wiederholen',
        },
        current: {
          used: 'Verwendet',
          of: 'von',
          'in-use': 'in Verwendung',
        },
        full: {
          title: 'Ihr Speicher ist voll',
          subtitle:
            'Sie können keine Dateien hochladen, synchronisieren oder sichern. Erweitern Sie jetzt Ihren Plan oder löschen Sie Dateien, um Platz zu sparen.',
        },
      },
    },
    backups: {
      title: 'Backup-Ordner',
      'selected-folder_one': '{{count}} Ordner',
      'selected-folder_other': '{{count}} Ordner',
      'add-folders': 'Klicken Sie auf +, um die Ordner auszuwählen,\n die Sie sichern möchten',
      activate: 'Sichern Sie Ihre Ordner und Dateien',
      'view-backups': 'Backups durchsuchen',
      'selected-folders-title': 'Ausgewählte Ordner',
      'select-folders': 'Ordner ändern',
      'last-backup-had-issues': 'Das letzte Backup hatte einige Probleme',
      'see-issues': 'Probleme ansehen',
      'backing-up': 'Sicherung läuft...',
      enable: {
        message: 'Speichern Sie automatisch eine Kopie Ihrer wichtigsten Dateien in der Cloud',
        action: 'Jetzt sichern',
      },
      action: {
        start: 'Jetzt sichern',
        stop: 'Sicherung stoppen',
        'last-run': 'Zuletzt aktualisiert',
        download: 'Herunterladen',
        stopDownload: 'Download stoppen',
        downloading: 'Backup wird heruntergeladen',
      },
      frequency: {
        title: 'Upload-Häufigkeit',
        options: {
          '1h': 'Jede Stunde',
          '6h': 'Alle 6 Stunden',
          '12h': 'Alle 12 Stunden',
          '24h': 'Jeden Tag',
          manually: 'Manuell sichern',
        },
        warning: 'Ordner werden erst automatisch gesichert, wenn Sie auf „Jetzt sichern“ klicken. Dieser Modus wird nicht empfohlen.',
      },
      folders: {
        'no-folders': 'leerer Ordner, kein Ordner verfügbar',
        'no-folders-to-download': 'Keine Ordner zum Download verfügbar',
        save: 'Speichern',
        cancel: 'Abbrechen',
        error: 'Wir konnten Ihre Backups nicht laden',
      },
      delete: {
        title: 'Backup löschen',
        explanation: 'Dieses Backup wird aus der Cloud entfernt, alle Ordner und Dateien bleiben auf diesem Computer erhalten',
        action: 'Backup löschen',
        'deletion-modal': {
          title: 'Backup löschen?',
          explanation: 'Dieses Backup wird dauerhaft aus der Cloud entfernt, alle Ordner und Dateien bleiben auf diesem Computer erhalten.',
          'explanation-2': 'Diese Aktion kann nicht rückgängig gemacht werden.',
          confirm: 'Ja, löschen',
          cancel: 'Abbrechen',
        },
      },
      stop: {
        modal: {
          title: 'Laufende Sicherung stoppen',
          explanation: 'Es gibt noch Dateien, die noch nicht hochgeladen wurden. Sicherung trotzdem stoppen?',
          'explanation-2': '',
          confirm: 'Sicherung stoppen',
          cancel: 'Abbrechen',
        },
      },
    },
    antivirus: {
      featureLocked: {
        title: 'Funktion gesperrt',
        subtitle: 'Bitte aktualisieren Sie Ihren Plan, um diese Funktion zu nutzen.',
        action: 'Upgrade',
      },
      errorState: {
        title: 'Beim Scannen des Verzeichnisses ist etwas schiefgelaufen',
        button: 'Erneut versuchen',
      },
      scanOptions: {
        stopScan: 'Scan stoppen',
        systemScan: {
          text: 'Antivirus-Systemscan',
          action: 'Scan starten',
        },
        customScan: {
          text: 'Benutzerdefinierter Antivirus-Scan',
          action: 'Wählen',
          selector: {
            files: 'Dateien',
            folders: 'Ordner',
          },
        },
        removeMalware: {
          actions: {
            cancel: 'Abbrechen',
            remove: 'Entfernen',
          },
          actionRequired: {
            title: 'Aktion erforderlich',
            description:
              'Durch das Entfernen der Malware wird auch der Ordner dauerhaft aus Ihrem Speicher gelöscht, um Ihr Gerät zu schützen. Diese Aktion kann nicht rückgängig gemacht werden.',
            confirmToContinue: 'Bitte bestätigen, um fortzufahren.',
          },
          securityWarning: {
            title: 'Sicherheitswarnung',
            description: 'Malware ist immer noch vorhanden, und Ihr Gerät ist gefährdet.',
            confirmToCancel: 'Sind Sie sicher, dass Sie abbrechen möchten?',
          },
        },
      },
      scanProcess: {
        countingFiles: 'Dateien werden gezählt...',
        scanning: 'Scannen...',
        scannedFiles: 'Gescannte Dateien',
        detectedFiles: 'Erkannte Dateien',
        errorWhileScanning: 'Beim Scannen der Elemente ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
        noFilesFound: {
          title: 'Keine Bedrohungen gefunden',
          subtitle: 'Keine weiteren Maßnahmen erforderlich',
        },
        malwareFound: {
          title: 'Malware erkannt',
          subtitle: 'Bitte überprüfen und entfernen Sie Bedrohungen.',
          action: 'Malware entfernen',
        },
        scanAgain: 'Erneut scannen',
      },
      filesContainingMalwareModal: {
        title: 'Dateien, die Malware enthalten',
        selectedItems: '{{selectedFiles}} von {{totalFiles}} ausgewählt',
        selectAll: 'Alle auswählen',
        actions: {
          cancel: 'Abbrechen',
          remove: 'Entfernen',
        },
      },
    },
    cleaner: {
      selectAllCheckbox: 'Alle auswählen',
      mainView: {
        cleanup: 'Bereinigen',
      },
      generateReportView: {
        title: 'Noch kein Scan',
        description: 'Scannen Sie Ihr System, um Dateien zu finden, die Sie sicher entfernen können, um Platz freizugeben.',
        generateReport: 'Scan ausführen',
      },
      loadingView: {
        title: 'Bitte warten Sie einen Moment.',
        description: 'Ihr Bericht wird erstellt...',
      },
      sizeIndicatorView: {
        selectCategory: 'Kategorie auswählen, um',
        previewContent: 'Inhalt anzuzeigen',
        saveUpTo: 'Sparen Sie bis zu',
        ofYourSpace: 'Ihres Speicherplatzes',
      },
      cleanupConfirmDialogView: {
        title: 'Bereinigung bestätigen',
        description:
          'Diese Aktion wird die ausgewählten Dateien dauerhaft von Ihrem Gerät löschen. Dies kann nicht rückgängig gemacht werden. Bitte bestätigen, um fortzufahren.',
        cancelButton: 'Abbrechen',
        confirmButton: 'Dateien löschen',
      },
      cleaningView: {
        cleaningProcess: {
          title: 'Bereinigung läuft...',
          stopCleanButton: 'Bereinigung stoppen',
          deletedFiles: 'Gelöschte Dateien',
          freeSpaceGained: 'Gewonnener Speicherplatz',
        },
        cleaningFinished: {
          title: 'Ihr Gerät ist sauber',
          subtitle: 'Keine weiteren Maßnahmen erforderlich',
          finish: 'Fertig',
        },
      },
    },
  },
  issues: {
    title: 'Probleme',
    tabs: {
      sync: 'Synchronisierung',
      backups: 'Backups',
      general: 'Allgemein',
    },
    'no-issues': 'Keine Probleme gefunden',
    actions: {
      'find-folder': 'Ordner finden',
    },
    errors: {
      CANNOT_REGISTER_VIRTUAL_DRIVE: 'Virtuelles Laufwerk kann nicht registriert werden',
      FILE_SIZE_TOO_BIG: 'Datei zu groß (max. 40 GB)',
      FOLDER_ACCESS_DENIED: 'Die App hat keine Berechtigung, auf diesen Ordner zuzugreifen',
      INVALID_WINDOWS_NAME: String.raw`Windows erlaubt keine Namen, die \ / : * ? " < > | enthalten oder mit Leerzeichen beginnen/enden`,
      NETWORK_CONNECTIVITY_ERROR: 'Netzwerkverbindungsfehler.',
      NOT_ENOUGH_SPACE: 'Sie haben nicht genügend Platz, um den Vorgang abzuschließen',
      SERVER_INTERNAL_ERROR: 'Interner Serverfehler.',
      WEBSOCKET_CONNECTION_ERROR: 'WebSocket-Verbindungsfehler',
    },
  },
  common: {
    cancel: 'Abbrechen',
  },
};
