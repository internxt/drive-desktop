import { Notification, shell } from 'electron';
import { win32 } from 'node:path';
import { getLanguage } from '@/apps/main/config/language';
import { Language } from '@/apps/main/config/language.types';
import { logger } from '@/apps/shared/logger/logger';
import { iconPath } from '@/apps/utils/icon';

export type RecoverySyncOutcome = {
  status: 'completed' | 'failed' | 'cancelled';
  preserved: number;
  destinations: string[];
};

type Texts = {
  title: Record<RecoverySyncOutcome['status'], string>;
  completed: string;
  failed: string;
  cancelled: string;
  moved: (props: { count: number; folders: string }) => string;
};

// TODO: PB-6496 - Centralize translations in core/shared i18n.
const messages: Record<Language, Texts> = {
  en: {
    title: { completed: 'Recovery sync completed', failed: 'Recovery sync could not finish', cancelled: 'Recovery sync was cancelled' },
    completed: 'Your Internxt Drive folder matches your cloud storage, no files had to be moved.',
    failed: 'Some items could not be recovered, check the sync issues in the app.',
    cancelled: 'Recovery sync stopped before finishing.',
    moved: ({ count, folders }) =>
      `We moved ${count} items that are no longer in your cloud storage, or are in its trash, to ${folders}. Your files are safe there. To upload them again, move them back into your Internxt Drive folder.`,
  },
  es: {
    title: { completed: 'Recuperación completada', failed: 'La recuperación no pudo terminar', cancelled: 'La recuperación se canceló' },
    completed: 'Tu carpeta de Internxt Drive coincide con tu almacenamiento en la nube, no hubo que mover archivos.',
    failed: 'Algunos elementos no se pudieron recuperar, revisa los problemas de sincronización en la aplicación.',
    cancelled: 'La recuperación se detuvo antes de terminar.',
    moved: ({ count, folders }) =>
      `Hemos movido ${count} elementos que ya no están en tu almacenamiento en la nube, o están en su papelera, a ${folders}. Tus archivos están seguros allí. Para subirlos de nuevo, muévelos otra vez a tu carpeta de Internxt Drive.`,
  },
  fr: {
    title: {
      completed: 'Récupération terminée',
      failed: 'La récupération n’a pas pu se terminer',
      cancelled: 'La récupération a été annulée',
    },
    completed: 'Votre dossier Internxt Drive correspond à votre stockage cloud, aucun fichier n’a dû être déplacé.',
    failed: 'Certains éléments n’ont pas pu être récupérés, consultez les problèmes de synchronisation dans l’application.',
    cancelled: 'La récupération s’est arrêtée avant de se terminer.',
    moved: ({ count, folders }) =>
      `Nous avons déplacé ${count} éléments qui ne sont plus dans votre stockage cloud, ou sont dans sa corbeille, vers ${folders}. Vos fichiers y sont en sécurité. Pour les téléverser à nouveau, replacez-les dans votre dossier Internxt Drive.`,
  },
  de: {
    title: {
      completed: 'Wiederherstellung abgeschlossen',
      failed: 'Wiederherstellung konnte nicht abgeschlossen werden',
      cancelled: 'Wiederherstellung abgebrochen',
    },
    completed: 'Dein Internxt Drive-Ordner stimmt mit deinem Cloud-Speicher überein, es mussten keine Dateien verschoben werden.',
    failed: 'Einige Elemente konnten nicht wiederhergestellt werden, prüfe die Synchronisierungsprobleme in der App.',
    cancelled: 'Die Wiederherstellung wurde vor dem Ende gestoppt.',
    moved: ({ count, folders }) =>
      `Wir haben ${count} Elemente, die nicht mehr in deinem Cloud-Speicher oder in dessen Papierkorb sind, nach ${folders} verschoben. Deine Dateien sind dort sicher. Um sie erneut hochzuladen, verschiebe sie zurück in deinen Internxt Drive-Ordner.`,
  },
};

export function getRecoverySyncNotificationText({ status, preserved, destinations }: RecoverySyncOutcome) {
  const texts = messages[getLanguage()];
  const folders = destinations.map((path) => win32.normalize(path)).join(', ');
  const moved = preserved > 0 ? texts.moved({ count: preserved, folders }) : '';

  if (status === 'completed') return { title: texts.title.completed, body: moved || texts.completed };
  return { title: texts.title[status], body: [texts[status], moved].filter(Boolean).join(' ') };
}

/**
 * v2.7.2 Alexis Mora
 * Shown once per manual run, after every context finished, so the user gets one outcome for the whole run.
 * Clicking it opens the first recovery folder; the body names every folder so it is still useful if the click does nothing.
 */
export function showRecoverySyncNotification(outcome: RecoverySyncOutcome) {
  const { title, body } = getRecoverySyncNotificationText(outcome);
  const notification = new Notification({ title, body, icon: iconPath });
  const [destination] = outcome.destinations;

  if (destination) {
    notification.on('click', () => {
      void shell.openPath(win32.normalize(destination));
    });
  }

  notification.on('failed', (error) => {
    logger.error({ tag: 'RECOVERY-SYNC', msg: 'Recovery sync notification failed', title, error });
  });

  notification.show();
}
