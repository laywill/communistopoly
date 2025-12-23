import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './Modal.module.css';

interface BribeStalinModalProps {
  playerId: string;
  reason: string;
}

export const BribeStalinModal: React.FC<BribeStalinModalProps> = ({ playerId, reason }) => {
  const { players, submitBribe, setPendingAction } = useGameStore();
  const player = players.find((p) => p.id === playerId);
  const [bribeAmount, setBribeAmount] = useState(200);
  const [submitted, setSubmitted] = useState(false);

  if (!player) return null;

  const minBribe = 200;
  const maxBribe = player.rubles;

  const handleSubmit = () => {
    if (bribeAmount < minBribe || bribeAmount > maxBribe) return;

    submitBribe(playerId, bribeAmount, reason);
    setSubmitted(true);

    // Auto-close after showing confirmation
    setTimeout(() => {
      setPendingAction(null);
    }, 2000);
  };

  const handleCancel = () => {
    setPendingAction(null);
  };

  if (submitted) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} style={{ maxWidth: '500px' }}>
          <div className={styles.header} style={{ background: 'var(--color-steel-blue)' }}>
            <h2 style={{ color: 'var(--color-kremlin-gold)' }}>BRIBE SUBMITTED</h2>
          </div>
          <div className={styles.content} style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>💸</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Your bribe of ₽{bribeAmount} has been submitted to Stalin
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-gulag-grey)' }}>
              Stalin will decide whether to accept or reject your offering...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '500px' }}>
        <div className={styles.header} style={{ background: 'var(--color-steel-blue)' }}>
          <h2 style={{ color: 'var(--color-kremlin-gold)' }}>BRIBE THE GUARDS</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9, color: 'var(--color-kremlin-gold)' }}>
            Submit to Stalin
          </p>
        </div>

        <div className={styles.content}>
          <div
            style={{
              background: 'var(--color-aged-white)',
              border: '2px solid var(--color-propaganda-black)',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
              Your Financial Situation:
            </p>
            <p style={{ margin: '0', fontSize: '16px', fontFamily: 'var(--font-mono)' }}>
              Current Rubles: <strong>₽{player.rubles}</strong>
            </p>
          </div>

          <div
            style={{
              background: 'var(--color-aged-white)',
              border: '2px solid var(--color-warning-amber)',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '20px',
            }}
          >
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-propaganda-black)', fontWeight: 'bold' }}>
              ⚠️ WARNING
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', lineHeight: '1.5' }}>
              Stalin may accept or reject your bribe. If rejected, the money will be confiscated as &quot;contraband&quot;!
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="bribe-amount"
              style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Bribe Amount (Minimum ₽{minBribe}):
            </label>

            <input
              id="bribe-amount"
              type="range"
              min={minBribe}
              max={maxBribe}
              step={50}
              value={bribeAmount}
              onChange={(e) => setBribeAmount(parseInt(e.target.value))}
              style={{
                width: '100%',
                marginBottom: '8px',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'var(--color-steel-blue)',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--color-kremlin-gold)' }}>Minimum</span>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-kremlin-gold)',
                }}
              >
                ₽{bribeAmount}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-kremlin-gold)' }}>Maximum</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-gulag-grey)' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Purpose:</strong> {getReasonText(reason)}
            </p>
            <p style={{ margin: 0 }}>
              Higher bribes may be more persuasive, but there are no guarantees with Stalin...
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleCancel} className={styles.disabledButton} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={bribeAmount < minBribe || bribeAmount > maxBribe}
              className={bribeAmount >= minBribe && bribeAmount <= maxBribe ? styles.stalinButton : styles.disabledButton}
              style={{ flex: 2 }}
            >
              Submit Bribe to Stalin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getReasonText(reason: string): string {
  const reasons: Record<string, string> = {
    'gulag-escape': 'Release from the Gulag',
    'property-favor': 'Favorable property pricing',
    'rank-promotion': 'Rank advancement',
    'tribunal-influence': 'Tribunal influence',
  };
  return reasons[reason] || reason;
}
