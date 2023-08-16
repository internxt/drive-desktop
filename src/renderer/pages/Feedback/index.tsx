import { useState } from 'react';
import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import { reportError } from 'renderer/utils/errors';
import { ChatsCircle } from 'phosphor-react';
import WindowTopBar from 'renderer/components/WindowTopBar';
import TextArea from 'renderer/components/TextArea';

const CHARACTERS_LIMIT = 1000;
export default function Feedback() {
  const { translate } = useTranslationContext();
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const handleUpdateFeedbackText = (feedback: string) => {
    setFeedbackText(feedback);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await window.electron.sendFeedback(feedbackText);
      setFeedbackSent(true);
    } catch (error) {
      reportError(error as Error, {
        description: 'Error while sending feedback for desktop app',
      });
    } finally {
      setLoading(false);
    }
  };

  const tooMuchCharacters = feedbackText.length > CHARACTERS_LIMIT;

  const FeedbackSent = () => (
    <div className="flex flex-1 flex-col items-center justify-center space-y-5 text-center">
      <ChatsCircle
        weight="thin"
        size={96}
        className="fill-primary"
        color="#0066FF"
      />

      <div className="flex flex-col space-y-1">
        <h1 className="text-lg font-medium leading-6 text-gray-100">
          {translate('feedback.sent-title')}
        </h1>
        <p className="leading-base text-gray-60">
          {translate('feedback.sent-message')}
        </p>
      </div>

      <Button variant="secondary" onClick={() => window.close()}>
        {translate('feedback.close')}
      </Button>
    </div>
  );
  return (
    <main className="flex w-full flex-1 flex-col">
      <WindowTopBar
        title={translate('feedback.window-title')}
        className="border-b border-gray-5"
      />

      <div className="flex h-[320px] flex-col p-5">
        {feedbackSent ? (
          <FeedbackSent />
        ) : (
          <div className="flex flex-1 flex-col space-y-5">
            <div className="flex flex-col space-y-1">
              <h1 className="text-lg font-medium leading-base">
                {translate('feedback.title')}
              </h1>
              <h3 className="leading-base text-gray-80">
                {translate('feedback.description')}
              </h3>
            </div>

            <div className="flex flex-1 flex-col space-y-2">
              <TextArea
                disabled={loading}
                spellCheck={false}
                onChange={(event) => {
                  event.preventDefault();
                  handleUpdateFeedbackText(event.target.value);
                }}
                placeholder={translate('feedback.placeholder')}
                resize="none"
                customClassName="flex-1"
              />

              <div className="flex shrink-0 items-center justify-between">
                <span
                  className={`text-sm ${
                    tooMuchCharacters ? 'text-red' : 'text-gray-80'
                  }`}
                >
                  {translate('feedback.characters-count', {
                    character_count: feedbackText.length,
                    character_limit: CHARACTERS_LIMIT,
                  })}
                </span>

                <Button
                  onClick={handleSubmit}
                  disabled={
                    feedbackText.length === 0 || tooMuchCharacters || loading
                  }
                  variant="primary"
                >
                  {translate('feedback.send-feedback')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
