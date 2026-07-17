import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { fetchPost } from '../../utils/utils';
import EditableInput from './EditableInput';
import { ModalButton, ModalShell } from './ModalShell';
import './FeedbackModal.css';

interface FeedbackModalProps {
  boardName?: string;
  handleClose: () => void;
}

const FeedbackModal = ({ boardName, handleClose }: FeedbackModalProps) => {
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  function sendMessage(message: string) {
    fetchPost('feedback', {
      message,
      ...(boardName ? { boardName } : {}),
    });
    setSent(true);
  }

  return (
    <ModalShell
      title="Feedback"
      titleId="feedback-modal-title"
      onClose={handleClose}
      maxWidth="620px"
      bodyClassName="fm-body"
      footer={
        <>
          <ModalButton variant="danger" onClick={handleClose}>
            Close
          </ModalButton>
          {!sent && (
            <ModalButton
              variant="success"
              disabled={feedback.length === 0}
              onClick={() => sendMessage(feedback)}
            >
              Send
            </ModalButton>
          )}
        </>
      }
    >
      {sent ? (
        <>
          <p className="fm-thanks osrs-header">Thanks!</p>
          <p className="fm-note">
            If you want to talk to me directly my in game name is Praynr or Praynyr - I may be on!
          </p>
        </>
      ) : (
        <>
          <p className="fm-prompt">What can I do to make the website better?</p>
          <EditableInput
            title="Feedback"
            textArea
            value={feedback}
            change={(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
              setFeedback(e.target.value)
            }
          />
        </>
      )}
    </ModalShell>
  );
};

export default FeedbackModal;
