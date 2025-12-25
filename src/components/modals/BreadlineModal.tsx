// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSpaceById } from '../../data/spaces';
import styles from './BreadlineModal.module.css';

interface BreadlineContribution {
  playerId: string;
  type: 'rubles' | 'property' | 'favour' | 'refuse';
  propertyId?: string;
}

interface BreadlineModalProps {
  landingPlayerId: string;
  onClose: () => void;
}

export function BreadlineModal({ landingPlayerId, onClose }: BreadlineModalProps) {
  const players = useGameStore((state) => state.players);
  const properties = useGameStore((state) => state.properties);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const transferProperty = useGameStore((state) => state.transferProperty);
  const addLogEntry = useGameStore((state) => state.addLogEntry);
  const setPendingAction = useGameStore((state) => state.setPendingAction);
  const setTurnPhase = useGameStore((state) => state.setTurnPhase);

  const [contributions, setContributions] = useState<BreadlineContribution[]>([]);
  const [currentContributorIndex, setCurrentContributorIndex] = useState(0);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  const landingPlayer = players.find((p) => p.id === landingPlayerId);
  const eligibleContributors = players.filter((p) => !p.isStalin && p.id !== landingPlayerId && !p.inGulag && !p.isEliminated);
  const currentContributor = eligibleContributors[currentContributorIndex];

  if (!landingPlayer) {
    return null;
  }

  const currentContributorProperties = properties.filter((p) => p.custodianId === currentContributor.id && !p.mortgaged);

  const handleContribution = (type: 'rubles' | 'property' | 'favour' | 'refuse') => {
    if (type === 'rubles') {
      // Check if player can afford
      if (currentContributor.rubles < 50) {
        alert(`${currentContributor.name} does not have ₽50 to contribute!`);
        return;
      }

      // Transfer rubles
      updatePlayer(currentContributor.id, { rubles: currentContributor.rubles - 50 });
      updatePlayer(landingPlayerId, { rubles: landingPlayer.rubles + 50 });

      addLogEntry({
        type: 'payment',
        message: `${currentContributor.name} contributed ₽50 to ${landingPlayer.name} at the Breadline`,
        playerId: currentContributor.id,
      });

      setContributions([...contributions, { playerId: currentContributor.id, type: 'rubles' }]);
    } else if (type === 'property') {
      if (!selectedPropertyId) {
        alert('Please select a property to contribute!');
        return;
      }

      // Transfer property
      transferProperty(selectedPropertyId, landingPlayerId);

      const property = properties.find((p) => p.spaceId === parseInt(selectedPropertyId));
      const propertySpace = property ? getSpaceById(property.spaceId) : null;

      addLogEntry({
        type: 'property',
        message: `${currentContributor.name} contributed ${propertySpace?.name ?? 'a property'} to ${landingPlayer.name} at the Breadline`,
        playerId: currentContributor.id,
      });

      setContributions([...contributions, { playerId: currentContributor.id, type: 'property', propertyId: selectedPropertyId }]);
      setSelectedPropertyId('');
    } else if (type === 'favour') {
      // Track favour as a custom player attribute (stored in player state)
      const updatedOwesFavour = [...currentContributor.owesFavourTo, landingPlayerId];
      updatePlayer(currentContributor.id, { owesFavourTo: updatedOwesFavour });

      addLogEntry({
        type: 'system',
        message: `${currentContributor.name} owes a favour to ${landingPlayer.name} from the Breadline`,
        playerId: currentContributor.id,
      });

      setContributions([...contributions, { playerId: currentContributor.id, type: 'favour' }]);
    } else {
      // type === 'refuse'
      addLogEntry({
        type: 'system',
        message: `${currentContributor.name} REFUSED to contribute at the Breadline - subject to denouncement!`,
        playerId: currentContributor.id,
      });

      setContributions([...contributions, { playerId: currentContributor.id, type: 'refuse' }]);
    }

    // Move to next contributor or show results
    if (currentContributorIndex < eligibleContributors.length - 1) {
      setCurrentContributorIndex(currentContributorIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleFinish = () => {
    setPendingAction(null);
    setTurnPhase('post-turn');
    onClose();
  };

  if (showResults) {
    const rublesReceived = contributions.filter((c) => c.type === 'rubles').length * 50;
    const propertiesReceived = contributions.filter((c) => c.type === 'property');
    const favoursReceived = contributions.filter((c) => c.type === 'favour');
    const refusals = contributions.filter((c) => c.type === 'refuse');

    return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
          <div className={styles.header}>
            <span className={styles.icon}>🍞</span>
            <h2 className={styles.title}>Breadline Results</h2>
            <span className={styles.icon}>🍞</span>
          </div>

          <div className={styles.content}>
            <p className={styles.description}>
              {landingPlayer.name} received the following from the Breadline:
            </p>

            <div className={styles.results}>
              {rublesReceived > 0 && (
                <div className={styles.resultItem}>
                  <span className={styles.resultIcon}>💰</span>
                  <span>₽{rublesReceived} in Rubles</span>
                </div>
              )}

              {propertiesReceived.length > 0 && (
                <div className={styles.resultItem}>
                  <span className={styles.resultIcon}>🏭</span>
                  <span>{propertiesReceived.length} {propertiesReceived.length === 1 ? 'Property' : 'Properties'}</span>
                </div>
              )}

              {favoursReceived.length > 0 && (
                <div className={styles.resultItem}>
                  <span className={styles.resultIcon}>🤝</span>
                  <span>{favoursReceived.length} {favoursReceived.length === 1 ? 'Favour' : 'Favours'} owed</span>
                </div>
              )}

              {refusals.length > 0 && (
                <div className={styles.refusalWarning}>
                  <span className={styles.warningIcon}>⚠</span>
                  <div>
                    <strong>{refusals.length} {refusals.length === 1 ? 'player' : 'players'} refused to contribute!</strong>
                    <p className={styles.refusalText}>
                      {refusals.map((r) => {
                        const refuser = players.find((p) => p.id === r.playerId);
                        return refuser?.name;
                      }).join(', ')} can now be denounced by any player.
                    </p>
                  </div>
                </div>
              )}

              {contributions.length === 0 && (
                <div className={styles.noContributions}>
                  <p>No one contributed to the Breadline (all players in Gulag or only Stalin remains).</p>
                </div>
              )}
            </div>

            <button className={styles.finishButton} onClick={handleFinish}>
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No eligible contributors - show results immediately
  if (eligibleContributors.length === 0) {
    return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
          <div className={styles.header}>
            <span className={styles.icon}>🍞</span>
            <h2 className={styles.title}>Breadline</h2>
            <span className={styles.icon}>🍞</span>
          </div>

          <div className={styles.content}>
            <p className={styles.description}>
              No other players are available to contribute to the Breadline.
            </p>

            <button className={styles.finishButton} onClick={handleFinish}>
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); }}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.header}>
          <span className={styles.icon}>🍞</span>
          <h2 className={styles.title}>Breadline Contribution</h2>
          <span className={styles.icon}>🍞</span>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            <strong>{currentContributor.name}</strong>, {landingPlayer.name} has arrived at the Breadline.
            All comrades must contribute ONE item: ₽50, a property, or a favour.
          </p>

          <p className={styles.warning}>
            ⚠ Refusing to contribute makes you subject to denouncement by any player!
          </p>

          <div className={styles.contributorInfo}>
            <div className={styles.infoRow}>
              <span>Your Balance:</span>
              <span className={styles.balance}>₽{currentContributor.rubles}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Your Properties:</span>
              <span>{currentContributorProperties.length}</span>
            </div>
          </div>

          <div className={styles.contributionOptions}>
            <button
              className={styles.optionButton}
              onClick={() => { handleContribution('rubles'); }}
              disabled={currentContributor.rubles < 50}
            >
              <div className={styles.optionTitle}>💰 Give ₽50</div>
              {currentContributor.rubles < 50 && (
                <div className={styles.optionDisabled}>Insufficient funds</div>
              )}
            </button>

            {currentContributorProperties.length > 0 && (
              <div className={styles.propertyOption}>
                <div className={styles.optionTitle}>🏭 Give a Property</div>
                <select
                  className={styles.propertySelect}
                  value={selectedPropertyId}
                  onChange={(e) => { setSelectedPropertyId(e.target.value); }}
                >
                  <option value="">Select property...</option>
                  {currentContributorProperties.map((prop) => {
                    const space = getSpaceById(prop.spaceId);
                    return (
                      <option key={prop.spaceId} value={String(prop.spaceId)}>
                        {space?.name ?? `Property ${String(prop.spaceId)}`}
                      </option>
                    );
                  })}
                </select>
                <button
                  className={styles.propertyButton}
                  onClick={() => { handleContribution('property'); }}
                  disabled={!selectedPropertyId}
                >
                  GIVE SELECTED PROPERTY
                </button>
              </div>
            )}

            <button
              className={styles.optionButton}
              onClick={() => { handleContribution('favour'); }}
            >
              <div className={styles.optionTitle}>🤝 Owe a Favour</div>
              <div className={styles.optionDesc}>You will owe {landingPlayer.name} a favour</div>
            </button>

            <button
              className={`${styles.optionButton} ${styles.refuseButton}`}
              onClick={() => { handleContribution('refuse'); }}
            >
              <div className={styles.optionTitle}>❌ REFUSE</div>
              <div className={styles.optionDesc}>⚠ Subject to denouncement!</div>
            </button>
          </div>

          <div className={styles.progress}>
            Contributor {currentContributorIndex + 1} of {eligibleContributors.length}
          </div>
        </div>
      </div>
    </div>
  );
}
