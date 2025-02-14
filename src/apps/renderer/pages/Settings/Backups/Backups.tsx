import { useTranslationContext } from '../../../context/LocalContext';

export default function Backups() {
  const { translate } = useTranslationContext();

  return (
    <div className="rounded-lg bg-white p-6 text-center shadow-md">
      <div className="mb-4 flex justify-center">
        <div className="bg-gray-200 rounded-full p-4">{/* Aquí iría tu icono de disco duro */}</div>
      </div>
      <h2 className="mb-2 text-xl font-semibold">INTERNXT BACKUPS</h2>
      <p className="text-gray-600 mb-4">Save a copy of your most important files on the cloud automatically</p>
      <button className="bg-blue-500 hover:bg-blue-600 rounded-full px-4 py-2 font-bold text-white">Backup now</button>
    </div>
  );
}
