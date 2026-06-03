import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

export default function EditableInput({ title, placeholder, value, stateKey, change, textArea, disabled, width, enterAction }) {
  function handleKeyUp(e) {
    if (!enterAction) return;
    if ((e.keyCode || e.which) === 13) enterAction();
  }

  return (
    <InputGroup className="mb-3" style={width ? { width } : { width: '100%', maxWidth: '500px' }}>
      <InputGroup.Text id="basic-addon1">{title}</InputGroup.Text>
      <FormControl
        placeholder={placeholder}
        as={textArea ? "textarea" : undefined}
        value={value}
        aria-describedby="basic-addon1"
        onChange={(e) => change(e, stateKey)}
        onKeyUp={handleKeyUp}
        disabled={disabled}
      />
    </InputGroup>
  );
}
