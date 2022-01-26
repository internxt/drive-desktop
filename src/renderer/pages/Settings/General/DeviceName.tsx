import { useRef, useState } from 'react';
import { UilCheck, UilMultiply, UilPen } from '@iconscout/react-unicons';
import { motion } from 'framer-motion';

export default function DeviceName() {
  const [name, setName] = useState('Mac name');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="select-none text-xs text-neutral-500">Device name</p>
      <div className="flex items-center">
        <motion.input
          className="peer mt-1 block h-9 rounded-md bg-l-neutral-10 outline-none focus:border focus:border-blue-60 focus:px-2 focus:ring-2 focus:ring-blue-20"
          initial={{ width: `${name.length}ch` }}
          whileFocus={{ width: '100%' }}
          transition={{ ease: 'easeInOut', delay: 0.2 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          ref={inputRef}
        />
        <button
          type="button"
          className="ml-1 hidden h-8 w-9 rounded-md bg-blue-60 text-white peer-focus:block"
        >
          <UilCheck size="24px" className="mx-auto" />
        </button>
        <button
          type="button"
          className="ml-1 hidden h-8 w-9 rounded-md bg-l-neutral-40 text-m-neutral-100 peer-focus:block"
        >
          <UilMultiply size="20px" className="mx-auto" />
        </button>
        <button
          type="button"
          className="ml-2 block text-m-neutral-60 hover:text-m-neutral-70 active:text-m-neutral-80 peer-focus:hidden"
          onClick={() => inputRef.current?.focus()}
        >
          <UilPen size="16px" />
        </button>
      </div>
    </div>
  );
}
