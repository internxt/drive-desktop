import { Warning, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslationContext } from '../../../../context/LocalContext';

export function NautilusUnavailable() {
  const [isNautilusAvailable, setIsNautilusAvailable] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const { translate } = useTranslationContext();

  useEffect(() => {
    window.electron
      .getNautilusAvailability()
      .then((isAvailable) => {
        setIsNautilusAvailable(isAvailable);
      })
      .catch(() => {
        setIsNautilusAvailable(true);
      });
  }, []);

  if (isNautilusAvailable || dismissed) {
    return <></>;
  }

  return (
    <div className="mx-1 mt-3 flex items-center gap-2.5 rounded-xl border-2 border-[#FFF4CC] bg-[#FFF9E5] px-4 py-2 dark:border-[#7F6B19] dark:bg-[#4C400F]">
      <Warning size={22} weight="fill" className="shrink-0 text-yellow-dark" />
      <div className="flex flex-1 flex-col">
        <p className="text-xs text-gray-80">{translate('widget.banners.nautilus-unavailable.body')}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 shrink-0 rounded-md p-1 text-gray-50 transition-colors hover:bg-black/5 hover:text-gray-80"
        aria-label="Dismiss">
        <X size={18} />
      </button>
    </div>
  );
}
