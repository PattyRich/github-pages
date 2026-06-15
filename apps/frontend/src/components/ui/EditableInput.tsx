import { useLayoutEffect, useRef } from 'react';
import type { ChangeEvent, CSSProperties, KeyboardEvent, RefObject } from 'react';
import './EditableInput.css';

type EditableField = HTMLInputElement | HTMLTextAreaElement;

export interface EditableInputProps {
  autoGrow?: boolean;
  autoGrowMaxHeight?: number;
  change: (event: ChangeEvent<EditableField>, stateKey?: string) => void;
  disabled?: boolean;
  enterAction?: () => void;
  id?: string;
  placeholder?: string;
  stateKey?: string;
  textArea?: boolean;
  title?: string;
  value?: string | number | readonly string[];
  width?: CSSProperties['width'];
}

export default function EditableInput({
  title,
  placeholder,
  value,
  stateKey,
  change,
  id,
  textArea,
  disabled,
  width,
  enterAction,
  autoGrow = false,
  autoGrowMaxHeight = 220,
}: EditableInputProps) {
  const fieldRef = useRef<EditableField | null>(null);

  useLayoutEffect(() => {
    if (!textArea || !autoGrow) return;
    resizeTextArea(fieldRef.current, autoGrowMaxHeight);
  }, [autoGrow, autoGrowMaxHeight, textArea, value]);

  function handleKeyUp(e: KeyboardEvent<EditableField>) {
    if (!enterAction) return;
    if ((e.keyCode || e.which) === 13) enterAction();
  }

  function handleChange(e: ChangeEvent<EditableField>) {
    if (textArea && autoGrow) {
      resizeTextArea(e.target, autoGrowMaxHeight);
    }
    change(e, stateKey);
  }

  const style: CSSProperties & Record<string, string | number | undefined> = {
    ...(width ? { width } : {}),
    ...(textArea && autoGrow
      ? { '--editable-input-max-height': formatCssLength(autoGrowMaxHeight) }
      : {}),
  };

  return (
    <div
      className={`editable-input${disabled ? ' editable-input--disabled' : ''}${
        textArea && autoGrow ? ' editable-input--autogrow' : ''
      }`}
      style={style}
    >
      {title && <span className="editable-input-label">{title}</span>}
      {textArea ? (
        <textarea
          ref={fieldRef as RefObject<HTMLTextAreaElement>}
          id={id}
          className="editable-input-field"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyUp={handleKeyUp}
          disabled={disabled}
          aria-label={title}
        />
      ) : (
        <input
          ref={fieldRef as RefObject<HTMLInputElement>}
          id={id}
          className="editable-input-field"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyUp={handleKeyUp}
          disabled={disabled}
          aria-label={title}
        />
      )}
    </div>
  );
}

function resizeTextArea(textArea: EditableField | null, maxHeight: number) {
  if (!(textArea instanceof HTMLTextAreaElement)) return;

  const maxHeightPx = Number(maxHeight) || 220;
  textArea.style.height = 'auto';
  textArea.style.height = `${Math.min(textArea.scrollHeight, maxHeightPx)}px`;
  textArea.style.overflowY = textArea.scrollHeight > maxHeightPx ? 'auto' : 'hidden';
}

function formatCssLength(value: number) {
  return `${value}px`;
}
