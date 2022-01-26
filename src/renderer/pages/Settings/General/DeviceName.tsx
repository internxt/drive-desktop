import { useRef, useState } from 'react';
import { UilCheck, UilMultiply, UilPen } from '@iconscout/react-unicons';

export default function DeviceName() {
  const [name, setName] = useState('Mac name');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="select-none text-xs text-neutral-500">Device name</p>
      <div className="flex items-center space-x-1">
        <input
          className="peer mt-1 block h-9 cursor-default rounded-md bg-l-neutral-10 outline-none focus:!w-full focus:cursor-auto focus:border focus:border-blue-60 focus:px-2 focus:ring-2 focus:ring-blue-20"
          style={{ width: `${name.length}ch` }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          ref={inputRef}
        />
        <button
          type="button"
          className="hidden h-8 w-9 rounded-md bg-blue-60 text-white peer-focus:block"
        >
          <UilCheck size="24px" className="mx-auto" />
        </button>
        <button
          type="button"
          className="hidden h-8 w-9 rounded-md bg-l-neutral-40 text-m-neutral-100 peer-focus:block"
        >
          <UilMultiply size="20px" className="mx-auto" />
        </button>
        <button
          type="button"
          className="block text-m-neutral-60 hover:text-m-neutral-70 active:text-m-neutral-80 peer-focus:hidden"
          onClick={() => inputRef.current?.focus()}
        >
          <UilPen size="16px" />
        </button>
      </div>
    </div>
  );
}
