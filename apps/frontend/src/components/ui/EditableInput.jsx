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
}) {
  function handleKeyUp(e) {
    if (!enterAction) return;
    if ((e.keyCode || e.which) === 13) enterAction();
  }

  const Tag = textArea ? 'textarea' : 'input';

  return (
    <div
      className={`editable-input${disabled ? ' editable-input--disabled' : ''}`}
      style={width ? { width } : undefined}
    >
      {title && <span className="editable-input-label">{title}</span>}
      <Tag
        className="editable-input-field"
        type={textArea ? undefined : 'text'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => change(e, stateKey)}
        onKeyUp={handleKeyUp}
        disabled={disabled}
        aria-label={title}
      />
    </div>
  );
}
