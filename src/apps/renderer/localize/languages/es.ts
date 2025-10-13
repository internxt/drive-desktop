import { Translation } from '../i18n.types';

export const es: Translation = {
  settings: {
    general: {
      language: {
        label: 'Idioma',
        options: {
          es: 'Español (Español)',
          en: 'English (Inglés)',
          fr: 'Français (Francés)',
        },
      },
      theme: {
        label: 'Apariencia',
        options: {
          system: 'Sistema',
          light: 'Claro',
          dark: 'Oscuro',
        },
      },
    },
  },
  issues: {
    errors: {
      ABORTED: 'Abortado',
      CREATE_FOLDER_FAILED: 'Error al crear la carpeta',
      DELETE_ERROR: 'No se pudo eliminar el elemento',
      FILE_MODIFIED: 'Archivo modificado durante la subida',
      FILE_SIZE_TOO_BIG: 'Archivo es demasiado grande (máximo 20GB)',
      FOLDER_ACCESS_DENIED: 'La app no tiene permiso para acceder a esta carpeta',
      FOLDER_DOES_NOT_EXIST: 'Carpeta no existe',
      INVALID_WINDOWS_NAME: String.raw`Windows no permite nombres que incluyen los caracteres \ / : * ? " < > |`,
      NETWORK_CONNECTIVITY_ERROR: 'Error de conectividad de red',
      NOT_ENOUGH_SPACE: 'No tienes suficiente espacio para completar la operación',
      PARENT_FOLDER_DOES_NOT_EXIST: 'Carpeta padre no existe',
      ROOT_FOLDER_DOES_NOT_EXIST: 'Carpeta raíz no existe',
      SERVER_INTERNAL_ERROR: 'Error interno del servidor',
      UNKNOWN_DEVICE_NAME: 'No se pudo obtener el nombre de tu dispositivo',
      WEBSOCKET_CONNECTION_ERROR: 'Error de conexión WebSocket',
    },
  },
};
