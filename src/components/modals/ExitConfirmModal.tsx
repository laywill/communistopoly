// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import styles from './ExitConfirmModal.module.css';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ExitConfirmModal = ({ isOpen, onClose, onConfirm }: ExitConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.header}>
          <div className={styles.icon}>☭</div>
          <h2>ABANDON THE REVOLUTION?</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.question}>Are you sure you wish to abandon this game?</p>
          <p className={styles.warning}>All progress will be lost, Comrade.</p>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            CONTINUE PLAYING
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            ABANDON GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
