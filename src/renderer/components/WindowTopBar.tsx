import { UilMultiply } from '@iconscout/react-unicons';

export default function WindowTopBar({ title }: { title: string }) {
  return (
    <div className="relative px-1 h-10 flex-grow-0 draggable">
      {process.env.platform !== 'darwin' && (
        <div
          role="button"
          tabIndex={0}
          onKeyPress={window.electron.closeWindow}
          onClick={window.electron.closeWindow}
          className="absolute right-0 top-0 py-2 px-3 text-gray-60 hover:text-white hover:bg-red-60 non-draggable"
        >
          <UilMultiply className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm text-gray-80 absolute top-2 left-1/2 transform -translate-x-1/2">
        {title}
      </p>
    </div>
  );
}
