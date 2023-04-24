import { useTranslationContext } from '../../../context/LocalContext';
import packageJson from '../../../../../package.json';

export default function AppInfo({ className = '' }: { className: string }) {
  const { translate } = useTranslationContext();

  return (
    <div className={`${className}`}>
      <p className="text-xs text-neutral-500">
        Internxt Drive v{packageJson.version}
      </p>
      <button
        className="mt-2 text-sm text-blue-60 hover:text-blue-70 active:text-blue-80"
        onClick={window.electron.openLogs}
        type="button"
      >
        {translate('settings.general.app-info.open-logs')}
      </button>
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
