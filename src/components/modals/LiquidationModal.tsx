import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSpaceById } from '../../data/spaces';
import { COLLECTIVIZATION_LEVELS } from '../../data/properties';
import styles from './Modal.module.css';

interface LiquidationModalProps {
  playerId: string;
  amountOwed: number;
  creditorId: string | 'state';
  reason: string;
}

export const LiquidationModal: React.FC<LiquidationModalProps> = ({
  playerId,
  amountOwed,
  creditorId,
  reason,
}) => {
  const {
    players,
    properties,
    updatePlayer,
    updateCollectivizationLevel,
    mortgageProperty,
    setPendingAction,
    addLogEntry,
    createDebt,
    adjustTreasury,
  } = useGameStore();

  const player = players.find((p) => p.id === playerId);
  const [remainingDebt] = useState(amountOwed);
  const [liquidatedValue, setLiquidatedValue] = useState(0);

  if (!player) return null;

  // Get player's properties with their current collectivization levels
  const playerProperties = properties.filter(
    (prop) => prop.custodianId === playerId
  );

  // Calculate sellable improvements value (50₽ per regular level, 100₽ for palace)
  const getImprovementValue = (collectivizationLevel: number): number => {
    if (collectivizationLevel === 0) return 0;
    if (collectivizationLevel === 5) {
      // Palace (level 5) sells for 100₽, plus 4 regular levels at 50₽ each
      return 100 + (4 * 50);
    }
    // Regular levels sell for 50₽ each
    return collectivizationLevel * 50;
  };

  // Calculate mortgage value (50% of base cost)
  const getMortgageValue = (spaceId: number): number => {
    const space = getSpaceById(spaceId);
    return space?.baseCost ? Math.floor(space.baseCost * 0.5) : 0;
  };

  // Get total available funds through liquidation
  const getTotalAvailableFunds = (): number => {
    let total = player.rubles;

    playerProperties.forEach((prop) => {
      // Add improvement values
      total += getImprovementValue(prop.collectivizationLevel);

      // Add mortgage value if not already mortgaged
      if (!prop.mortgaged) {
        total += getMortgageValue(prop.spaceId);
      }
    });

    return total;
  };

  const totalAvailable = getTotalAvailableFunds();

  const handleSellImprovement = (spaceId: number) => {
    const property = properties.find((p) => p.spaceId === spaceId);
    if (!property || property.collectivizationLevel === 0) return;

    const space = getSpaceById(spaceId);
    if (!space) return;

    // Sell one level of improvement
    let sellValue = 0;
    const newLevel = property.collectivizationLevel - 1;

    if (property.collectivizationLevel === 5) {
      // Selling palace gives 100₽
      sellValue = 100;
    } else {
      // Selling regular level gives 50₽
      sellValue = 50;
    }

    // Update property level
    updateCollectivizationLevel(spaceId, newLevel);

    // Add funds to player
    updatePlayer(playerId, {
      rubles: player.rubles + sellValue,
    });

    setLiquidatedValue(liquidatedValue + sellValue);

    addLogEntry({
      type: 'property',
      message: `${player.name} sold improvements on ${space.name} for ₽${sellValue}`,
      playerId,
    });

    // Check if debt is now paid
    if (player.rubles + sellValue >= remainingDebt) {
      handlePayDebt(player.rubles + sellValue);
    }
  };

  const handleMortgageProperty = (spaceId: number) => {
    const property = properties.find((p) => p.spaceId === spaceId);
    if (!property || property.mortgaged || property.collectivizationLevel > 0) return;

    const space = getSpaceById(spaceId);
    if (!space) return;

    const mortgageValue = getMortgageValue(spaceId);

    // Mortgage the property
    mortgageProperty(spaceId);

    // Add funds to player
    updatePlayer(playerId, {
      rubles: player.rubles + mortgageValue,
    });

    setLiquidatedValue(liquidatedValue + mortgageValue);

    addLogEntry({
      type: 'property',
      message: `${player.name} mortgaged ${space.name} for ₽${mortgageValue}`,
      playerId,
    });

    // Check if debt is now paid
    if (player.rubles + mortgageValue >= remainingDebt) {
      handlePayDebt(player.rubles + mortgageValue);
    }
  };

  const handlePayDebt = (currentRubles: number = player.rubles) => {
    if (currentRubles < remainingDebt) return;

    // Pay the debt
    updatePlayer(playerId, {
      rubles: currentRubles - remainingDebt,
      debt: null,
      debtCreatedAtRound: null,
    });

    // If creditor is a player, give them the money
    if (creditorId !== 'state') {
      const creditor = players.find((p) => p.id === creditorId);
      if (creditor) {
        updatePlayer(creditorId, {
          rubles: creditor.rubles + remainingDebt,
        });
      }
    } else {
      // If creditor is state, add to treasury
      adjustTreasury(remainingDebt);
    }

    const creditorName = creditorId === 'state' ? 'the State' : players.find((p) => p.id === creditorId)?.name;

    addLogEntry({
      type: 'payment',
      message: `${player.name} paid ₽${remainingDebt} to ${creditorName} by liquidating assets`,
      playerId,
    });

    setPendingAction(null);
  };

  const handleCannotPay = () => {
    // Create debt if total available funds can cover it
    if (totalAvailable >= remainingDebt) {
      // Player chose not to liquidate, create debt
      createDebt(playerId, creditorId, remainingDebt, reason);

      addLogEntry({
        type: 'payment',
        message: `${player.name} chose not to liquidate assets. Debt of ₽${remainingDebt} created. Must pay within one round!`,
        playerId,
      });
    } else {
      // Insufficient assets, create debt anyway (will lead to Gulag)
      createDebt(playerId, creditorId, remainingDebt, reason);

      addLogEntry({
        type: 'payment',
        message: `${player.name} has insufficient assets to pay ₽${remainingDebt}. Debt created - face Gulag if not paid within one round!`,
        playerId,
      });
    }

    setPendingAction(null);
  };

  const creditorName = creditorId === 'state' ? 'the State' : players.find((p) => p.id === creditorId)?.name;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '700px' }}>
        <div className={styles.header} style={{ background: 'var(--color-blood-burgundy)' }}>
          <h2>⚠️ LIQUIDATION REQUIRED ⚠️</h2>
        </div>

        <div className={styles.content}>
          {/* Debt Summary */}
          <div
            style={{
              background: 'var(--color-aged-white)',
              border: '3px solid var(--color-blood-burgundy)',
              padding: '16px',
              marginBottom: '20px',
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-gulag-grey)' }}>
                  Amount Owed to {creditorName}:
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: 'var(--color-blood-burgundy)' }}>
                  ₽{remainingDebt}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-gulag-grey)' }}>
                  Current Rubles:
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: player.rubles >= remainingDebt ? 'var(--color-military-olive)' : 'var(--color-soviet-red)' }}>
                  ₽{player.rubles}
                </p>
              </div>
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: '13px', fontStyle: 'italic' }}>
              Reason: {reason}
            </p>
          </div>

          {/* Current funds sufficient */}
          {player.rubles >= remainingDebt && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-military-olive)' }}>
                You have sufficient rubles to pay this debt!
              </p>
              <button onClick={() => { handlePayDebt(); }} className={styles.primaryButton}>
                Pay ₽{remainingDebt}
              </button>
            </div>
          )}

          {/* Need to liquidate assets */}
          {player.rubles < remainingDebt && (
            <>
              <div
                style={{
                  background: 'rgba(196, 30, 58, 0.1)',
                  border: '2px solid var(--color-soviet-red)',
                  padding: '12px',
                  marginBottom: '20px',
                  borderRadius: '4px',
                }}
              >
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                  ⚠️ Insufficient Rubles - Liquidate Assets or Face Consequences
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', lineHeight: '1.5' }}>
                  Sell improvements (50₽ per level, 100₽ for Palace) or mortgage properties (50% of base cost).
                  If you cannot pay, a debt will be created and you must pay within one round or face the Gulag!
                </p>
              </div>

              {/* Available Assets Summary */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: 0, textTransform: 'uppercase' }}>
                    Your Assets
                  </h3>
                  <div style={{ fontSize: '14px' }}>
                    <span style={{ color: 'var(--color-gulag-grey)' }}>Total Available: </span>
                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: totalAvailable >= remainingDebt ? 'var(--color-military-olive)' : 'var(--color-blood-burgundy)' }}>
                      ₽{totalAvailable}
                    </span>
                  </div>
                </div>

                {playerProperties.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', background: 'var(--color-aged-white)', borderRadius: '4px' }}>
                    <p style={{ fontSize: '16px', color: 'var(--color-gulag-grey)' }}>
                      You have no properties to liquidate.
                    </p>
                  </div>
                )}

                {/* Property List */}
                {playerProperties.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                    {playerProperties.map((property) => {
                      const space = getSpaceById(property.spaceId);
                      if (!space) return null;

                      const mortgageValue = getMortgageValue(property.spaceId);
                      const canSellImprovement = property.collectivizationLevel > 0;
                      const canMortgage = !property.mortgaged && property.collectivizationLevel === 0;

                      return (
                        <div
                          key={property.spaceId}
                          style={{
                            padding: '16px',
                            border: '2px solid var(--color-propaganda-black)',
                            borderRadius: '4px',
                            background: property.mortgaged ? 'var(--color-gulag-grey)' : 'var(--color-aged-white)',
                            opacity: property.mortgaged ? 0.6 : 1,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                {space.name}
                              </h4>
                              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-gulag-grey)' }}>
                                Base Cost: ₽{space.baseCost} • Collectivization: {COLLECTIVIZATION_LEVELS[property.collectivizationLevel]?.name}
                              </p>
                              {property.mortgaged && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-blood-burgundy)' }}>
                                  MORTGAGED
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canSellImprovement && (
                              <button
                                onClick={() => { handleSellImprovement(property.spaceId); }}
                                className={styles.primaryButton}
                                style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
                              >
                                Sell 1 Level (₽{property.collectivizationLevel === 5 ? '100' : '50'})
                              </button>
                            )}

                            {canMortgage && (
                              <button
                                onClick={() => { handleMortgageProperty(property.spaceId); }}
                                className={styles.dangerButton}
                                style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
                              >
                                Mortgage (₽{mortgageValue})
                              </button>
                            )}

                            {!canSellImprovement && !canMortgage && (
                              <div style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '12px', color: 'var(--color-gulag-grey)' }}>
                                {property.mortgaged ? 'Already Mortgaged' : 'No liquidation options'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={handleCannotPay}
                  className={styles.disabledButton}
                  style={{ flex: 1 }}
                >
                  Cannot Pay - Create Debt
                </button>

                {player.rubles >= remainingDebt && (
                  <button
                    onClick={() => { handlePayDebt(); }}
                    className={styles.primaryButton}
                    style={{ flex: 1 }}
                  >
                    Pay Debt Now (₽{remainingDebt})
                  </button>
                )}
              </div>

              {totalAvailable < remainingDebt && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(114, 47, 55, 0.2)', border: '2px solid var(--color-blood-burgundy)', borderRadius: '4px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--color-blood-burgundy)' }}>
                    ⚠️ WARNING: Even liquidating all assets won&apos;t cover this debt. You will face the Gulag if not paid within one round!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
