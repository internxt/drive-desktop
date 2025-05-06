import '@testing-library/jest-dom';
import Help from './Help';
import { jest } from '@jest/globals';
import { mockElectron, mockOpenUrl } from '../../../../../__mocks__/mockElectron';
import { screen, render, fireEvent } from '@testing-library/react';

jest.mock('../../../../context/LocalContext', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key
  })
}));

describe('Help', () => {
  beforeAll(() => {
    window.electron = mockElectron;
  });
  afterAll(() => {
    // @ts-ignore
    delete window.electron;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component properly', () => {
    render(<Help/>);

    const component = screen.getByTestId('help-component');
    expect(component).toBeInTheDocument();
    expect(screen.getByText('settings.backups.backups-help')).toBeInTheDocument();
  });

  it('should call window.electron.openUrl with the help article URL on click', () => {
    render(<Help />);

    fireEvent.click(screen.getByText('settings.backups.backups-help'));

    expect(mockOpenUrl).toHaveBeenCalledWith(
      'https://help.internxt.com/en/articles/6583477-how-do-backups-work-on-internxt-drive'
    );
  });
});
