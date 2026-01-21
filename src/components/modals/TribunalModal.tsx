// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { TribunalPhase, TribunalVerdict } from '../../types/game';
import styles from './Modal.module.css';

export const TribunalModal: React.FC = () => {
  const {
    players,
    activeTribunal,
    advanceTribunalPhase,
    addWitness,
    renderTribunalVerdict,
  } = useGameStore();

  const [timeRemaining, setTimeRemaining] = useState(30);

  // Timer effect
  useEffect(() => {
    if (!activeTribunal) return;

    let phaseTime = 30;
    if (activeTribunal.phase === 'witnesses') {
      phaseTime = 15;
    }

    setTimeRemaining(phaseTime);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { clearInterval(interval); };
  }, [activeTribunal]);

  if (!activeTribunal) return null;

  const accuser = players.find((p) => p.id === activeTribunal.accuserId);
  const accused = players.find((p) => p.id === activeTribunal.accusedId);

  // Get eligible witnesses (not accuser, not accused, not Stalin, not in Gulag, not eliminated)
  const eligibleWitnesses = players.filter(
    (p) =>
      p.id !== activeTribunal.accuserId &&
      p.id !== activeTribunal.accusedId &&
      !p.isStalin &&
      !p.inGulag &&
      !p.isEliminated &&
      !activeTribunal.witnessesFor.includes(p.id) &&
      !activeTribunal.witnessesAgainst.includes(p.id)
  );

  const getPhaseInstructions = (): string => {
    switch (activeTribunal.phase) {
      case 'accusation':
        return `${accuser?.name ?? 'Accuser'}, you have 30 seconds to verbally present your case against ${accused?.name ?? 'Accused'}.`;
      case 'defence':
        return `${accused?.name ?? 'Accused'}, you have 30 seconds to verbally defend yourself.`;
      case 'witnesses':
        return 'Witnesses may now speak for 15 seconds each. Click the buttons below to indicate support.';
      case 'judgement':
        return 'Stalin must now render judgement.';
      default:
        return '';
    }
  };

  const getWitnessRequirementText = (): string => {
    if (typeof activeTribunal.requiredWitnesses === 'number') {
      if (activeTribunal.requiredWitnesses === 0) {
        return 'No witnesses required';
      }
      return `Requires ${String(activeTribunal.requiredWitnesses)} witness(es)`;
    }
    return 'Requires unanimous player agreement';
  };

  const isWitnessRequirementMet = (): boolean => {
    if (typeof activeTribunal.requiredWitnesses === 'number') {
      return activeTribunal.witnessesFor.length >= activeTribunal.requiredWitnesses;
    }
    // Unanimous: all eligible players must have spoken for accuser
    const allEligiblePlayers = players.filter(
      (p) =>
        p.id !== activeTribunal.accuserId &&
        p.id !== activeTribunal.accusedId &&
        !p.isStalin &&
        !p.inGulag &&
        !p.isEliminated
    );
    return allEligiblePlayers.length > 0 && activeTribunal.witnessesFor.length === allEligiblePlayers.length;
  };

  const handleVerdict = (verdict: TribunalVerdict) => {
    renderTribunalVerdict(verdict);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '700px' }}>
        <div className={styles.header} style={{ background: 'var(--color-blood-burgundy)' }}>
          <h2>⚖️ PEOPLE&apos;S TRIBUNAL ⚖️</h2>
        </div>

        <div className={styles.content}>
          {/* Case Information */}
          <div
            style={{
              background: 'var(--color-aged-white)',
              border: '2px solid var(--color-propaganda-black)',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-gulag-grey)' }}>ACCUSER</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-propaganda-black)' }}>{accuser?.name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-gulag-grey)' }}>ACCUSED</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-propaganda-black)' }}>{accused?.name}</p>
              </div>
            </div>
            <div
              style={{
                background: 'var(--color-parchment)',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid var(--color-gulag-grey)',
              }}
            >
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-gulag-grey)' }}>CRIME</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontStyle: 'italic', color: 'var(--color-propaganda-black)' }}>
                &quot;{activeTribunal.crime}&quot;
              </p>
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-gulag-grey)' }}>
              {getWitnessRequirementText()}
            </div>
          </div>

          {/* Phase Display */}
          <div
            style={{
              background: getPhaseColor(activeTribunal.phase),
              padding: '20px',
              borderRadius: '4px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
              {getPhaseTitle(activeTribunal.phase)}
            </div>
            {activeTribunal.phase !== 'judgement' && (
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: timeRemaining <= 10 ? 'var(--color-blood-burgundy)' : 'var(--color-propaganda-black)',
                  marginBottom: '12px',
                }}
              >
                {timeRemaining}s
              </div>
            )}
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              {getPhaseInstructions()}
            </p>
          </div>

          {/* Witnesses Display */}
          {activeTribunal.phase === 'witnesses' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
                    WITNESSES FOR ACCUSER ({activeTribunal.witnessesFor.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {activeTribunal.witnessesFor.map((witnessId) => {
                      const witness = players.find((p) => p.id === witnessId);
                      return (
                        <div
                          key={witnessId}
                          style={{
                            padding: '8px',
                            background: 'var(--color-military-olive)',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        >
                          {witness?.name}
                        </div>
                      );
                    })}
                    {activeTribunal.witnessesFor.length === 0 && (
                      <div style={{ padding: '8px', color: 'var(--color-gulag-grey)', fontSize: '13px' }}>
                        No witnesses yet
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
                    WITNESSES FOR ACCUSED ({activeTribunal.witnessesAgainst.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {activeTribunal.witnessesAgainst.map((witnessId) => {
                      const witness = players.find((p) => p.id === witnessId);
                      return (
                        <div
                          key={witnessId}
                          style={{
                            padding: '8px',
                            background: 'var(--color-soviet-red)',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        >
                          {witness?.name}
                        </div>
                      );
                    })}
                    {activeTribunal.witnessesAgainst.length === 0 && (
                      <div style={{ padding: '8px', color: 'var(--color-gulag-grey)', fontSize: '13px' }}>
                        No witnesses yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Witness Buttons */}
              {eligibleWitnesses.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>ELIGIBLE WITNESSES:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {eligibleWitnesses.map((witness) => (
                      <div key={witness.id} style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => { addWitness(witness.id, 'for'); }}
                          className={styles.successButton}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          {witness.name} ✓ Accuser
                        </button>
                        <button
                          onClick={() => { addWitness(witness.id, 'against'); }}
                          className={styles.dangerButton}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          {witness.name} ✓ Accused
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Control Buttons (for Stalin) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTribunal.phase === 'accusation' && (
              <button
                onClick={() => { advanceTribunalPhase(); }}
                className={styles.primaryButton}
              >
                START DEFENCE
              </button>
            )}

            {activeTribunal.phase === 'defence' && (
              <button
                onClick={() => { advanceTribunalPhase(); }}
                className={styles.primaryButton}
              >
                CALL WITNESSES
              </button>
            )}

            {activeTribunal.phase === 'witnesses' && (
              <button
                onClick={() => { advanceTribunalPhase(); }}
                className={styles.primaryButton}
              >
                PROCEED TO JUDGEMENT
              </button>
            )}

            {activeTribunal.phase === 'judgement' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ margin: '0 0 12px 0', textAlign: 'center', fontSize: '16px' }}>
                  STALIN&apos;S JUDGEMENT
                </h3>

                {/* Check witness requirement */}
                {!isWitnessRequirementMet() && activeTribunal.requiredWitnesses !== 0 && (
                  <div
                    style={{
                      background: 'var(--color-warning-amber)',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>
                      ⚠️ WITNESS REQUIREMENT NOT MET
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                      {typeof activeTribunal.requiredWitnesses === 'number'
                        ? `Need ${String(activeTribunal.requiredWitnesses)} witness(es) for accuser, currently have ${String(activeTribunal.witnessesFor.length)}`
                        : 'Need unanimous agreement from all players'}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => { handleVerdict('guilty'); }}
                  className={styles.dangerButton}
                  disabled={!isWitnessRequirementMet() && activeTribunal.requiredWitnesses !== 0}
                  style={{ padding: '16px' }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>GUILTY</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Accused → Gulag, Accuser +₽100
                  </div>
                </button>

                <button
                  onClick={() => { handleVerdict('innocent'); }}
                  className={styles.successButton}
                  style={{ padding: '16px' }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>INNOCENT</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Accuser loses 1 rank
                  </div>
                </button>

                <button
                  onClick={() => { handleVerdict('bothGuilty'); }}
                  className={styles.dangerButton}
                  style={{ padding: '16px', background: 'var(--color-blood-burgundy)' }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>BOTH GUILTY</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Both → Gulag
                  </div>
                </button>

                <button
                  onClick={() => { handleVerdict('insufficient'); }}
                  className={styles.disabledButton}
                  style={{ padding: '16px' }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>INSUFFICIENT EVIDENCE</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    No punishment, accused under suspicion
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getPhaseTitle(phase: TribunalPhase): string {
  const titles: Record<TribunalPhase, string> = {
    accusation: 'Accusation',
    defence: 'Defence',
    witnesses: 'Witnesses',
    judgement: 'Judgement',
  };
  return titles[phase];
}

function getPhaseColor(phase: TribunalPhase): string {
  const colors: Record<TribunalPhase, string> = {
    accusation: 'rgba(196, 30, 58, 0.15)',
    defence: 'rgba(52, 144, 72, 0.15)',
    witnesses: 'rgba(212, 168, 75, 0.15)',
    judgement: 'rgba(50, 50, 50, 0.15)',
  };
  return colors[phase];
}
