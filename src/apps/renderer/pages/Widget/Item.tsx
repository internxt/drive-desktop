import { Check, WarningCircle } from '@phosphor-icons/react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { getBaseName, getExtension } from '../../utils/path';
import { fileIcon } from '../../assets/icons/getIcon';
import { useI18n } from '../../localize/use-i18n';
import { SyncStateItem } from '@/backend/features/local-sync/sync-state/defs';
import { clsx } from 'clsx';

const progressActions: SyncStateItem['action'][] = ['DOWNLOADING', 'UPLOADING'];
const errorActions: SyncStateItem['action'][] = ['DELETE_ERROR', 'MODIFY_ERROR', 'MOVE_ERROR', 'DOWNLOAD_ERROR', 'UPLOAD_ERROR'];

function getIcon(action: SyncStateItem['action'], progress = 0) {
  if (progressActions.includes(action)) {
    return (
      <CircularProgressbar
        value={progress}
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
    );
  }

  if (errorActions.includes(action)) {
    return <WarningCircle size={24} className="text-red" weight="regular" />;
  }

  return <Check size={24} className="text-green" weight="bold" />;
}

export function Item({ path, action, progress }: Readonly<SyncStateItem>) {
  const { t } = useI18n();
  const progressDisplay = progress ? `${Math.ceil(progress * 100)}%` : '';

  const description = t(`widget.body.activity.operation.${action}`);

  return (
    <div className="flex h-14 w-full px-3">
      <div className="flex h-full flex-1 items-center space-x-3 truncate border-b border-gray-5">
        <div className="flex h-8 w-8 items-center justify-center drop-shadow-sm">{fileIcon(getExtension(path))}</div>

        <div className="flex flex-1 flex-col justify-center space-y-px truncate pr-[14px]">
          <p className="truncate text-sm text-gray-100" title={getBaseName(path)}>
            {getBaseName(path)}
          </p>
          <p
            className={clsx('truncate text-xs text-gray-50', {
              'text-red': errorActions.includes(action),
            })}>{`${description} ${progressDisplay}`}</p>
        </div>

        <div className="flex w-7 items-center justify-center">{getIcon(action, progress)}</div>
      </div>
    </div>
  );
}
