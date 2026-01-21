// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import React from 'react';
import styles from './Modal.module.css';

type ConfirmationVariant = 'stalin' | 'danger' | 'primary';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: ConfirmationVariant;
  nested?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'primary',
  nested = false,
}) => {
  const getHeaderColor = (): string => {
    switch (variant) {
      case 'stalin':
        return 'var(--color-steel-blue)';
      case 'danger':
        return 'var(--color-blood-burgundy)';
      case 'primary':
      default:
        return 'var(--color-soviet-red)';
    }
  };

  const getConfirmButtonClass = (): string => {
    switch (variant) {
      case 'stalin':
        return styles.stalinButton;
      case 'danger':
        return styles.dangerButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  const overlayStyle: React.CSSProperties = {
    zIndex: nested ? 1100 : 1000,
    background: nested ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)',
  };

  const messageStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '24px',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  return (
    <div className={styles.modalOverlay} style={overlayStyle} onClick={handleOverlayClick}>
      <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={handleModalClick}>
        <div className={styles.header} style={{ background: getHeaderColor() }}>
          <h2>{title}</h2>
        </div>

        <div className={styles.content}>
          <p style={messageStyle}>{message}</p>

          <div style={buttonContainerStyle}>
            <button onClick={onCancel} className={styles.disabledButton}>
              {cancelText}
            </button>
            <button onClick={onConfirm} className={getConfirmButtonClass()}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
