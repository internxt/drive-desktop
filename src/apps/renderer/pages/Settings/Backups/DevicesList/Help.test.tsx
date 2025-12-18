import Help from './Help';
import { screen, render, fireEvent } from '@testing-library/react';

vi.mock('../../../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key,
  }),
}));

describe('Help', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component properly', () => {
    render(<Help />);

    const component = screen.getByTestId('help-component');
    expect(component).toBeInTheDocument();
    expect(screen.getByText('settings.backups.backups-help')).toBeInTheDocument();
  });

  it('should call window.electron.openUrl with the help article URL on click', () => {
    render(<Help />);

    fireEvent.click(screen.getByText('settings.backups.backups-help'));

    expect(window.electron.openUrl).toHaveBeenCalledWith(
      'https://help.internxt.com/en/articles/6583477-how-do-backups-work-on-internxt-drive',
    );
  });
});
