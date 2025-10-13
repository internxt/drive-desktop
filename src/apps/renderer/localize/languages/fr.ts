import { Translation } from '../i18n.types';

export const fr: Translation = {
  settings: {
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
    },
  },
  issues: {
    errors: {
      ABORTED: 'Avorté',
      CREATE_FOLDER_FAILED: 'Erreur lors de la création de la dossier',
      DELETE_ERROR: "Impossible de supprimer l'élément",
      FILE_MODIFIED: 'Fichier modifié lors du téléchargement',
      FILE_SIZE_TOO_BIG: 'Le fichier est trop grand (max 20GB)',
      FOLDER_ACCESS_DENIED: "L'app n'a pas le droit d'accéder à cette dossier",
      FOLDER_DOES_NOT_EXIST: 'Dossier non existant',
      INVALID_WINDOWS_NAME: 'Windows ne permet pas les noms contenant les caractères \\ / : * ? " < > |',
      NETWORK_CONNECTIVITY_ERROR: 'Erreur de connectivité réseau',
      NOT_ENOUGH_SPACE: "Vous n'avez pas assez d'espace pour compléter l'opération",
      PARENT_FOLDER_DOES_NOT_EXIST: 'Dossier parent non existant',
      ROOT_FOLDER_DOES_NOT_EXIST: 'Dossier racine non existant',
      SERVER_INTERNAL_ERROR: 'Erreur de serveur interne',
      UNKNOWN_DEVICE_NAME: "Impossible d'obtenir le nom de votre appareil",
      WEBSOCKET_CONNECTION_ERROR: 'Erreur de connexion WebSocket',
    },
  },
};
