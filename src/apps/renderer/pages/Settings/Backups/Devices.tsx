import { useTranslationContext } from '../../../context/LocalContext';

export default function Devices() {
  const { translate } = useTranslationContext();

  return (
    <div className="rounded-lg shadow-md">
      <h2 className="truncate text-sm font-medium leading-4 text-gray-80">{translate('settings.backups.title')}</h2>
      <ul className="space-y-2">
        <li className="bg-blue-100 rounded-md p-2">
          <span className="text-blue-600 font-bold">This device</span> Mac Mini M1
        </li>
        <li className="cursor-pointer rounded-md p-2 hover:bg-gray-100">Home PC</li>
        <li className="cursor-pointer rounded-md p-2 hover:bg-gray-100">Office server</li>
      </ul>
    </div>
  );
}
