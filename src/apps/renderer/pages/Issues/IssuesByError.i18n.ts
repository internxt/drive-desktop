import { globalI18n } from '../../localize/global.i18n';
import { TLanguage } from '../../localize/language.store';

type Translations =
  | 'ABORTED'
  | 'CREATE_FOLDER_FAILED'
  | 'DELETE_ERROR'
  | 'FILE_SIZE_TOO_BIG'
  | 'FOLDER_ACCESS_DENIED'
  | 'FOLDER_DOES_NOT_EXIST'
  | 'INVALID_WINDOWS_NAME'
  | 'NETWORK_CONNECTIVITY_ERROR'
  | 'NOT_ENOUGH_SPACE'
  | 'PARENT_FOLDER_DOES_NOT_EXIST'
  | 'ROOT_FOLDER_DOES_NOT_EXIST'
  | 'SERVER_INTERNAL_ERROR'
  | 'UNKNOWN_DEVICE_NAME'
  | 'WEBSOCKET_CONNECTION_ERROR';

const translations: Record<TLanguage, Record<Translations, string>> = {
  en: {
    ABORTED: 'Aborted',
    CREATE_FOLDER_FAILED: 'Failed to create folder',
    DELETE_ERROR: 'Cannot delete item',
    FILE_SIZE_TOO_BIG: 'File size too big (max 20GB)',
    FOLDER_ACCESS_DENIED: 'The app does not have permission to access this folder',
    FOLDER_DOES_NOT_EXIST: 'Folder does not exist',
    INVALID_WINDOWS_NAME: 'Windows does not allow names that include the characters \\ / : * ? " < > |',
    NOT_ENOUGH_SPACE: 'You have not enough space to complete the operation',
    PARENT_FOLDER_DOES_NOT_EXIST: 'Parent folder does not exist',
    ROOT_FOLDER_DOES_NOT_EXIST: 'Root folder does not exist',
    UNKNOWN_DEVICE_NAME: "Could not retrieve your device's name",
    WEBSOCKET_CONNECTION_ERROR: 'WebSocket connection error',
    NETWORK_CONNECTIVITY_ERROR: 'Network connectivity error.',
    SERVER_INTERNAL_ERROR: 'Server internal error.',
  },
  es: {
    ABORTED: 'Abortado',
    CREATE_FOLDER_FAILED: 'Error al crear la carpeta',
    DELETE_ERROR: 'No se pudo eliminar el elemento',
    FILE_SIZE_TOO_BIG: 'El archivo es demasiado grande (máximo 20GB)',
    FOLDER_ACCESS_DENIED: 'La app no tiene permiso para acceder a esta carpeta',
    FOLDER_DOES_NOT_EXIST: 'Carpeta no existe',
    INVALID_WINDOWS_NAME: 'Windows no permite nombres que incluyen los caracteres \\ / : * ? " < > |',
    NOT_ENOUGH_SPACE: 'No tienes suficiente espacio para completar la operación',
    PARENT_FOLDER_DOES_NOT_EXIST: 'Carpeta padre no existe',
    ROOT_FOLDER_DOES_NOT_EXIST: 'Carpeta raíz no existe',
    UNKNOWN_DEVICE_NAME: 'No se pudo obtener el nombre de tu dispositivo',
    WEBSOCKET_CONNECTION_ERROR: 'Error de conexión WebSocket',
    NETWORK_CONNECTIVITY_ERROR: 'Error de conectividad de red',
    SERVER_INTERNAL_ERROR: 'Error interno del servidor',
  },
  fr: {
    ABORTED: 'Avorté',
    CREATE_FOLDER_FAILED: 'Erreur lors de la création de la dossier',
    DELETE_ERROR: "Impossible de supprimer l'élément",
    FILE_SIZE_TOO_BIG: 'Le fichier est trop grand (max 20GB)',
    FOLDER_ACCESS_DENIED: "L'app n'a pas le droit d'accéder à cette dossier",
    FOLDER_DOES_NOT_EXIST: 'Dossier non existant',
    INVALID_WINDOWS_NAME: 'Windows ne permet pas les noms contenant les caractères \\ / : * ? " < > |',
    NOT_ENOUGH_SPACE: "Vous n'avez pas assez d'espace pour compléter l'opération",
    PARENT_FOLDER_DOES_NOT_EXIST: 'Dossier parent non existant',
    ROOT_FOLDER_DOES_NOT_EXIST: 'Dossier racine non existant',
    UNKNOWN_DEVICE_NAME: "Impossible d'obtenir le nom de votre appareil",
    WEBSOCKET_CONNECTION_ERROR: 'Erreur de connexion WebSocket',
    NETWORK_CONNECTIVITY_ERROR: 'Erreur de connectivité réseau',
    SERVER_INTERNAL_ERROR: 'Erreur de serveur interne',
  },
};

export const i18n = (key: Translations, ...args: string[]) => globalI18n(translations, key, ...args);
