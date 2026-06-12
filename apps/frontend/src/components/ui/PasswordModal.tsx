import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { ModalButton, ModalShell } from './ModalShell';
import './PasswordModal.css';

interface PasswordModalProps {
  message: ReactNode;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export default function PasswordModal({ message, onConfirm, onCancel }: PasswordModalProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
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
