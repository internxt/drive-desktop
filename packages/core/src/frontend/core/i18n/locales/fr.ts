import { Translation } from '../i18n.types';

export const fr: Translation = {
  login: {
    email: {
      section: 'Adresse électronique',
    },
    password: {
      section: 'Mot de passe',
      placeholder: 'Mot de passe',
      forgotten: 'Vous avez oublié votre mot de passe?',
      hide: 'Cacher',
      show: 'Afficher',
    },
    action: {
      login: "S'identifier",
      'is-logging-in': 'Se connecter...',
    },
    'create-account': 'Créer un compte',
    '2fa': {
      section: "Code d'authentification",
      description: "Vous avez configuré l'authentification en deux étapes (2FA), veuillez saisir le code à 6 chiffres",
      'change-account': 'Changer de compte',
      'wrong-code': 'Code incorrect, veuillez réessayer',
    },
    error: {
      'empty-fields': 'Mot de passe ou courriel incorrect',
    },
    warning: {
      'no-internet': 'Pas de connexion internet',
    },
  },
  onboarding: {
    slides: {
      welcome: {
        title: 'Internxt Desktop',
        description:
          'Bienvenue dans Internxt!\n\nSauvegardez vos fichiers avec Drive, protégez-les contre les logiciels malveillants avec Antivirus et optimisez les performances avec Cleaner — tout en préservant votre vie privée.',
        'take-tour': 'Visite guidée',
      },
      drive: {
        title: 'Drive',
        description:
          'Accédez à tous vos fichiers depuis le dossier Internxt Drive dans la barre latérale de {{platform_app}}.\n\nChoisissez d’économiser de l’espace avec des fichiers disponibles uniquement en ligne, ou gardez l’essentiel accessible hors ligne — tout reste sécurisé et synchronisé sur tous vos appareils.',
      },
      antivirus: {
        title: 'Antivirus',
        description:
          'Protégez votre appareil contre les logiciels malveillants et les menaces en ligne.\n\nInternxt Antivirus vous protège grâce à des analyses en temps réel et une sécurité axée sur la confidentialité.',
      },
      backups: {
        title: 'Backup',
        description:
          'Avec la fonction de sauvegarde améliorée d’Internxt, vous pouvez désormais sauvegarder vos dossiers en toute sécurité sur le cloud afin de libérer de l’espace localement.\n\nVous pouvez également ajuster la fréquence des sauvegardes selon vos besoins.',
      },
      cleaner: {
        title: 'Cleaner',
        description:
          'Libérez de l’espace localement et optimisez les performances de votre appareil.\n\nNotre nettoyeur détecte et supprime les fichiers inutiles afin que votre appareil fonctionne sans encombre.',
      },
      'onboarding-completed': {
        title: 'Vous êtes prêt, profitez de votre vie privée !',
        'desktop-ready': {
          title: 'Internxt est prêt',
          description: 'Accédez à vos fichiers stockés depuis la barre latérale de votre {{platform_phrase}}.',
        },
      },
    },
    common: {
      'onboarding-progress': '{{current_slide}} de {{total_slides}}',
      'open-drive': 'Ouvrir Internxt',
      continue: 'Continuer',
      skip: 'Sauter',
      'platform-phrase': {
        windows: 'navigateur de fichiers',
      },
      new: 'Nouveau',
    },
  },
  widget: {
    header: {
      usage: {
        of: 'de',
        upgrade: 'Acheter maintenant',
      },
      dropdown: {
        new: 'Nouveau',
        preferences: 'Préférences',
        sync: 'Synchroniser',
        issues: "Liste d'erreurs",
        support: 'Aide',
        antivirus: 'Antivirus',
        logout: 'Déconnecter',
        quit: 'Fermer',
        'logout-confirmation': {
          title: 'Se déconnecter de cet appareil?',
          message: "Internxt ne s'affichera pas sans un compte connecté.",
          confirm: 'Se déconnecter',
          cancel: 'Annuler',
        },
        cleaner: 'Cleaner',
      },
    },
    body: {
      activity: {
        operation: {
          downloading: 'Téléchargement',
          preparing: 'Préparation',
          decrypting: 'Décryptage',
          uploading: 'téléchargement',
          encrypting: 'Encryptage',
          downloaded: 'Téléchargé',
          cancel_downloaded: 'Télécharger Annulé',
          uploaded: 'Téléchargé',
          deleting: 'Déplacement vers les poubelles',
          deleted: 'Déplacé vers la poubelle',
          moved: 'Déplacé',
        },
      },
      'no-activity': {
        title: 'Aucune activité récente',
        description:
          'Les informations apparaîtront ici lorsque vous effectuerez des modifications, pour synchroniser votre dossier local avec Internxt',
      },
      upToDate: {
        title: 'Vos fichiers sont à jour',
        subtitle: "L'activité de synchronisation s'affichera ici",
      },
    },
    footer: {
      'action-description': {
        syncing: 'Synchronisation de vos fichiers',
        updated: 'Synchronisation complète',
        failed: 'Échec de la synchronisation',
        'sync-pending': 'Synchronisation en attente',
      },
      errors: {
        lock: 'Synchronisation bloquée par un autre dispositif',
        offline: 'Non connecté à Internet',
      },
    },
    'sync-error': {
      title: "Impossible d'obtenir le contenu à distance",
      message: 'Nous avons des problèmes pour récupérer votre contenu depuis le nuage, veuillez réessayer ',
      button: 'Essayez à nouveau ',
    },
    banners: {
      'discover-backups': {
        title: 'INTERNXT SAUVEGARDES',
        body: 'Gardez une copie de secours de vos dossiers et fichiers les plus importants.',
        action: 'Sauvegarder',
      },
    },
  },
  settings: {
    header: {
      section: {
        GENERAL: 'Général',
        ACCOUNT: 'Compte',
        BACKUPS: 'Sauvegardes',
        ANTIVIRUS: 'Antivirus',
        CLEANER: 'Cleaner',
      },
    },
    general: {
      language: {
        label: 'Langue',
        options: {
          es: 'Español (Espagnole)',
          en: 'English (Anglaise)',
          fr: 'Français (Français)',
        },
      },
      theme: {
        label: 'Apparence',
        options: {
          system: 'Système',
          light: 'Lumière',
          dark: 'Sombre',
        },
      },
      device: {
        section: 'Nom du dispositif',
        action: {
          edit: 'Editer',
          cancel: 'Annuler',
          save: 'Enregistrer',
        },
      },
      'auto-startup': 'Démarrer Internxt au démarrage du système',
      sync: {
        folder: 'Emplacement Drive virtuel',
        changeLocation: "Changer d'emplacement",
      },
      'app-info': {
        'open-logs': 'Ouvrir les registres',
        more: "Plus d'informations sur Internxt",
      },
    },
    account: {
      logout: 'Déconnecter',
      usage: {
        display: 'Utilisé {{used}} sur {{total}}',
        upgrade: 'Acheter',
        change: 'Changement',
        plan: 'Plan actuel',
        free: 'Gratuit',
        loadError: {
          title: "Impossible d'obtenir les détails de votre utilisation",
          action: 'Réessayer',
        },
        current: {
          used: 'utilisés',
          of: 'de',
          'in-use': 'utilisé',
        },
        full: {
          title: 'Votre espace de stockage est plein',
          subtitle:
            "Vous ne pouvez pas télécharger, synchroniser ou sauvegarder des fichiers. Mettez votre forfait à niveau ou supprimez des fichiers pour économiser de l'espace.",
        },
      },
    },
    backups: {
      title: 'Dossiers de sauvegarde',
      'add-folders': 'Cliquez sur + pour sélectionner les dossiers que vous souhaitez sauvegarder',
      'selected-folder_one': '{{count}} dossier',
      'selected-folder_other': '{{count}} dossiers',
      activate: 'Sauvegarder vos dossiers',
      'view-backups': 'Parcourir les backups',
      'selected-folders-title': 'Dossiers sélectionnés',
      'select-folders': 'Changer les dossiers',
      'last-backup-had-issues': 'La dernière sauvegarde a rencontré quelques problèmes',
      'see-issues': 'Voir des problèmes',
      'backing-up': 'Sauvegarde...',
      enable: {
        message: 'Enregistrez automatiquement une copie de vos fichiers les plus importants dans le cloud',
        action: 'Faites une sauvegarde maintenant',
      },
      action: {
        start: 'Faire une copie ',
        stop: 'Arrêter la sauvegarde',
        'last-run': 'Dernière exécution',
        download: 'Télécharger',
        stopDownload: 'Arrêter le téléchargement',
        downloading: 'Téléchargement de la sauvegarde',
      },
      frequency: {
        title: 'Fréquence de téléchargement',
        options: {
          '1h': 'Toutes les heures',
          '6h': 'Toutes les 6 heures',
          '12h': 'Toutes les 12 heures',
          '24h': 'Tous les jours',
          manually: 'Manuellement',
        },
        warning:
          'Les dossiers ne seront pas automatiquement sauvegardés tant que vous n’aurez pas cliqué sur « Sauvegarder maintenant ». Ce mode n’est pas recommandé.',
      },
      folders: {
        'no-folders': 'Pas encore de sauvegardes',
        'no-folders-to-download': 'Pas de dossiers à télécharger',
        save: 'Sauvegarder',
        cancel: 'Annuler',
        error: 'Nous n’avons pas trouvé le dossier sélectionné',
      },
      delete: {
        title: 'Supprimer la sauvegarde',
        explanation: 'Cette sauvegarde sera supprimée du cloud, tous les dossiers et fichiers resteront sur cet ordinateur',
        action: 'Supprimer la sauvegarde',
        'deletion-modal': {
          title: 'Arrêter la sauvegarde de ',
          explanation:
            'Cette sauvegarde sera supprimée définitivement du cloud, tous les dossiers et fichiers resteront sur cet ordinateur.',
          'explanation-2': 'Cette action est irréversible.',
          confirm: 'Oui, supprimer',
          cancel: 'Annuler',
        },
      },
      stop: {
        modal: {
          title: 'Arrêter la sauvegarde en cours',
          explanation: "Il reste encore des fichiers qui n'ont pas été téléchargés. Arrêter la sauvegarde quand même?",
          'explanation-2': '',
          confirm: 'Arrêter la sauvegarde',
          cancel: 'Annuler',
        },
      },
    },
    antivirus: {
      featureLocked: {
        title: 'Fonction verrouillée',
        subtitle: 'Veuillez mettre à niveau votre plan pour utiliser cette fonctionnalité.',
        action: 'Mettre à niveau',
      },
      errorState: {
        title: "Une erreur s'est produite lors de l'analyse du répertoire",
        button: 'Réessayer',
      },
      scanOptions: {
        stopScan: "Arrêter l'analyse",
        systemScan: {
          text: 'Analyse du système antivirus',
          action: "Démarrer l'analyse",
        },
        customScan: {
          text: "Analyse personnalisée de l'antivirus",
          action: 'Choisir',
          selector: {
            files: 'Fichiers',
            folders: 'Dossiers',
          },
        },
        removeMalware: {
          actions: {
            cancel: 'Annuler',
            remove: 'Supprimer',
          },
          actionRequired: {
            title: 'Action requise',
            description:
              'La suppression du logiciel malveillant supprimera également définitivement le dossier de votre espace de stockage afin de protéger votre appareil. Cette action est irréversible.',
            confirmToContinue: 'Veuillez confirmer pour continuer.',
          },
          securityWarning: {
            title: 'Avertissement de sécurité',
            description: 'Le logiciel malveillant est toujours présent et votre appareil est menacé.',
            confirmToCancel: 'Êtes-vous sûr de vouloir annuler?',
          },
        },
      },
      scanProcess: {
        countingFiles: 'Comptage des fichiers...',
        scanning: 'Analyse en cours...',
        scannedFiles: 'Fichiers analysés',
        detectedFiles: 'Fichiers détectés',
        errorWhileScanning: "Une erreur s'est produite lors de l'analyse des éléments. Veuillez réessayer.",
        noFilesFound: {
          title: 'Aucune menace détectée',
          subtitle: 'Aucune action supplémentaire requise',
        },
        malwareFound: {
          title: 'Malware détecté',
          subtitle: 'Veuillez examiner et supprimer les menaces.',
          action: 'Supprimer le malware',
        },
        scanAgain: 'Analyser à nouveau',
      },
      filesContainingMalwareModal: {
        title: 'Fichiers contenant des malwares',
        selectedItems: 'Sélectionné {{selectedFiles}} sur {{totalFiles}}',
        selectAll: 'Tout sélectionner',
        actions: {
          cancel: 'Annuler',
          remove: 'Supprimer',
        },
      },
    },
    cleaner: {
      selectAllCheckbox: 'Tout sélectionner',
      mainView: {
        cleanup: 'Nettoyer',
      },
      generateReportView: {
        title: 'Pas encore de scans',
        description:
          "Analysez votre système pour trouver les fichiers que vous pouvez supprimer en toute sécurité pour libérer de l'espace.",
        generateReport: "Exécuter l'analyse",
      },
      loadingView: {
        title: 'Attendez un instant.',
        description: 'Nous générons votre rapport...',
      },
      sizeIndicatorView: {
        selectCategory: 'Sélectionnez une catégorie pour',
        previewContent: 'aperçu du contenu',
        saveUpTo: "Économisez jusqu'à",
        ofYourSpace: 'de votre espace',
      },
      cleanupConfirmDialogView: {
        title: 'Confirmer le nettoyage',
        description:
          'Cette action supprimera définitivement les fichiers sélectionnés de votre appareil. Cette action ne peut pas être annulée. Veuillez confirmer pour continuer.',
        cancelButton: 'Annuler',
        confirmButton: 'Supprimer les fichiers ',
      },
      cleaningView: {
        cleaningProcess: {
          title: 'Nettoyage...',
          stopCleanButton: 'Arrêter le nettoyage',
          deletedFiles: 'Fichiers supprimés',
          freeSpaceGained: 'Espace libre gagné',
        },
        cleaningFinished: {
          title: 'Votre appareil est propre',
          subtitle: "Aucune autre action n'est nécessaire",
          finish: 'Terminer',
        },
      },
    },
  },
  issues: {
    title: "Liste d'erreurs",
    tabs: {
      sync: 'Synchronisation',
      backups: 'Sauvegardes',
      general: 'Général',
      antivirus: 'Antivirus',
    },
    'no-issues': 'Aucune erreur trouvée',
    actions: {
      'select-folder': 'Sélectionner un dossier',
      'find-folder': 'Trouver un dossier',
      'try-again': 'Essayer à nouveau',
    },
    'report-modal': {
      actions: {
        close: 'Fermer',
        cancel: 'Annuler',
        report: 'Rapport',
        send: 'Envoyer',
      },
      'help-url': "Pour obtenir de l'aide, visitez",
      report: 'Vous pouvez également envoyer un rapport sur cette erreur',
      'user-comments': 'Commentaires',
      'include-logs': 'Inclure les logs de ce processus de synchronisation à des fins de diagnostic',
    },
    errors: {
      ABORTED: 'Avorté',
      CANNOT_REGISTER_VIRTUAL_DRIVE: 'Le lecteur virtuel ne peut pas être enregistré',
      CREATE_FOLDER_FAILED: 'Erreur lors de la création de la dossier',
      DELETE_ERROR: "Impossible de supprimer l'élément",
      FILE_MODIFIED: 'Fichier modifié lors du téléchargement',
      FILE_SIZE_TOO_BIG: 'Le fichier est trop grand (max 40GB)',
      FOLDER_ACCESS_DENIED: "L'app n'a pas le droit d'accéder à cette dossier",
      FOLDER_DOES_NOT_EXIST: 'Dossier non existant',
      INVALID_WINDOWS_NAME: String.raw`Windows ne permet pas les noms contenant les caractères \ / : * ? " < > |`,
      NETWORK_CONNECTIVITY_ERROR: 'Erreur de connectivité réseau',
      NOT_ENOUGH_SPACE: "Vous n'avez pas assez d'espace pour compléter l'opération",
      PARENT_FOLDER_DOES_NOT_EXIST: 'Dossier parent non existant',
      ROOT_FOLDER_DOES_NOT_EXIST: 'Dossier racine non existant',
      SERVER_INTERNAL_ERROR: 'Erreur de serveur interne',
      UNKNOWN_DEVICE_NAME: "Impossible d'obtenir le nom de votre appareil",
      WEBSOCKET_CONNECTION_ERROR: 'Erreur de connexion WebSocket',
    },
  },
  common: {
    cancel: 'Annuler',
  },
};
