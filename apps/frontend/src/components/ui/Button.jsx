export default function BSButton({ style, disabled, click, variant, text }) {
  const variantClass = variant ? `osrs-btn--${variant.replace('outline-', '')}` : '';

  return (
    <button
      type="button"
      style={style}
      disabled={disabled}
      onClick={click}
      className={`osrs-btn ${variantClass}`.trim()}
    >
      {text}
    </button>
  );
}
