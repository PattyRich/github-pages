import { useLayoutEffect, useRef } from 'react';
import './EditableInput.css';

export default function EditableInput({
  title,
  placeholder,
  value,
  stateKey,
  change,
  textArea,
  disabled,
  width,
  enterAction,
  autoGrow = false,
  autoGrowMaxHeight = 220,
}) {
  const fieldRef = useRef(null);

  useLayoutEffect(() => {
    if (!textArea || !autoGrow) return;
    resizeTextArea(fieldRef.current, autoGrowMaxHeight);
  }, [autoGrow, autoGrowMaxHeight, textArea, value]);

  function handleKeyUp(e) {
    if (!enterAction) return;
    if ((e.keyCode || e.which) === 13) enterAction();
  }

  function handleChange(e) {
    if (textArea && autoGrow) {
      resizeTextArea(e.target, autoGrowMaxHeight);
    }
    change(e, stateKey);
  }

  const Tag = textArea ? 'textarea' : 'input';

  return (
    <div
      className={`editable-input${disabled ? ' editable-input--disabled' : ''}${
        textArea && autoGrow ? ' editable-input--autogrow' : ''
      }`}
      style={{
        ...(width ? { width } : {}),
        ...(textArea && autoGrow
          ? { '--editable-input-max-height': formatCssLength(autoGrowMaxHeight) }
          : {}),
      }}
    >
      {title && <span className="editable-input-label">{title}</span>}
      <Tag
        ref={fieldRef}
        className="editable-input-field"
        type={textArea ? undefined : 'text'}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        disabled={disabled}
        aria-label={title}
      />
    </div>
  );
}

function resizeTextArea(textArea, maxHeight) {
  if (!textArea) return;

  const maxHeightPx = Number(maxHeight) || 220;
  textArea.style.height = 'auto';
  textArea.style.height = `${Math.min(textArea.scrollHeight, maxHeightPx)}px`;
  textArea.style.overflowY = textArea.scrollHeight > maxHeightPx ? 'auto' : 'hidden';
}

function formatCssLength(value) {
  return typeof value === 'number' ? `${value}px` : value;
}
