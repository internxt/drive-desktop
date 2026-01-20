import { useI18n } from '../../localize/use-i18n';
import Button from '../../components/Button';
import WindowTopBar from '../../components/WindowTopBar';

function openUrl(url: string) {
  void globalThis.window.electron.shellOpenExternal(url).catch(reportError);
}

export function Login() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col rounded">
      <WindowTopBar onClose={globalThis.window.electron.quit} />

      <div className="flex h-full flex-col items-center justify-center gap-6">
        <div className="flex w-full flex-col items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-100">{t('login.welcome')}</h1>

          <Button
            variant="primary"
            size="lg"
            data-automation-id="buttonLogin"
            onClick={() => globalThis.window.electron.openLoginUrl()}
            customClassName="font-medium">
            {t('login.signInBrowser')}
          </Button>
        </div>

        <div className="flex h-[1.5px] w-8/12 rounded bg-gray-10" />

        <div className="flex items-center justify-center space-x-2">
          <span>{t('login.noAccount')}</span>

          <button
            type="button"
            onClick={() => openUrl('https://drive.internxt.com/new')}
            data-automation-id="buttonCreateAccountLogin"
            className="font-medium text-primary outline-none">
            {t('login.createAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
