import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSpaceById } from '../../data/spaces';
import { canPurchaseProperty } from '../../utils/propertyUtils';
import { COLLECTIVIZATION_LEVELS } from '../../data/properties';
import { StalinPriceSetter } from '../property/StalinPriceSetter';
import styles from './PropertyPurchaseModal.module.css';

interface PropertyPurchaseModalProps {
  spaceId: number;
  playerId: string;
  onClose: () => void;
}

export function PropertyPurchaseModal({ spaceId, playerId, onClose }: PropertyPurchaseModalProps) {
  const players = useGameStore((state) => state.players);
  const properties = useGameStore((state) => state.properties);
  const purchaseProperty = useGameStore((state) => state.purchaseProperty);
  const setPendingAction = useGameStore((state) => state.setPendingAction);
  const addLogEntry = useGameStore((state) => state.addLogEntry);
  const setTurnPhase = useGameStore((state) => state.setTurnPhase);

  const space = getSpaceById(spaceId);
  const player = players.find((p) => p.id === playerId);
  const property = properties.find((p) => p.spaceId === spaceId);

  const [stalinPrice, setStalinPrice] = useState<number | null>(null);
  const [showPlayerDecision, setShowPlayerDecision] = useState(false);

  if (!space || !player || !property || !space.baseCost || !space.group) {
    return null;
  }

  // Check rank restrictions
  const canPurchase = canPurchaseProperty(player, space.group);
  const isUtility = space.group === 'utility';

  const handleStalinPriceSet = (price: number) => {
    setStalinPrice(price);
    setShowPlayerDecision(true);
  };

  const handleAccept = () => {
    if (stalinPrice === null) return;

    if (!canPurchase) {
      // For utilities, player must donate to State
      if (isUtility) {
        const player = players.find((p) => p.id === playerId);
        if (player) {
          useGameStore.getState().updatePlayer(playerId, {
            rubles: player.rubles - stalinPrice,
          });
          useGameStore.getState().adjustTreasury(stalinPrice);
          addLogEntry({
            type: 'payment',
            message: `${player.name} donated ₽${stalinPrice} to the State Treasury (utilities require Commissar+ rank)`,
            playerId,
          });
        }
      } else {
        addLogEntry({
          type: 'system',
          message: `${player.name} cannot become Custodian of ${space.name} - insufficient rank`,
          playerId,
        });
      }
    } else {
      // Purchase the property
      purchaseProperty(playerId, spaceId, stalinPrice);
    }

    setPendingAction(null);
    setTurnPhase('post-turn');
    onClose();
  };

  const handleDecline = () => {
    addLogEntry({
      type: 'system',
      message: `${player.name} declined custodianship of ${space.name}`,
      playerId,
    });

    setPendingAction(null);
    setTurnPhase('post-turn');
    onClose();
  };

  const getRankRestrictionMessage = (): string | null => {
    if (canPurchase) return null;

    switch (space.group) {
      case 'elite':
        return 'Green properties require Party Member rank or higher';
      case 'kremlin':
        return 'Kremlin Complex properties require Inner Circle rank';
      case 'utility':
        return 'Means of Production require Commissar rank or higher. Lower ranks must donate the cost to the State.';
      default:
        return null;
    }
  };

  const rankRestriction = getRankRestrictionMessage();
  const canAfford = player.rubles >= (stalinPrice || space.baseCost);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.icon}>🏭</span>
          <h2 className={styles.title}>STATE PROPERTY TRANSFER</h2>
          <span className={styles.icon}>🏭</span>
        </div>

        <div className={styles.content}>
          {/* Property Details */}
          <div className={styles.propertyInfo}>
            <div
              className={styles.colorBand}
              style={{
                backgroundColor: space.group
                  ? useGameStore.getState().properties.find((p) => p.spaceId === spaceId)
                    ? '#1A1A1A'
                    : '#1A1A1A'
                  : '#1A1A1A',
              }}
            />
            <h3 className={styles.propertyName}>{space.name}</h3>
            <div className={styles.baseQuota}>Base Quota: ₽{space.baseQuota || 'N/A'}</div>

            {/* Collectivization Levels */}
            <div className={styles.improvements}>
              <h4 className={styles.improvementsTitle}>Collectivization Levels:</h4>
              {COLLECTIVIZATION_LEVELS.slice(1).map((level) => (
                <div key={level.level} className={styles.improvementLevel}>
                  <span className={styles.levelStars}>
                    {Array.from({ length: level.level }).map((_, i) => (
                      <span key={i}>{i === 4 ? '★' : '☆'}</span>
                    ))}
                  </span>
                  <span className={styles.levelName}>{level.name}</span>
                  <span className={styles.levelBonus}>+{(level.multiplier - 1) * 100}%</span>
                </div>
              ))}
            </div>

            {/* Special Rule Reminder */}
            {space.specialRule && (
              <div className={styles.specialRule}>
                <strong>⚠ Special Rule:</strong> {space.specialRule}
              </div>
            )}
          </div>

          {/* Rank Restriction */}
          {rankRestriction && (
            <div className={styles.rankRestriction}>
              <strong>⚠ RANK RESTRICTION:</strong> {rankRestriction}
            </div>
          )}

          {/* Stalin Price Setting */}
          {!showPlayerDecision && (
            <div className={styles.stalinSection}>
              <StalinPriceSetter
                baseValue={space.baseCost}
                onPriceSet={handleStalinPriceSet}
              />
            </div>
          )}

          {/* Player Decision */}
          {showPlayerDecision && stalinPrice !== null && (
            <div className={styles.playerDecision}>
              <div className={styles.priceDisplay}>
                <span className={styles.priceLabel}>Stalin's Price:</span>
                <span className={styles.priceValue}>₽{stalinPrice}</span>
              </div>

              <div className={styles.playerBalance}>
                <span className={styles.balanceLabel}>Your Balance:</span>
                <span className={`${styles.balanceValue} ${!canAfford ? styles.insufficient : ''}`}>
                  ₽{player.rubles}
                </span>
              </div>

              <div className={styles.actions}>
                <button className={styles.declineButton} onClick={handleDecline}>
                  DECLINE - Leave for the State
                </button>
                <button
                  className={styles.acceptButton}
                  onClick={handleAccept}
                  disabled={!canAfford || (!canPurchase && !isUtility)}
                >
                  {canPurchase
                    ? 'ACCEPT - Become Custodian'
                    : isUtility
                    ? 'DONATE to State'
                    : 'INSUFFICIENT RANK'}
                </button>
              </div>

              {!canAfford && (
                <div className={styles.insufficientFunds}>
                  Insufficient rubles to accept this offer
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
