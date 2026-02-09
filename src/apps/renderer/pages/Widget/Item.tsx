import { Check } from '@phosphor-icons/react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { useTranslationContext } from '../../context/LocalContext';
import { getBaseName, getExtension } from '../../utils/path';
import { DriveOperationInfo } from '../../../shared/types';
import { fileIcon } from '../../assets/icons/getIcon';

export function Item({ name, action, progress }: DriveOperationInfo) {
  const { translate } = useTranslationContext();
  const hasProgress = progress !== undefined && progress !== null;
  const progressDisplay = hasProgress ? `${Math.ceil(progress * 100)}%` : '';

  let description = '';

  if (action === 'DOWNLOADING') {
    description = hasProgress
      ? translate('widget.body.activity.operation.downloading')
      : translate('widget.body.activity.operation.decrypting');
  } else if (action === 'UPLOADING') {
    description = hasProgress
      ? translate('widget.body.activity.operation.uploading')
      : translate('widget.body.activity.operation.encrypting');
  } else if (action === 'DOWNLOADED') {
    description = translate('widget.body.activity.operation.downloaded');
  } else if (action === 'UPLOADED') {
    description = translate('widget.body.activity.operation.uploaded');
  } else if (action === 'DELETING') {
    description = translate('widget.body.activity.operation.deleting');
  } else if (action === 'DELETED') {
    description = translate('widget.body.activity.operation.deleted');
  } else if (action === 'RENAMING') {
    description = translate('widget.body.activity.operation.renaming');
  } else if (action === 'RENAMED') {
    description = translate('widget.body.activity.operation.renamed');
  }

  return (
    <div className="flex h-14 w-full px-3">
      <div className="flex h-full flex-1 items-center space-x-3 truncate border-b border-gray-5">
        <div className="flex h-8 w-8 items-center justify-center drop-shadow-sm">{fileIcon(getExtension(name))}</div>

        <div className="flex flex-1 flex-col justify-center space-y-px truncate pr-[14px]">
          <p className="truncate text-sm text-gray-100" title={getBaseName(name)}>
            {getBaseName(name)}
          </p>
          <p className={'truncate text-xs text-gray-50'}>{`${description} ${progressDisplay}`}</p>
        </div>

        <div className="flex w-7 items-center justify-center">
          {/* PROGRESS */}
          {action &&
            (action === 'UPLOADING' || action === 'DOWNLOADING' || action === 'RENAMING' || action === 'DELETING') && (
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
            (action === 'DELETED' || action === 'DOWNLOADED' || action === 'UPLOADED' || action === 'RENAMED') && (
              <Check size={24} className="text-green" weight="bold" />
            )}
        </div>
      </div>
    </div>
  );
}
