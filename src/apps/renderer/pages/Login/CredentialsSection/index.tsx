import TextInput from '@/apps/renderer/components/TextInput';
import { LoginState } from '../types';
import { PasswordInput } from '@/apps/renderer/components/password-input';
import Button from '@/apps/renderer/components/Button';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

interface Props {
  state: LoginState;
  email: string;
  password: string;
  openURL: (url: string) => void;
  onSubmit: () => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
}

export function CredentialsSection({ state, email, password, openURL, onSubmit, setEmail, setPassword }: Props) {
  const { translate } = useI18n();

  return (
    <>
      <form
        className="flex flex-1 flex-col space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}>
        <label className="flex flex-col items-start space-y-2">
          <p className="text-sm font-medium leading-4 text-gray-80">{translate('login.email.section')}</p>

          <TextInput
            required
            disabled={state === 'loading'}
            variant="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value.toLowerCase())}
            customClassName="w-full"
            tabIndex={1}
            data-automation-id="inputEmailLogin"
          />
        </label>

        <label className="flex flex-col items-start space-y-2">
          <p className="text-sm font-medium leading-4 text-gray-80">{translate('login.password.section')}</p>

          <PasswordInput
            required
            disabled={state === 'loading'}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            customClassName="w-full"
            tabIndex={2}
            data-automation-id="inputPasswordLogin"
          />
        </label>

        <button
          type="button"
          disabled={state === 'loading'}
          onClick={() => openURL('https://drive.internxt.com/recovery-link')}
          tabIndex={3}
          data-automation-id="buttonForgotPasswordLogin"
          className={`text-sm font-medium outline-none ${state === 'loading' ? 'text-gray-30' : 'text-primary'}`}>
          {translate('login.password.forgotten')}
        </button>

        <Button type="submit" variant="primary" size="lg" disabled={state === 'loading'} tabIndex={4} data-automation-id="buttonLogin">
          {translate(state === 'loading' ? 'login.action.is-logging-in' : 'login.action.login')}
        </Button>

        <button
          type="button"
          disabled={state === 'loading'}
          onClick={() => openURL('https://drive.internxt.com/new')}
          tabIndex={5}
          data-automation-id="buttonCreateAccountLogin"
          className={`text-sm font-medium outline-none ${state === 'loading' ? 'text-gray-30' : 'text-primary'}`}>
          {translate('login.create-account')}
        </button>
      </form>
    </>
  );
}
