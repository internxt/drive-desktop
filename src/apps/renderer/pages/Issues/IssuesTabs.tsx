import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import { Section } from './Section';

function TabPill({
  value,
  name,
  active,
  setAsActive,
}: {
  value: Section;
  name: string;
  active: boolean;
  setAsActive: () => void;
}) {
  return (
    <li
      id={`tab-${value}`}
      onClick={setAsActive}
      className={`relative flex cursor-pointer items-center px-4 transition-colors duration-200 ease-out ${
        active ? 'text-gray-100' : 'text-gray-60'
      }`}
    >
      {name}
    </li>
  );
}

export function IssuesTabs({
  active,
  onChangeTab,
}: {
  active: Section;
  onChangeTab: (section: Section) => void;
}) {
  const { translate, language } = useTranslationContext();
  const [tabsWidth, setTabsWidth] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    setTabsWidth([
      (document.querySelector('#tab-virtualDrive') as HTMLElement).offsetWidth,
      (document.querySelector('#tab-app') as HTMLElement).offsetWidth,
    ]);
  }, [language, active]);

  const tabs: { value: Section; name: string }[] = [
    {
      value: 'virtualDrive',
      name: translate('issues.tabs.sync'),
    },
    {
      value: 'app',
      name: translate('issues.tabs.general'),
    },
    {
      value: 'backups',
      name: translate('issues.tabs.backups'),
    },
  ];

  return (
    <div className="non-draggable flex h-10 items-stretch rounded-xl bg-gray-5 p-1">
      <div className="relative flex items-stretch">
        <motion.div
          variants={{
            virtualDrive: { left: 0, right: 'unset', width: tabsWidth[0] },
            app: { left: tabsWidth[0], right: 'unset', width: tabsWidth[1] },
            backups: {
              left: 'unset',
              right: 0,
              width: tabsWidth[1],
            },
          }}
          animate={active}
          transition={{ ease: 'easeOut', duration: 0.2 }}
          className="absolute h-full rounded-lg bg-surface shadow dark:bg-gray-20"
          style={{ width: tabsWidth[0] }}
        />

        {tabs.map((tab) => (
          <TabPill
            key={tab.value}
            {...tab}
            active={active === tab.value}
            setAsActive={() => {
              onChangeTab(tab.value);
            }}
          />
        ))}
      </div>
    </div>
  );
}
