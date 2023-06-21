import { useState } from 'react';
import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import { reportError } from 'renderer/utils/errors';
import { Transition } from '@headlessui/react';
import { ChatsCircle } from 'phosphor-react';

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

  const renderFeedbackSent = () => {
    return (
      <Transition
        enter="transition-all duration-700"
        enterFrom="transform opacity-0 translate-y-3"
        enterTo="transform opacity-100 translate-y-0"
        leave="transition-all ease-out duration-500"
        leaveFrom="transform opacity-100 translate-y-0"
        leaveTo="transform opacity-0 translate-y-3"
        show={feedbackSent}
        appear={feedbackSent}
      >
        <div className="mb-4 flex flex-1 flex-col items-center   ">
          <div className="mb-5">
            <ChatsCircle
              weight="thin"
              size={96}
              className="fill-primary"
              color="#0066FF"
            />
          </div>
          <h1 className="text-center text-lg font-medium leading-base text-gray-100">
            {translate('feedback.sent-title')}
          </h1>
          <h1 className="mt-1 text-center leading-base text-gray-60">
            {translate('feedback.sent-message')}
          </h1>
        </div>
      </Transition>
    );
  };
  return (
    <main className="flex h-[320px] w-full flex-1 flex-col">
      <div className="flex h-8 items-center justify-center border-b border-gray-5">
        <h1 className=" w-full text-center  text-gray-100">
          {translate('feedback.window-title')}
        </h1>
      </div>
      <div className="flex flex-1 flex-col px-5 py-5">
        {feedbackSent ? (
          <div className="flex h-full items-center">{renderFeedbackSent()}</div>
        ) : (
          <>
            <h1 className="text-lg font-medium leading-base">
              {translate('feedback.title')}
            </h1>
            <h3 className="mt-1 leading-base text-gray-80">
              {translate('feedback.description')}
            </h3>
            <div className="mt-5 flex flex-1 ">
              <textarea
                disabled={loading}
                spellCheck={false}
                onChange={(event) => {
                  event.preventDefault();
                  handleUpdateFeedbackText(event.target.value);
                }}
                placeholder={translate('feedback.placeholder')}
                className="w-full resize-none rounded-lg border border-gray-40 px-3 py-2.5 leading-base text-gray-100 outline-none placeholder:text-gray-30 focus:border-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-20 disabled:opacity-50"
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-sm ${
                  tooMuchCharacters ? 'text-red-50' : 'text-gray-80'
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
                className="px-3.5 py-1.5 text-[16px]"
              >
                {translate('feedback.send-feedback')}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
