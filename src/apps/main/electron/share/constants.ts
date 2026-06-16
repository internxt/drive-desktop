import { Language } from '../../config/language.types';

export const CONTEXT_MENU_PIPE_PATH = String.raw`\\.\pipe\internxt-drive-context-menu`;

/** Windows paths are far smaller in normal use. This limit also prevents an
 * unrelated local process from making the main process buffer arbitrary data.
 */
export const MAX_MESSAGE_BYTES = 64 * 1024;

export const NOTIFICATION_TITLE = 'Internxt Drive';

// TODO: PB-6496 - Centralize translations in core/shared i18n.
export const messages: Record<Language, Record<'success' | 'error', string>> = {
  en: {
    success: 'Link copied to clipboard',
    error: 'Error sharing item, try again later.',
  },
  es: {
    success: 'Enlace copiado al portapapeles',
    error: 'Error al compartir el elemento. Inténtalo de nuevo más tarde.',
  },
  fr: {
    success: 'Lien copié dans le presse-papiers',
    error: 'Erreur lors du partage de l’élément. Réessayez plus tard.',
  },
  de: {
    success: 'Link in die Zwischenablage kopiert',
    error: 'Fehler beim Teilen des Elements. Versuche es später erneut.',
  },
};
