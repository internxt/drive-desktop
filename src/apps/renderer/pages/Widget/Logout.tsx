import { useI18n } from '../../localize/use-i18n';

interface ModalLogoutProps {
  onClose: () => void;
  onLogout: () => void;
}

const ModalLogout: React.FC<ModalLogoutProps> = ({ onClose, onLogout }) => {
  const { translate } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex h-full w-screen overflow-auto bg-gray-20 bg-opacity-50" onClick={onClose}>
      <div
        className="z-100 relative m-auto flex w-11/12 max-w-md flex-col rounded-lg bg-white p-4 shadow-lg dark:bg-surface"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg leading-snug text-gray-80">{translate('widget.header.dropdown.logout-confirmation.title')}</h2>
        <p className="my-3 text-supporting-3 leading-5 text-gray-70">{translate('widget.header.dropdown.logout-confirmation.message')}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 rounded-6px border border-gray-30 bg-white px-5 py-1 text-supporting-3 text-black dark:border-gray-10 dark:bg-gray-5 dark:text-gray-80">
            {translate('widget.header.dropdown.logout-confirmation.cancel')}
          </button>
          <button onClick={onLogout} className="bg-red-600 rounded-6px bg-red px-5 py-1 text-supporting-3 text-white">
            {translate('widget.header.dropdown.logout-confirmation.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalLogout;
