import { X } from '@phosphor-icons/react';

export default function WindowTopBar({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`draggable relative flex-shrink-0 flex-grow-0 truncate px-1 ${
        process.env.platform !== 'darwin' ? 'h-10' : 'h-8'
      } ${className ?? ''}`}
    >
      {process.env.platform !== 'darwin' && (
        <div
          role="button"
          tabIndex={0}
          onClick={window.electron.closeWindow}
          className="non-draggable absolute right-0 top-0 flex h-10 items-center justify-center px-3 text-gray-60 hover:bg-red hover:text-white"
        >
          <X size={20} />
        </div>
      )}
      <p
        className="absolute left-1/2 flex h-full -translate-x-1/2 transform items-center truncate text-sm text-gray-80"
        data-test="window-top-bar-title"
      >
        {title}
      </p>
    </div>
  );
}
