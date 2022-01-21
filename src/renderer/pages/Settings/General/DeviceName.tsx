import { useRef, useState } from 'react';
import { UilCheck, UilMultiply, UilPen } from '@iconscout/react-unicons';

export default function DeviceName() {
  const [name, setName] = useState('Mac name');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-xs text-neutral-500">Device name</p>
      <div className="flex items-center space-x-1">
        <input
          className="h-9 block mt-1 peer bg-l-neutral-10 min-w-max focus:w-full focus:px-2 rounded-md focus:ring-2 focus:ring-blue-20 focus:border focus:border-blue-60 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          ref={inputRef}
        />
        <button
          type="button"
          className="w-9 h-8 bg-blue-60 text-white rounded-md hidden peer-focus:block"
        >
          <UilCheck size="24px" className="mx-auto" />
        </button>
        <button
          type="button"
          className="w-9 h-8 bg-l-neutral-40 text-m-neutral-100 rounded-md hidden peer-focus:block"
        >
          <UilMultiply size="20px" className="mx-auto" />
        </button>
        <button
          type="button"
          className="block peer-focus:hidden text-m-neutral-60 hover:text-m-neutral-70 active:text-m-neutral-80"
          onClick={() => inputRef.current?.focus()}
        >
          <UilPen size="16px" />
        </button>
      </div>
    </div>
  );
}
