// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './Modal.module.css';
import { ConfirmationModal } from './ConfirmationModal';

interface VoucherRequestModalProps {
  prisonerId: string;
}

export const VoucherRequestModal: React.FC<VoucherRequestModalProps> = ({ prisonerId }) => {
  const { players, stalinPlayerId, createVoucher, setPendingAction, addLogEntry } = useGameStore();
  const prisoner = players.find((p) => p.id === prisonerId);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [voucherResponse, setVoucherResponse] = useState<'accepted' | 'declined' | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!prisoner) return null;

  // Get eligible vouchers (not Stalin, not in Gulag, not eliminated)
  const eligibleVouchers = players.filter(
    (p) => p.id !== prisonerId && p.id !== stalinPlayerId && !p.inGulag && !p.isEliminated && !p.isStalin
  );

  const handleSelectVoucher = (voucherId: string) => {
    setSelectedVoucherId(voucherId);
  };

  const handleSubmitRequest = () => {
    if (!selectedVoucherId) return;

    setRequestSent(true);
    setShowConfirmation(true);
  };

  const handleAcceptVoucher = () => {
    if (!selectedVoucherId) return;

    setShowConfirmation(false);
    setVoucherResponse('accepted');
    createVoucher(prisonerId, selectedVoucherId);
  };

  const handleDeclineVoucher = () => {
    if (!selectedVoucherId) return;

    const voucherPlayer = players.find((p) => p.id === selectedVoucherId);
    if (!voucherPlayer) return;

    setShowConfirmation(false);
    setVoucherResponse('declined');
    addLogEntry({
      type: 'gulag',
      message: `${voucherPlayer.name} declined to vouch for ${prisoner.name}'s release`,
    });

    // Close modal after a delay
    setTimeout(() => {
      setPendingAction(null);
    }, 2000);
  };

  const handleCancel = () => {
    setPendingAction(null);
  };

  if (voucherResponse === 'accepted') {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} style={{ maxWidth: '500px' }}>
          <div className={styles.header} style={{ background: 'var(--color-military-olive)' }}>
            <h2>VOUCHER ACCEPTED</h2>
          </div>
          <div className={styles.content} style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>✓</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-propaganda-black)' }}>
              {prisoner.name} has been released!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-gulag-grey)' }}>
              Your voucher has accepted responsibility for your conduct.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (voucherResponse === 'declined') {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} style={{ maxWidth: '500px' }}>
          <div className={styles.header} style={{ background: 'var(--color-blood-burgundy)' }}>
            <h2>VOUCHER DECLINED</h2>
          </div>
          <div className={styles.content} style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>✗</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-propaganda-black)' }}>
              No one will vouch for you
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-gulag-grey)' }}>
              You remain in the Gulag.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.header}>
          <h2>REQUEST VOUCHER</h2>
        </div>

        <div className={styles.content}>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-propaganda-black)' }}>
            <strong>{prisoner.name}</strong>, select a comrade to request a voucher for your release.
          </p>

          <div
            style={{
              background: 'var(--color-aged-white)',
              border: '2px solid var(--color-warning-amber)',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-propaganda-black)', fontWeight: 'bold' }}>
              ⚠️ WARNING
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', lineHeight: '1.5', color: 'var(--color-propaganda-black)' }}>
              If you commit ANY offence in the next 3 rounds, your voucher will also be sent to the Gulag!
            </p>
          </div>

          {eligibleVouchers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '16px', color: 'var(--color-gulag-grey)' }}>
                No eligible comrades available to vouch for you.
              </p>
              <button onClick={handleCancel} className={styles.primaryButton} style={{ marginTop: '16px' }}>
                Return to Gulag Options
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '14px',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    color: 'var(--color-propaganda-black)',
                  }}
                >
                  Eligible Comrades:
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {eligibleVouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      onClick={() => { handleSelectVoucher(voucher.id); }}
                      style={{
                        padding: '12px',
                        border:
                          selectedVoucherId === voucher.id
                            ? '3px solid var(--color-soviet-red)'
                            : '2px solid var(--color-propaganda-black)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background:
                          selectedVoucherId === voucher.id ? 'var(--color-parchment)' : 'var(--color-aged-white)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: 'var(--color-propaganda-black)' }}>{voucher.name}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-gulag-grey)' }}>
                            Rank: {getRankDisplayName(voucher.rank)} • ₽{voucher.rubles}
                          </p>
                        </div>
                        {selectedVoucherId === voucher.id && (
                          <span style={{ fontSize: '20px', color: 'var(--color-soviet-red)' }}>✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={handleCancel} className={styles.disabledButton} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={!selectedVoucherId || requestSent}
                  className={selectedVoucherId && !requestSent ? styles.primaryButton : styles.disabledButton}
                  style={{ flex: 2 }}
                >
                  {requestSent ? 'Waiting for response...' : 'Request Voucher'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showConfirmation && selectedVoucherId && (() => {
        const voucherPlayer = players.find((p) => p.id === selectedVoucherId);
        if (!voucherPlayer) return null;
        return (
          <ConfirmationModal
            title="VOUCHER REQUEST"
            message={`${voucherPlayer.name}, do you accept to vouch for ${prisoner.name}'s release from the Gulag?\n\nWARNING: If ${prisoner.name} commits ANY offence in the next 3 rounds, YOU will also go to the Gulag!`}
            confirmText="Accept"
            cancelText="Decline"
            variant="primary"
            nested={true}
            onConfirm={handleAcceptVoucher}
            onCancel={handleDeclineVoucher}
          />
        );
      })()}
    </div>
  );
};

function getRankDisplayName(rank: string): string {
  const rankNames: Record<string, string> = {
    proletariat: 'Proletariat',
    partyMember: 'Party Member',
    commissar: 'Commissar',
    innerCircle: 'Inner Circle',
  };
  return rankNames[rank] || rank;
}
