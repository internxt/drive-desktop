import { useOpenLogs } from '@/apps/renderer/api/use-open-logs';
import { useI18n } from '@/apps/renderer/localize/use-i18n';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { clsx } from 'clsx';

export function AppInfo() {
  const { translate } = useI18n();
  const { mutate: openLogs, isPending } = useOpenLogs();

  return (
    <div className="flex flex-col space-y-4">
      <p className="text-sm leading-4 text-gray-100">Internxt v{INTERNXT_VERSION}</p>

      <div className="flex flex-col items-start space-y-1 text-base leading-5">
        <button
          type="button"
          className={clsx('text-primary active:text-primary-dark', isPending && 'cursor-wait')}
          onClick={() => openLogs()}
          disabled={isPending}>
          {translate('settings.general.app-info.open-logs')}
        </button>

        <button
          type="button"
          className="text-primary active:text-primary-dark"
          onClick={() => globalThis.window.electron.shellOpenExternal('https://internxt.com/drive')}>
          {translate('settings.general.app-info.more')}
        </button>
      </div>
    </div>
  );
}
