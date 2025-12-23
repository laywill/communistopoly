import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './Modal.module.css';

interface GulagEscapeModalProps {
  playerId: string;
}

export const GulagEscapeModal: React.FC<GulagEscapeModalProps> = ({ playerId }) => {
  const { players, dice, rollDice, finishRolling, attemptGulagEscape } = useGameStore();
  const player = players.find((p) => p.id === playerId);
  const [isRolling, setIsRolling] = useState(false);

  if (!player || !player.inGulag) return null;

  const requiredDoubles = getRequiredDoublesText(player.gulagTurns);

  const handleRollForEscape = () => {
    setIsRolling(true);
    rollDice();

    // After dice animation, check result
    setTimeout(() => {
      finishRolling();
      attemptGulagEscape(playerId, 'roll');
      setIsRolling(false);
    }, 1500);
  };

  const handlePayForEscape = () => {
    if (player.rubles >= 500) {
      attemptGulagEscape(playerId, 'pay');
    }
  };

  const handleRequestVoucher = () => {
    attemptGulagEscape(playerId, 'vouch');
  };

  const handleInformOnComrade = () => {
    attemptGulagEscape(playerId, 'inform');
  };

  const handleBribeStalin = () => {
    attemptGulagEscape(playerId, 'bribe');
  };

  const canAffordRehabilitation = player.rubles >= 500;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.header} style={{
          background: 'var(--color-gulag-grey)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>⛓️</span>
          <h2 style={{ margin: 0 }}>THE GULAG</h2>
          <span style={{ fontSize: '24px' }}>⛓️</span>
        </div>

        <div className={styles.content}>
          <div style={{ textAlign: 'center', marginBottom: '16px', padding: '12px', background: 'var(--color-aged-white)', border: '2px solid var(--color-propaganda-black)' }}>
            <p style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-display)', fontSize: '18px' }}>
              COMRADE {player.name.toUpperCase()}
            </p>
            <p style={{ margin: '0', fontSize: '16px', color: 'var(--color-gulag-grey)' }}>
              <strong>Sentence: Day {player.gulagTurns + 1} of ???</strong>
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              Required to escape: <strong>{requiredDoubles}</strong>
            </p>
          </div>

          {/* Option 1: Roll for Escape */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '8px', textTransform: 'uppercase' }}>
              Option 1: Roll for Escape
            </h3>
            <button
              onClick={handleRollForEscape}
              disabled={isRolling}
              className={styles.primaryButton}
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
            >
              {isRolling ? '🎲 ROLLING...' : `🎲 ROLL FOR ESCAPE (Need: ${requiredDoubles})`}
            </button>
            {isRolling && (
              <p style={{ textAlign: 'center', marginTop: '8px' }}>
                Rolled: {dice[0]} and {dice[1]}
              </p>
            )}
          </div>

          {/* Option 2: Pay Rehabilitation Fee */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '8px', textTransform: 'uppercase' }}>
              Option 2: Pay Rehabilitation Fee
            </h3>
            <button
              onClick={handlePayForEscape}
              disabled={!canAffordRehabilitation}
              className={canAffordRehabilitation ? styles.primaryButton : styles.disabledButton}
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
            >
              💰 PAY ₽500 - Rehabilitation (Lose one rank)
            </button>
            {!canAffordRehabilitation && (
              <p style={{ color: 'var(--color-blood-burgundy)', fontSize: '14px', marginTop: '4px' }}>
                Insufficient funds (Need ₽500, have ₽{player.rubles})
              </p>
            )}
          </div>

          {/* Option 3: Request Voucher */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '8px', textTransform: 'uppercase' }}>
              Option 3: Request Voucher
            </h3>
            <button
              onClick={handleRequestVoucher}
              className={styles.primaryButton}
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
            >
              🤝 REQUEST VOUCHER from another player
            </button>
            <p style={{ fontSize: '12px', color: 'var(--color-gulag-grey)', marginTop: '4px' }}>
              Warning: If you commit ANY offence in next 3 rounds, your voucher goes to Gulag too!
            </p>
          </div>

          {/* Option 4: Inform on Another Player */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '8px', textTransform: 'uppercase' }}>
              Option 4: Inform on Comrade
            </h3>
            <button
              onClick={handleInformOnComrade}
              className={styles.dangerButton}
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
            >
              🗣️ INFORM ON ANOTHER PLAYER
            </button>
            <p style={{ fontSize: '12px', color: 'var(--color-gulag-grey)', marginTop: '4px' }}>
              If guilty: you swap places. If innocent: +2 turns to your sentence.
            </p>
          </div>

          {/* Option 5: Bribe Stalin */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '8px', textTransform: 'uppercase' }}>
              Option 5: Bribe the Guards
            </h3>
            <button
              onClick={handleBribeStalin}
              className={styles.stalinButton}
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
            >
              💸 BRIBE STALIN (Min ₽200)
            </button>
            <p style={{ fontSize: '12px', color: 'var(--color-gulag-grey)', marginTop: '4px' }}>
              Stalin may accept or reject. If rejected, money is confiscated as contraband.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function getRequiredDoublesText(turnsInGulag: number): string {
  switch (turnsInGulag) {
    case 0:
      return 'Double 6s';
    case 1:
      return 'Double 5s or 6s';
    case 2:
      return 'Double 4s, 5s, or 6s';
    case 3:
      return 'Double 3s, 4s, 5s, or 6s';
    default:
      return 'Any doubles';
  }
}
