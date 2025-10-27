import { Check, WarningCircle } from '@phosphor-icons/react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { getBaseName, getExtension } from '../../utils/path';
import { fileIcon } from '../../assets/icons/getIcon';
import { useI18n } from '../../localize/use-i18n';
import { SyncStateItem } from '@/backend/features/local-sync/sync-state/sync-state.meta';

export function Item({ name, action, progress }: SyncStateItem) {
  const { translate } = useI18n();
  const progressDisplay = progress ? `${Math.ceil(progress * 100)}%` : '';

  let description = '';

  if (action === 'DOWNLOADING') {
    description = translate('widget.body.activity.operation.downloading');
  } else if (action === 'UPLOADING') {
    description = progress ? translate('widget.body.activity.operation.uploading') : translate('widget.body.activity.operation.encrypting');
  } else if (action === 'DOWNLOADED') {
    description = translate('widget.body.activity.operation.downloaded');
  } else if (action === 'DOWNLOAD_CANCEL') {
    description = translate('widget.body.activity.operation.cancel_downloaded');
  } else if (action === 'UPLOADED') {
    description = translate('widget.body.activity.operation.uploaded');
  } else if (action === 'DELETED') {
    description = translate('widget.body.activity.operation.deleted');
  } else if (action === 'MOVED') {
    description = translate('widget.body.activity.operation.moved');
  }

  return (
    <div className="flex h-14 w-full px-3">
      <div className="flex h-full flex-1 items-center space-x-3 truncate border-b border-gray-5">
        <div className="flex h-8 w-8 items-center justify-center drop-shadow-sm">{fileIcon(getExtension(name))}</div>

        <div className="flex flex-1 flex-col justify-center space-y-px truncate pr-[14px]">
          <p className="truncate text-sm text-gray-100" title={getBaseName(name)}>
            {getBaseName(name)}
          </p>
          <p
            className={`truncate text-xs text-gray-50 ${
              action && (action === 'DELETE_ERROR' || action === 'DOWNLOAD_ERROR' || action === 'UPLOAD_ERROR' || action === 'MOVE_ERROR')
                ? 'text-red'
                : undefined
            }`}
            title={
              action && (action === 'DELETE_ERROR' || action === 'DOWNLOAD_ERROR' || action === 'UPLOAD_ERROR' || action === 'MOVE_ERROR')
                ? description
                : undefined
            }>
            {`${description} ${progressDisplay}`}
          </p>
        </div>

        <div className="flex w-7 items-center justify-center">
          {/* PROGRESS */}
          {action && (action === 'UPLOADING' || action === 'DOWNLOADING') && (
            <CircularProgressbar
              value={progress ?? 0}
              minValue={0}
              maxValue={1}
              strokeWidth={16}
              styles={buildStyles({
                pathTransitionDuration: 0.25,
                pathColor: 'rgb(var(--color-primary) / 1)',
                strokeLinecap: 'round',
              })}
              className="aspect-square w-6 rounded-full ring-4 ring-inset ring-primary/15 dark:ring-gray-10"
            />
          )}

          {/* DONE */}
          {action &&
            (action === 'DELETED' ||
              action === 'DOWNLOADED' ||
              action === 'DOWNLOAD_CANCEL' ||
              action === 'UPLOADED' ||
              action === 'MOVED') && <Check size={24} className="text-green" weight="bold" />}

          {/* ERROR */}
          {action && (action === 'DELETE_ERROR' || action === 'DOWNLOAD_ERROR' || action === 'UPLOAD_ERROR' || action === 'MOVE_ERROR') && (
            <WarningCircle size={24} className="text-red" weight="regular" />
          )}
        </div>
      </div>
    </div>
  );
}
