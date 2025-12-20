import { useGameStore } from '../../store/gameStore';
import { getSpaceById } from '../../data/spaces';
import { PROPERTY_GROUPS } from '../../data/properties';
import styles from './UtilityModal.module.css';

interface UtilityModalProps {
  spaceId: number;
  payerId: string;
  diceTotal: number;
  onClose: () => void;
}

export function UtilityModal({ spaceId, payerId, diceTotal, onClose }: UtilityModalProps) {
  const players = useGameStore((state) => state.players);
  const properties = useGameStore((state) => state.properties);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const addLogEntry = useGameStore((state) => state.addLogEntry);
  const setPendingAction = useGameStore((state) => state.setPendingAction);
  const setTurnPhase = useGameStore((state) => state.setTurnPhase);

  const space = getSpaceById(spaceId);
  const property = properties.find((p) => p.spaceId === spaceId);
  const payer = players.find((p) => p.id === payerId);
  const controller = property?.custodianId
    ? players.find((p) => p.id === property.custodianId)
    : null;

  if (!space || !property || !payer || !controller) {
    return null;
  }

  // Calculate how many utilities the controller owns
  const utilitySpaces = PROPERTY_GROUPS.utility.properties;
  const controlledUtilities = utilitySpaces.filter((utilityId) => {
    const utilityProperty = properties.find((p) => p.spaceId === utilityId);
    return utilityProperty?.custodianId === controller.id;
  }).length;

  // Fee based on utilities owned and dice roll: 1 utility = 4x dice, 2 utilities = 10x dice
  const multiplier = controlledUtilities === 2 ? 10 : 4;
  const fee = diceTotal * multiplier;

  const canAfford = payer.rubles >= fee;

  // Check if controller is Proletariat (secret rule)
  const isProletariatController = controller.rank === 'proletariat';

  const handlePay = () => {
    if (!canAfford) {
      addLogEntry({
        type: 'system',
        message: `${payer.name} cannot pay ₽${fee} utility fee to ${controller.name} (debt system coming in Milestone 5)`,
        playerId: payerId,
      });
    } else {
      // Transfer rubles
      updatePlayer(payerId, { rubles: payer.rubles - fee });
      updatePlayer(controller.id, { rubles: controller.rubles + fee });

      addLogEntry({
        type: 'payment',
        message: `${payer.name} paid ₽${fee} to ${controller.name} for use of ${space.name} (${diceTotal} × ${multiplier})`,
        playerId: payerId,
      });
    }

    setPendingAction(null);
    setTurnPhase('post-turn');
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.icon}>⚙️</span>
          <h2 className={styles.title}>MEANS OF PRODUCTION</h2>
          <span className={styles.icon}>⚙️</span>
        </div>

        <div className={styles.content}>
          <div className={styles.utilityInfo}>
            <h3 className={styles.utilityName}>{space.name}</h3>
            <div className={styles.controller}>
              <span className={styles.label}>Controlled by:</span>
              <span className={styles.value}>{controller.name}</span>
              <span className={styles.rank}>({controller.rank})</span>
            </div>
          </div>

          {isProletariatController && (
            <div className={styles.secretRule}>
              <strong>⚠ SUSPICIOUS ACTIVITY DETECTED:</strong>
              <p>
                A Proletariat controls a Means of Production! This is most irregular...
                All comrades should denounce this counter-revolutionary or face suspicion themselves!
              </p>
              <p className={styles.stalinNote}>
                (Stalin may wish to investigate this matter)
              </p>
            </div>
          )}

          <div className={styles.feeCalculation}>
            <h4 className={styles.calcTitle}>Usage Fee Calculation:</h4>

            <div className={styles.calcRow}>
              <span className={styles.calcLabel}>Your dice roll:</span>
              <span className={styles.calcValue}>{diceTotal}</span>
            </div>

            <div className={styles.calcRow}>
              <span className={styles.calcLabel}>Utilities controlled:</span>
              <span className={styles.calcValue}>{controlledUtilities} of 2</span>
            </div>

            <div className={styles.calcRow}>
              <span className={styles.calcLabel}>Multiplier:</span>
              <span className={styles.calcValue}>×{multiplier}</span>
            </div>

            <div className={styles.calcDivider}></div>

            <div className={styles.calcFormula}>
              {diceTotal} × {multiplier} = ₽{fee}
            </div>
          </div>

          <div className={styles.feeStructure}>
            <h4 className={styles.feeTitle}>Standard Rates:</h4>
            <div className={styles.rateItem}>
              <span>1 Utility controlled:</span>
              <span>Dice roll × 4</span>
            </div>
            <div className={styles.rateItem}>
              <span>2 Utilities controlled:</span>
              <span>Dice roll × 10</span>
            </div>
          </div>

          <div className={styles.feeDue}>
            <span className={styles.feeLabel}>Usage Fee Due:</span>
            <span className={styles.feeValue}>₽{fee}</span>
          </div>

          <div className={styles.payerBalance}>
            <span className={styles.balanceLabel}>Your Balance:</span>
            <span className={`${styles.balanceValue} ${!canAfford ? styles.insufficient : ''}`}>
              ₽{payer.rubles}
            </span>
          </div>

          {!canAfford && (
            <div className={styles.insufficientFunds}>
              <strong>⚠ INSUFFICIENT FUNDS</strong>
              <p>You do not have enough rubles to pay this usage fee.</p>
              <p>(Debt handling will be implemented in Milestone 5)</p>
            </div>
          )}

          <button
            className={styles.payButton}
            onClick={handlePay}
          >
            {canAfford ? `PAY ₽${fee}` : 'ACKNOWLEDGE DEBT'}
          </button>
        </div>
      </div>
    </div>
  );
}
