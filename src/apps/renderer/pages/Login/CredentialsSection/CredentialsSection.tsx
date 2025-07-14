import TextInput from '@/apps/renderer/components/TextInput';
import { useTranslationContext } from '@/apps/renderer/context/LocalContext';
import { type FC } from 'react';
import { LoginState } from '../types';
import PasswordInput from '@/apps/renderer/components/PasswordInput';
import Button from '@/apps/renderer/components/Button';

interface Props {
  state: LoginState;
  email: string;
  password: string;
  openURL: (url: string) => void;
  onSubmit: () => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
}

export const CredentialsSection: FC<Props> = ({ state, email, password, openURL, onSubmit, setEmail, setPassword }) => {
  const { translate } = useTranslationContext();

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
          />
        </label>

        <button
          type="button"
          disabled={state === 'loading'}
          onClick={() => openURL('https://drive.internxt.com/recovery-link')}
          tabIndex={3}
          className={`text-sm font-medium outline-none ${state === 'loading' ? 'text-gray-30' : 'text-primary'}`}>
          {translate('login.password.forgotten')}
        </button>

        <Button type="submit" variant="primary" size="lg" disabled={state === 'loading'} tabIndex={4}>
          {translate(state === 'loading' ? 'login.action.is-logging-in' : 'login.action.login')}
        </Button>

        <button
          type="button"
          disabled={state === 'loading'}
          onClick={() => openURL('https://drive.internxt.com/new')}
          tabIndex={5}
          className={`text-sm font-medium outline-none ${state === 'loading' ? 'text-gray-30' : 'text-primary'}`}>
          {translate('login.create-account')}
        </button>
      </form>
    </>
  );
};
