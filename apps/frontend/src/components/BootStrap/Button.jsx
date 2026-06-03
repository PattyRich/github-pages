import Button from 'react-bootstrap/Button';

export default function BSButton({ style, disabled, click, variant, text }) {
  return (
    <Button
      style={style}
      disabled={disabled}
      onClick={click}
      variant={variant || 'outline-secondary'}
      className="osrs-btn"
    >
      {text}
    </Button>
  );
}
