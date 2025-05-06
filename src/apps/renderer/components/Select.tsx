import { CaretDown, CaretUp, Check } from '@phosphor-icons/react';
import * as RadixSelect from '@radix-ui/react-select';
import React from 'react';

export type SelectOptionsType = { value: string; name: string };

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOptionsType[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  container?: HTMLElement | null;
}

export default function Select(props: SelectProps) {
  const SelectItem = ({
    value,
    name,
    ...props
  }: {
    value: string;
    name: string;
  }) => (
    <RadixSelect.Item
      value={value}
      className="flex h-7 items-center justify-start space-x-1 rounded-md pl-1.5 pr-4 outline-none data-[highlighted]:bg-primary data-[highlighted]:text-white"
      {...props}
    >
      <div className="flex w-4 items-center">
        <RadixSelect.ItemIndicator>
          <Check size={14} weight="bold" />
        </RadixSelect.ItemIndicator>
      </div>

      <RadixSelect.ItemText className="truncate">{name}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );

  return (
    <RadixSelect.Root
      onValueChange={props.onValueChange}
      value={props.value}
      disabled={props.disabled}
    >
      <RadixSelect.Trigger
        className={`flex h-8 items-center space-x-1.5 truncate rounded-lg border bg-surface pl-3 pr-1.5 shadow-sm outline-none transition-all duration-75 ease-in-out active:bg-gray-1 dark:bg-gray-5 dark:active:border-gray-30 dark:active:bg-gray-10 ${
          props.disabled
            ? 'pointer-events-none border-gray-5 text-gray-40'
            : 'border-gray-20 text-highlight'
        }`}
        aria-label={props.ariaLabel ?? undefined}
      >
        <RadixSelect.Value placeholder={props.placeholder ?? undefined} />

        <RadixSelect.Icon>
          <CaretDown size={16} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal
        container={(props.container as HTMLElement) ?? document.body}
        className="non-draggable"
      >
        <RadixSelect.Content className="z-50 rounded-lg border border-gray-20 bg-surface/75 p-1.5 shadow-2xl backdrop-blur-3xl dark:bg-gray-5/75">
          <RadixSelect.ScrollUpButton className="flex h-7 items-center justify-center">
            <CaretUp size={16} weight="bold" />
          </RadixSelect.ScrollUpButton>

          <RadixSelect.Viewport className="SelectViewport">
            <RadixSelect.Group>
              {props.options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  name={option.name}
                />
              ))}
            </RadixSelect.Group>
          </RadixSelect.Viewport>

          <RadixSelect.ScrollDownButton className="flex h-7 items-center justify-center">
            <CaretDown size={16} weight="bold" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
