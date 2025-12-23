import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSpaceById } from '../../data/spaces';
import { calculateQuota } from '../../utils/propertyUtils';
import { PropertyCard } from '../property/PropertyCard';
import styles from './QuotaPaymentModal.module.css';

interface QuotaPaymentModalProps {
  spaceId: number;
  payerId: string;
  onClose: () => void;
}

export function QuotaPaymentModal({ spaceId, payerId, onClose }: QuotaPaymentModalProps) {
  const players = useGameStore((state) => state.players);
  const properties = useGameStore((state) => state.properties);
  const payQuota = useGameStore((state) => state.payQuota);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const addLogEntry = useGameStore((state) => state.addLogEntry);
  const setPendingAction = useGameStore((state) => state.setPendingAction);
  const setTurnPhase = useGameStore((state) => state.setTurnPhase);

  const [hasAnnounced, setHasAnnounced] = useState(false);

  const space = getSpaceById(spaceId);
  const property = properties.find((p) => p.spaceId === spaceId);
  const payer = players.find((p) => p.id === payerId);
  const custodian = property?.custodianId
    ? players.find((p) => p.id === property.custodianId)
    : null;

  if (!space || !property || !payer || !custodian) {
    return null;
  }

  // Check if this is a Collective Farm
  const isCollectiveFarm = space.group === 'collective';

  // Calculate quota
  let quota = calculateQuota(property, properties, payer);

  // If Collective Farm and custodian hasn't announced, halve the quota
  if (isCollectiveFarm && !hasAnnounced) {
    quota = Math.floor(quota / 2);
  }

  const canAfford = payer.rubles >= quota;

  const handleAnnouncement = () => {
    setHasAnnounced(true);
    addLogEntry({
      type: 'system',
      message: `${custodian?.name} announces: "The harvest is bountiful!"`,
      playerId: custodian?.id,
    });
  };

  const handlePay = () => {
    if (!canAfford) {
      // Check if Industrial Centers - conscript labour (skip next turn)
      if (space.group === 'industrial') {
        updatePlayer(payerId, { skipNextTurn: true });
        addLogEntry({
          type: 'system',
          message: `${payer.name} cannot pay ₽${quota} - conscripted for labour! Will miss next turn.`,
          playerId: payerId,
        });
        setPendingAction(null);
        setTurnPhase('post-turn');
        onClose();
      } else {
        // Trigger liquidation modal
        setPendingAction({
          type: 'liquidation-required',
          data: {
            playerId: payerId,
            amountOwed: quota,
            creditorId: custodian.id,
            reason: `Quota payment for ${space.name}`,
          },
        });
      }
    } else {
      payQuota(payerId, custodian.id, quota);
      setPendingAction(null);
      setTurnPhase('post-turn');
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>PRODUCTIVITY QUOTA DUE</h2>
        </div>

        <div className={styles.content}>
          <PropertyCard property={property} showCurrentQuota />

          <div className={styles.custodianInfo}>
            <span className={styles.label}>Custodian:</span>
            <span className={styles.value}>{custodian.name}</span>
          </div>

          {isCollectiveFarm && !hasAnnounced && (
            <div className={styles.collectiveFarmNotice}>
              <p className={styles.noticeText}>
                ⚠ Collective Farm Rule: The custodian must announce &quot;The harvest is bountiful!&quot; to collect full quota.
              </p>
              <p className={styles.noticeText}>
                Without announcement, quota is halved.
              </p>
              <button className={styles.announceButton} onClick={handleAnnouncement}>
                {custodian.name}: &quot;THE HARVEST IS BOUNTIFUL!&quot;
              </button>
            </div>
          )}

          <div className={styles.quotaDue}>
            <span className={styles.quotaLabel}>Quota Due:</span>
            <span className={styles.quotaValue}>₽{quota}</span>
          </div>

          <div className={styles.payerBalance}>
            <span className={styles.balanceLabel}>Your Balance:</span>
            <span className={`${styles.balanceValue} ${!canAfford ? styles.insufficient : ''}`}>
              ₽{payer.rubles}
            </span>
          </div>

          {!canAfford && (
            <div className={styles.insufficientFunds}>
              {space.group === 'industrial' ? (
                <>
                  <strong>⚠ INSUFFICIENT FUNDS</strong>
                  <p>Industrial Centers: You will be conscripted for labour and miss your next turn!</p>
                </>
              ) : (
                <>
                  <strong>⚠ INSUFFICIENT FUNDS</strong>
                  <p>You do not have enough rubles to pay this quota.</p>
                  <p>You will need to liquidate assets or face a debt that must be paid within one round.</p>
                </>
              )}
            </div>
          )}

          {space.group === 'elite' && payer.rank === 'proletariat' && (
            <div className={styles.eliteNotice}>
              <strong>Party Elite District:</strong> As a Proletariat, you must pay double quota and salute!
              <div className={styles.salutePrompt}>
                🎖️ *Player must salute the custodian* 🎖️
              </div>
            </div>
          )}

          <button
            className={styles.payButton}
            onClick={handlePay}
          >
            {canAfford ? `PAY ₽${quota}` : 'ACKNOWLEDGE DEBT'}
          </button>
        </div>
      </div>
    </div>
  );
}
