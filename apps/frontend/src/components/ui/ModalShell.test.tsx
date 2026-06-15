import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ModalButton, ModalShell } from './ModalShell';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── ModalShell ───────────────────────────────────────────────────────────────

test('renders title, children, and footer', () => {
  render(
    <ModalShell title="Test Modal" onClose={vi.fn()} footer={<button>OK</button>}>
      <p>Body content</p>
    </ModalShell>
  );
  expect(screen.getByText('Test Modal')).toBeInTheDocument();
  expect(screen.getByText('Body content')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
});

test('calls onClose when the close button is clicked', () => {
  const onClose = vi.fn();
  render(
    <ModalShell title="Modal" onClose={onClose}>
      <p>content</p>
    </ModalShell>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledOnce();
});

test('calls onClose when the backdrop is clicked', () => {
  const onClose = vi.fn();
  const { container } = render(
    <ModalShell title="Modal" onClose={onClose}>
      <p>content</p>
    </ModalShell>
  );
  const backdrop = container.querySelector('.osrs-modal-backdrop');
  expect(backdrop).toBeInTheDocument();
  fireEvent.mouseDown(backdrop as Element);
  expect(onClose).toHaveBeenCalledOnce();
});

test('does not call onClose when the panel itself is clicked', () => {
  const onClose = vi.fn();
  const { container } = render(
    <ModalShell title="Modal" onClose={onClose}>
      <p>content</p>
    </ModalShell>
  );
  const panel = container.querySelector('.osrs-modal-panel');
  expect(panel).toBeInTheDocument();
  fireEvent.mouseDown(panel as Element);
  expect(onClose).not.toHaveBeenCalled();
});

test('calls onClose when Escape is pressed', () => {
  const onClose = vi.fn();
  render(
    <ModalShell title="Modal" onClose={onClose}>
      <p>content</p>
    </ModalShell>
  );
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledOnce();
});

test('moves focus into the modal and restores it on close', () => {
  const opener = document.createElement('button');
  opener.textContent = 'Open modal';
  document.body.appendChild(opener);
  opener.focus();

  const { rerender } = render(
    <ModalShell title="Modal" onClose={vi.fn()}>
      <button>Inside</button>
    </ModalShell>
  );
  expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

  rerender(
    <ModalShell title="Modal" show={false} onClose={vi.fn()}>
      <button>Inside</button>
    </ModalShell>
  );
  expect(opener).toHaveFocus();
  document.body.removeChild(opener);
});

test('keeps Tab focus inside the modal', () => {
  render(
    <ModalShell title="Modal" onClose={vi.fn()} footer={<button>Last action</button>}>
      <button>Middle action</button>
    </ModalShell>
  );

  const close = screen.getByRole('button', { name: 'Close' });
  const last = screen.getByRole('button', { name: 'Last action' });

  last.focus();
  fireEvent.keyDown(window, { key: 'Tab' });
  expect(close).toHaveFocus();

  fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
  expect(last).toHaveFocus();
});

test('does not render when show is false', () => {
  render(
    <ModalShell title="Modal" show={false} onClose={vi.fn()}>
      <p>hidden</p>
    </ModalShell>
  );
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('renders with custom maxWidth', () => {
  const { container } = render(
    <ModalShell title="Modal" onClose={vi.fn()} maxWidth="900px">
      <p>content</p>
    </ModalShell>
  );
  expect(container.querySelector('.osrs-modal-panel')).toHaveStyle({ maxWidth: '900px' });
});

test('applies bodyClassName to the body div', () => {
  const { container } = render(
    <ModalShell title="Modal" onClose={vi.fn()} bodyClassName="my-body">
      <p>content</p>
    </ModalShell>
  );
  expect(container.querySelector('.osrs-modal-body.my-body')).toBeInTheDocument();
});

test('renders ReactNode title', () => {
  render(
    <ModalShell title={<h2>Rich Title</h2>} onClose={vi.fn()}>
      <p>content</p>
    </ModalShell>
  );
  expect(screen.getByRole('heading', { name: 'Rich Title' })).toBeInTheDocument();
});

// ─── ModalButton ─────────────────────────────────────────────────────────────

test('renders with correct variant class', () => {
  const { container } = render(<ModalButton variant="success">Save</ModalButton>);
  expect(container.querySelector('.osrs-modal-btn--success')).toBeInTheDocument();
});

test('renders with small size class', () => {
  const { container } = render(<ModalButton size="small">-</ModalButton>);
  expect(container.querySelector('.osrs-modal-btn--small')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const onClick = vi.fn();
  render(<ModalButton onClick={onClick}>Click me</ModalButton>);
  fireEvent.click(screen.getByRole('button', { name: 'Click me' }));
  expect(onClick).toHaveBeenCalledOnce();
});

test('is disabled when disabled prop is set', () => {
  render(<ModalButton disabled>Disabled</ModalButton>);
  expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
});
