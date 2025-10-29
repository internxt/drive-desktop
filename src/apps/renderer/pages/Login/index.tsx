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

      {/* Main content centered */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-xs w-full">
          {/* Welcome title */}
          <h1 className="text-3xl font-normal text-gray-900 text-center leading-tight mb-2">
            {translate('login.welcome') || 'Bienvenido a Internxt'}
          </h1>

          {/* Sign in with browser button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={isLoading}
            onClick={handleSignInWithBrowser}
            className="w-full rounded-lg px-6 py-4 text-lg font-medium bg-blue-500 hover:bg-blue-600 text-white text-center flex items-center justify-center"
            data-automation-id="buttonSignInBrowser"
          >
            {translate('login.action.sign-in-browser') || 'Inicia sesión con el navegador'}
          </Button>

          {/* Divider line */}
          <div className="w-full border-t border-gray-300 my-4" />

          {/* Create account link */}
          <div className="text-center">
            <span className="text-base text-gray-700">
              {translate('login.no-account') || '¿No tienes cuenta?'}
            </span>
            {' '}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCreateAccount}
              className={`text-base font-medium outline-none no-underline decoration-none ${
                isLoading ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700'
              }`}
              style={{
                textDecoration: 'none',
                color: isLoading ? '#9CA3AF' : '#2563EB'
              }}
              data-automation-id="buttonCreateAccountLogin"
            >
              {translate('login.create-account') || 'Crear cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
