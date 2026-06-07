import './FormControls.css';

export function Field({ label, children, className = '' }) {
  return (
    <label className={['osrs-field', className].filter(Boolean).join(' ')}>
      {label && <span className="osrs-field-label">{label}</span>}
      {children}
    </label>
  );
}

export function SelectField({ label, children, className = '', ...props }) {
  return (
    <Field label={label} className={className}>
      <select className="osrs-select" {...props}>
        {children}
      </select>
    </Field>
  );
}

export function RangeField({ label, help, className = '', ...props }) {
  return (
    <div className={['osrs-range-field', className].filter(Boolean).join(' ')}>
      {label && <div className="osrs-field-label">{label}</div>}
      <input className="osrs-range" type="range" {...props} />
      {help && <div className="osrs-field-help">{help}</div>}
    </div>
  );
}

export function CheckboxField({
  id,
  label,
  className = '',
  inputClassName = '',
  labelClassName = '',
  ...props
}) {
  return (
    <label className={['osrs-checkbox-row', className].filter(Boolean).join(' ')} htmlFor={id}>
      <input
        id={id}
        className={['osrs-checkbox', inputClassName].filter(Boolean).join(' ')}
        type="checkbox"
        {...props}
      />
      <span className={['osrs-checkbox-label', labelClassName].filter(Boolean).join(' ')}>
        {label}
      </span>
    </label>
  );
}

export function SwitchField({ id, label, className = '', ...props }) {
  return (
    <label className={['osrs-switch', className].filter(Boolean).join(' ')} htmlFor={id}>
      <input id={id} className="osrs-switch-input" type="checkbox" {...props} />
      <span className="osrs-switch-control" aria-hidden="true" />
      <span className="osrs-switch-label">{label}</span>
    </label>
  );
}
