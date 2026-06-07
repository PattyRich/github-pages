import { useEffect, useRef, useState } from 'react';
import { ModalButton, ModalShell } from './ModalShell';
import './PasswordModal.css';

export default function PasswordModal({ message, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Enter') onConfirm(value);
    if (e.key === 'Escape') onCancel();
  }

  return (
    <ModalShell
      title={message}
      titleId="password-modal-title"
      onClose={onCancel}
      maxWidth="360px"
      footer={
        <>
          <ModalButton variant="danger" onClick={onCancel}>
            Cancel
          </ModalButton>
          <ModalButton variant="success" onClick={() => onConfirm(value)}>
            Confirm
          </ModalButton>
        </>
      }
    >
      <input
        ref={inputRef}
        className="pw-modal-input"
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
    </ModalShell>
  );
}
