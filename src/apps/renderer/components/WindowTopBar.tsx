import { X } from '@phosphor-icons/react';
import { clsx } from 'clsx';

type Props = {
  title?: string;
  className?: string;
  onClose: () => void;
};

export default function WindowTopBar({ title, className, onClose }: Props) {
  return (
    <div className={clsx('draggable-handle relative h-10 rounded-t', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        className="absolute right-0 top-0 flex h-10 items-center justify-center rounded-tr px-3 text-gray-60 hover:bg-red hover:text-white">
        <X size={20} />
      </div>
      <p
        className="absolute left-1/2 flex h-full -translate-x-1/2 transform items-center truncate text-sm text-gray-80"
        data-test="window-top-bar-title">
        {title}
      </p>
    </div>
  );
}
