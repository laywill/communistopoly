// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    title: 'Test Title',
    message: 'Test message',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('should render with title and message', () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render confirm and cancel buttons with correct text', () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when overlay is clicked', () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);

    // Click the first div (overlay) in the body
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onCancel when modal content is clicked', () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);

    // Click the modal content (second child div)
    const overlay = container.firstChild as HTMLElement;
    const modal = overlay.firstChild as HTMLElement;
    fireEvent.click(modal);

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('should render with primary variant by default', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} />);

    const header = container.querySelector('h2')?.parentElement;
    expect(header).toHaveStyle({ background: 'var(--color-soviet-red)' });
  });

  it('should render with stalin variant styling', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} variant="stalin" />);

    const header = container.querySelector('h2')?.parentElement;
    expect(header).toHaveStyle({ background: 'var(--color-steel-blue)' });

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('stalinButton');
  });

  it('should render with danger variant styling', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} variant="danger" />);

    const header = container.querySelector('h2')?.parentElement;
    expect(header).toHaveStyle({ background: 'var(--color-blood-burgundy)' });

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('dangerButton');
  });

  it('should apply nested overlay styling when nested prop is true', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} nested={true} />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveStyle({
      zIndex: '1100',
      background: 'rgba(0, 0, 0, 0.85)',
    });
  });

  it('should apply default overlay styling when nested prop is false', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} nested={false} />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveStyle({
      zIndex: '1000',
      background: 'rgba(0, 0, 0, 0.75)',
    });
  });

  it('should preserve newlines in message with pre-wrap', () => {
    const messageWithNewlines = 'Line 1\nLine 2\nLine 3';
    const { container } = render(<ConfirmationModal {...defaultProps} message={messageWithNewlines} />);

    const messageElement = container.querySelector('p');
    expect(messageElement).toHaveStyle({ whiteSpace: 'pre-wrap' });
    expect(messageElement?.textContent).toBe(messageWithNewlines);
  });

  it('should render multi-line messages correctly', () => {
    const multiLineMessage = 'First line\nSecond line\nThird line';
    const { container } = render(<ConfirmationModal {...defaultProps} message={multiLineMessage} />);

    const messageElement = container.querySelector('p');
    expect(messageElement?.textContent).toBe(multiLineMessage);
  });
});
