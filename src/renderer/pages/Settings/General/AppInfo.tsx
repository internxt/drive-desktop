import packageJson from '../../../../../package.json';
import { useTranslationContext } from '../../../context/LocalContext';

export default function AppInfo({ className = '' }: { className: string }) {
  const { translate } = useTranslationContext();

  return (
    <div className={`${className}`}>
      <p className="text-xs text-neutral-500">
        Internxt Drive v{packageJson.version}
      </p>
      <div className="flex flex-col items-start ">
        <button
          className="my-2 text-sm text-blue-60 hover:text-blue-70 active:text-blue-80"
          onClick={window.electron.startMigration}
          type="button"
        >
          {translate('settings.general.app-info.open-migration')}
        </button>
        <button
          className="mb-2 text-sm text-blue-60 hover:text-blue-70 active:text-blue-80"
          onClick={window.electron.openLogs}
          type="button"
        >
          {translate('settings.general.app-info.open-logs')}
        </button>
      </div>
      <a
        className="block text-sm text-blue-60 hover:text-blue-70 active:text-blue-80"
        href="https://internxt.com/drive"
        target="_blank"
        rel="noopener noreferrer"
      >
        {translate('settings.general.app-info.more')}
      </a>
    </div>
  );
}
