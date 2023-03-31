import { useState } from 'react';
import Dropdown, { DropdownElement } from '../../../components/Dropdown';

type Language = 'ES' | 'EN' | 'FR';

const languages: Array<DropdownElement<Language>> = [
  { id: 'es', display: 'Spanish (Spain)', value: 'ES' },
  { id: 'en', display: 'English (United States)', value: 'EN' },
  { id: 'fr', display: 'French (France)', value: 'FR' },
];

export default function LanguagePicker({}): JSX.Element {
  const [selectedLanguage, setSelectedLanguage] = useState<
    DropdownElement<Language>
  >(languages[0]);

  return (
    <section
      id="language-picker"
      className="mt-4"
    >
      <h2 className="text-xs tracking-wide text-m-neutral-100">Language</h2>
      <Dropdown<Language>
        selected={selectedLanguage}
        onChange={setSelectedLanguage}
        options={languages}
      />
    </section>
  );
}
