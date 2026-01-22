import packageJson from '../../../../../../package.json';
import { useTranslationContext } from '../../../context/LocalContext';

export default function AppInfo() {
  const { translate } = useTranslationContext();

  const handleOpenURL = async (URL: string) => {
    try {
      await window.electron.openUrl(URL);
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className="mt-auto flex flex-col space-y-4">
      <div className="relative flex h-2 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-gray-10" />
      <p className="text-sm leading-4 text-gray-100">Internxt v{packageJson.version}</p>

      <div className="flex flex-col items-start space-y-1 text-base leading-5">
        <button type="button" className="text-primary active:text-primary-dark" onClick={window.electron.openLogs}>
          {translate('settings.general.app-info.open-logs')}
        </button>

        <button
          type="button"
          className="text-primary active:text-primary-dark"
          onClick={() => handleOpenURL('https://internxt.com/drive')}>
          {translate('settings.general.app-info.more')}
        </button>
      </div>
    </div>
  );
}
