import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import EditableInput from './EditableInput';

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders label and input when title is provided', () => {
  render(<EditableInput title="Board Name" value="" change={vi.fn()} />);
  expect(screen.getByText('Board Name')).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});

test('renders no label when title is omitted', () => {
  const { container } = render(<EditableInput value="" change={vi.fn()} />);
  expect(container.querySelector('.editable-input-label')).toBeNull();
});

test('renders a textarea when textArea prop is set', () => {
  const { container } = render(<EditableInput title="Notes" textArea value="" change={vi.fn()} />);
  expect(container.querySelector('textarea')).toBeInTheDocument();
  expect(container.querySelector('input')).toBeNull();
});

test('calls change with event and stateKey when the input changes', () => {
  const change = vi.fn();
  render(<EditableInput title="Name" stateKey="boardName" value="" change={change} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
  expect(change).toHaveBeenCalledWith(expect.any(Object), 'boardName');
});

test('calls enterAction when Enter is pressed', () => {
  const enterAction = vi.fn();
  render(<EditableInput title="Name" value="" change={vi.fn()} enterAction={enterAction} />);
  fireEvent.keyUp(screen.getByRole('textbox'), { keyCode: 13 });
  expect(enterAction).toHaveBeenCalledOnce();
});

test('does not call enterAction when another key is pressed', () => {
  const enterAction = vi.fn();
  render(<EditableInput title="Name" value="" change={vi.fn()} enterAction={enterAction} />);
  fireEvent.keyUp(screen.getByRole('textbox'), { keyCode: 65 });
  expect(enterAction).not.toHaveBeenCalled();
});

test('disables the input and adds disabled class', () => {
  const { container } = render(<EditableInput title="Name" value="" change={vi.fn()} disabled />);
  expect(screen.getByRole('textbox')).toBeDisabled();
  expect(container.querySelector('.editable-input--disabled')).toBeInTheDocument();
});

test('applies inline width style when width prop is provided', () => {
  const { container } = render(
    <EditableInput title="Name" value="" change={vi.fn()} width="300px" />
  );
  expect(container.querySelector('.editable-input')).toHaveStyle({ width: '300px' });
});

test('renders placeholder text', () => {
  render(<EditableInput title="Name" value="" change={vi.fn()} placeholder="Enter board name" />);
  expect(screen.getByPlaceholderText('Enter board name')).toBeInTheDocument();
});
