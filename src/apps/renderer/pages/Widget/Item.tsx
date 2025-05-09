import { Check, WarningCircle } from '@phosphor-icons/react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { useTranslationContext } from '../../context/LocalContext';
import { shortMessages } from '../../messages/process-error';
import { getBaseName, getExtension } from '../../utils/path';
import { ProcessInfoUpdatePayload, ProcessErrorName } from '../../../shared/types';
import { fileIcon } from '../../assets/icons/getIcon';

function getDescription({
  action,
  errorName,
  progress,
}: {
  action: string | undefined;
  errorName?: ProcessErrorName;
  progress?: number;
}): string {
  const { translate } = useTranslationContext();

  const actionDescriptions: Record<string, string> = {
    DOWNLOADING: 'widget.body.activity.operation.downloading',
    PREPARING: 'widget.body.activity.operation.preparing',
    UPLOADING: progress ? 'widget.body.activity.operation.uploading' : 'widget.body.activity.operation.encrypting',
    DOWNLOADED: 'widget.body.activity.operation.downloaded',
    DOWNLOAD_CANCEL: 'widget.body.activity.operation.cancel_downloaded',
    UPLOADED: 'widget.body.activity.operation.uploaded',
    DELETING: 'widget.body.activity.operation.deleting',
    DELETED: 'widget.body.activity.operation.deleted',
    RENAMING: 'widget.body.activity.operation.renaming',
    RENAMED: 'widget.body.activity.operation.renamed',
  };

  if (action) {
    return translate(actionDescriptions[action] ?? '');
  }
  if (errorName) {
    return translate(shortMessages[errorName] ?? '');
  }
  return '';
}

export function Item({
  name,
  action,
  progress,
  errorName,
}: ProcessInfoUpdatePayload & {
  progress?: number;
  errorName?: ProcessErrorName;
}) {
  const progressDisplay = progress ? `${Math.ceil(progress * 100)}%` : '';

  const description = getDescription({ action, errorName });

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
              action &&
              (action === 'DELETE_ERROR' ||
                action === 'DOWNLOAD_ERROR' ||
                action === 'UPLOAD_ERROR' ||
                action === 'RENAME_ERROR' ||
                action === 'METADATA_READ_ERROR' ||
                action === 'GENERATE_TREE')
                ? 'text-red'
                : undefined
            }`}
            title={
              action &&
              (action === 'DELETE_ERROR' ||
                action === 'DOWNLOAD_ERROR' ||
                action === 'UPLOAD_ERROR' ||
                action === 'RENAME_ERROR' ||
                action === 'METADATA_READ_ERROR' ||
                action === 'GENERATE_TREE')
                ? description
                : undefined
            }>
            {`${description} ${progressDisplay}`}
          </p>
        </div>

        <div className="flex w-7 items-center justify-center">
          {/* PROGRESS */}
          {action &&
            (action === 'UPLOADING' ||
              action === 'DOWNLOADING' ||
              action === 'PREPARING' ||
              action === 'RENAMING' ||
              action === 'DELETING') && (
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
              action === 'RENAMED') && <Check size={24} className="text-green" weight="bold" />}

          {/* ERROR */}
          {action &&
            (action === 'DELETE_ERROR' ||
              action === 'DOWNLOAD_ERROR' ||
              action === 'UPLOAD_ERROR' ||
              action === 'RENAME_ERROR' ||
              action === 'METADATA_READ_ERROR' ||
              action === 'GENERATE_TREE') && <WarningCircle size={24} className="text-red" weight="regular" />}
        </div>
      </div>
    </div>
  );
}
