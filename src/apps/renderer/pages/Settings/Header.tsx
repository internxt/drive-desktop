import { At, Gear, Icon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

import { useTranslationContext } from '../../context/LocalContext';
import { UilHistory } from '@iconscout/react-unicons';

const sectionValues = ['GENERAL', 'ACCOUNT', 'BACKUPS'] as const;
export type Section = (typeof sectionValues)[number];

function Item({
  Icon,
  title,
  onClick,
  isActive,
}: {
  Icon: Icon;
  title: string;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`relative flex w-20 cursor-pointer flex-col items-center rounded-lg px-4 py-1.5 outline-none transition-colors duration-100 ease-in-out ${
        isActive
          ? 'text-gray-100'
          : 'text-gray-50 hover:text-gray-60 active:text-gray-80'
      }`}
    >
      <Icon size={28} />
      <p className="text-xs font-medium capitalize">{title.toLowerCase()}</p>
    </button>
  );
}

export default function Header({
  onClick,
  active,
}: {
  onClick: (active: Section) => void;
  active: Section;
}) {
  const { translate } = useTranslationContext();
  const sections: {
    label: Section;
    icon: Icon;
  }[] = [
    { label: 'GENERAL', icon: Gear },
    { label: 'ACCOUNT', icon: At },
    { label: 'BACKUPS', icon: UilHistory },
  ];

  const animationVariants: Record<Section, { left: string }> =
    sectionValues.reduce(
      (prev, current, i) => ({
        ...prev,
        [current]: {
          left: `${(i / sectionValues.length) * 100}%`,
        },
      }),
      {} as Record<Section, { left: string }>
    );

  return (
    <div className="draggable border-b border-gray-10 bg-surface pb-1.5 dark:bg-gray-5">
      <div className="non-draggable relative mx-auto flex w-max">
        <motion.div
          animate={active}
          variants={animationVariants}
          transition={{ ease: 'easeOut', duration: 0.2 }}
          className="absolute min-h-full w-20 rounded-lg bg-gray-5 dark:bg-gray-10"
        />
        {sections.map((section) => (
          <Item
            key={section.label}
            Icon={section.icon}
            title={translate(`settings.header.section.${section.label}`)}
            onClick={() => onClick(section.label)}
            isActive={active === section.label}
          />
        ))}
      </div>
    </div>
  );
}
