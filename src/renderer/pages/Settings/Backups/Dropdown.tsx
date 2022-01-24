import { Listbox, Transition } from '@headlessui/react';
import { UilCheck, UilAngleDown } from '@iconscout/react-unicons';
import { Fragment } from 'react';

export default function Dropdown({
  value,
  onChange,
  className = '',
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  const intervals = [
    { value: 6 * 3600 * 1000, display: 'Every 6h' },
    { value: 12 * 3600 * 1000, display: 'Every 12h' },
    { value: 24 * 3600 * 1000, display: 'Every day' },
    { value: -1, display: 'Manually' },
  ];

  const { display } = intervals.find((interval) => interval.value === value)!;

  return (
    <div className={className}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-fit py-1 pl-3 pr-8 text-left bg-white rounded-md drop-shadow-sm cursor-pointer border border-l-neutral-40">
                <span className="block truncate text-neutral-500 text-sm">
                  {display}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pointer-events-none bg-blue-60 text-white rounded-r-md">
                  <UilAngleDown />
                </span>
              </Listbox.Button>
              <Transition
                show={open}
                as={Fragment}
                enterFrom="scale-95 opacity-0"
                enterTo="scale-100 opacity-1"
                leaveFrom="scale-100 opacity-1"
                leaveTo="scale-95 opacity-0"
                unmount={false}
              >
                <Listbox.Options
                  static
                  className="duration-150 ease-in-out transform transition absolute bottom-full w-fit p-1 overflow-auto text-sm bg-white rounded-md shadow-lg max-h-60 border border-l-neutral-40"
                >
                  {intervals.map((interval) => (
                    <Listbox.Option
                      key={interval.value}
                      className={({ active }) =>
                        `${
                          active ? 'text-white bg-blue-50' : 'text-neutral-500'
                        }
                          cursor-default select-none relative py-1 pl-6 pr-8 rounded-md`
                      }
                      value={interval.value}
                    >
                      {({ selected }) => (
                        <>
                          <span className="block truncate">
                            {interval.display}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-1">
                              <UilCheck
                                className="w-4 h-4"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
}
