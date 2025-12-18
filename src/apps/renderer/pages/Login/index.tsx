import { useState } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import Button from '../../components/Button';
import WindowTopBar from '../../components/WindowTopBar';

export default function Login() {
  const { translate } = useTranslationContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenURL = async (URL: string) => {
    try {
      setIsLoading(true);
      await window.electron.openUrl(URL);
    } catch (error) {
      console.error('Error opening URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithBrowser = () => {
    handleOpenURL('https://drive.internxt.com/login?universalLink=true');
  };

  const handleCreateAccount = () => {
    handleOpenURL('https://drive.internxt.com/new');
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-surface dark:bg-gray-1">
      <WindowTopBar className="bg-surface dark:bg-gray-1" />

      <div className="flex flex-1 items-center justify-center px-8">
        <div className="flex w-full max-w-[300px] flex-col items-center justify-center">
          <h1 className="text-gray-900 mb-3 text-center text-3xl font-normal leading-tight">
            {translate('login.welcome') || 'Bienvenido a Internxt'}
          </h1>

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={isLoading}
            onClick={handleSignInWithBrowser}
            className="bg-blue-500 hover:bg-blue-600 mb-6 flex items-center justify-center rounded-lg px-6 py-3 text-center text-base font-medium text-white"
            data-automation-id="buttonSignInBrowser">
            {translate('login.action.login-in-browser') || 'Inicia sesión con el navegador'}
          </Button>

          <div className="border-gray-300 w-full border-t" />

          <div className="mt-6 text-center">
            <span className="text-gray-700 text-base">{translate('login.no-account') || '¿No tienes cuenta?'}</span>{' '}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCreateAccount}
              className={`decoration-none text-base font-medium no-underline outline-none ${
                isLoading ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700'
              }`}
              style={{
                textDecoration: 'none',
                color: isLoading ? '#9CA3AF' : '#2563EB',
              }}
              data-automation-id="buttonCreateAccountLogin">
              {translate('login.create-account') || 'Crear cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
