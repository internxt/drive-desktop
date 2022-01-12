import FileIcon from '../../assets/file.svg';

export default function SyncInfo() {
  return (
    <div className="flex-grow bg-l-neutral-10 border-t border-t-l-neutral-30 px-3 pt-3 relative">
      <Empty />
      <div className="flex w-full justify-end">
        <button
          tabIndex={0}
          type="button"
          className="text-xs font-medium text-blue-60"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="absolute left-1/2 top-1/2 trasform -translate-x-1/2 -translate-y-1/2 w-full text-center">
      <div className="relative h-16">
        <div className="absolute transform rotate-12 left-1/2 -translate-x-6 opacity-60">
          <FileIcon className="h-16 w-16" />
        </div>
        <div className="absolute transform -rotate-12 left-1/2 -translate-x-10">
          <FileIcon className="h-16 w-16" />
        </div>
      </div>
      <p className="mt-7 text-sm text-blue-100">There is no recent activity</p>
      <p className="mt-1 text-xs text-m-neutral-100 px-4">
        Information will show up here when changes are made to sync your local
        folder with Internxt Drive
      </p>
    </div>
  );
}
