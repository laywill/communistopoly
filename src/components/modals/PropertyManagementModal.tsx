import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSpaceById } from '../../data/spaces';
import { PROPERTY_GROUPS, COLLECTIVIZATION_LEVELS } from '../../data/properties';
import { PropertyGroup } from '../../types/game';
import { ImprovementModal } from './ImprovementModal';
import styles from './PropertyManagementModal.module.css';

interface PropertyManagementModalProps {
  playerId: string;
  onClose: () => void;
}

export function PropertyManagementModal({ playerId, onClose }: PropertyManagementModalProps) {
  const players = useGameStore((state) => state.players);
  const properties = useGameStore((state) => state.properties);
  const mortgageProperty = useGameStore((state) => state.mortgageProperty);
  const unmortgageProperty = useGameStore((state) => state.unmortgageProperty);

  const [showImprovements, setShowImprovements] = useState(false);

  const player = players.find((p) => p.id === playerId);

  if (!player) {
    return null;
  }

  // Group player's properties by color group
  const groupedProperties: Record<PropertyGroup, number[]> = {
    siberian: [], collective: [], industrial: [], ministry: [],
    military: [], media: [], elite: [], kremlin: [],
    railroad: [], utility: []
  };

  player.properties.forEach((propId) => {
    const spaceId = parseInt(propId);
    const space = getSpaceById(spaceId);
    if (space?.group) {
      groupedProperties[space.group].push(spaceId);
    }
  });

  // Check if player owns complete group
  const ownsCompleteGroup = (group: PropertyGroup): boolean => {
    const groupInfo = PROPERTY_GROUPS[group];

    const ownedInGroup = groupedProperties[group];
    return ownedInGroup.length === groupInfo.properties.length;
  };

  const handleMortgage = (spaceId: number) => {
    const space = getSpaceById(spaceId);
    const property = properties.find((p) => p.spaceId === spaceId);

    if (!property || !space) return;

    if (property.mortgaged) {
      unmortgageProperty(spaceId, playerId);
    } else {
      if (confirm(`Mortgage ${space.name} for ₽${String(Math.floor((space.baseCost ?? 0) * 0.5))}?`)) {
        mortgageProperty(spaceId);
      }
    }
  };

  if (showImprovements) {
    return <ImprovementModal playerId={playerId} onClose={() => { setShowImprovements(false); }} />;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.header}>
          <span className={styles.icon}>🏛️</span>
          <h2 className={styles.title}>PROPERTY MANAGEMENT</h2>
          <span className={styles.icon}>🏛️</span>
        </div>

        <div className={styles.content}>
          <div className={styles.playerInfo}>
            <div className={styles.playerDetails}>
              <span className={styles.playerName}>{player.name}</span>
              <span className={styles.playerRank}>Rank: {player.rank}</span>
            </div>
            <span className={styles.playerRubles}>₽{player.rubles}</span>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.improveButton}
              onClick={() => { setShowImprovements(true); }}
            >
              COLLECTIVIZE PROPERTIES
            </button>
          </div>

          <div className={styles.propertyGroups}>
            {Object.entries(groupedProperties).map(([group, spaceIds]) => {
              if (spaceIds.length === 0) return null;

              const groupInfo = PROPERTY_GROUPS[group as PropertyGroup];
              const isComplete = ownsCompleteGroup(group as PropertyGroup);

              return (
                <div key={group} className={styles.propertyGroup}>
                  <div
                    className={styles.groupHeader}
                    style={{ backgroundColor: groupInfo.color }}
                  >
                    <span className={styles.groupName}>{groupInfo.name}</span>
                    <span className={styles.groupCount}>
                      {spaceIds.length} / {groupInfo.properties.length}
                      {isComplete && <span className={styles.completeCheck}>✓ COMPLETE</span>}
                    </span>
                  </div>

                  <div className={styles.properties}>
                    {spaceIds.map((spaceId) => {
                      const space = getSpaceById(spaceId);
                      const property = properties.find((p) => p.spaceId === spaceId);

                      if (!space || !property) return null;

                      const levelInfo = COLLECTIVIZATION_LEVELS[property.collectivizationLevel];
                      const mortgageValue = Math.floor((space.baseCost ?? 0) * 0.5);
                      const unmortgageCost = Math.floor((space.baseCost ?? 0) * 0.6);

                      return (
                        <div
                          key={spaceId}
                          className={`${styles.property} ${property.mortgaged ? styles.mortgaged : ''}`}
                        >
                          <div className={styles.propertyHeader}>
                            <span className={styles.propertyName}>{space.name}</span>
                            {property.mortgaged && (
                              <span className={styles.mortgagedBadge}>MORTGAGED</span>
                            )}
                          </div>

                          <div className={styles.propertyDetails}>
                            {space.type === 'property' && (
                              <>
                                <div className={styles.detailRow}>
                                  <span>Base Quota:</span>
                                  <span>₽{space.baseQuota}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span>Level:</span>
                                  <span>
                                    {levelInfo.name}
                                    {property.collectivizationLevel > 0 && (
                                      <span className={styles.stars}>
                                        {Array.from({ length: property.collectivizationLevel }).map((_, i) => (
                                          <span key={i}>{i === 4 ? '★' : '☆'}</span>
                                        ))}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className={styles.detailRow}>
                              <span>Base Value:</span>
                              <span>₽{space.baseCost}</span>
                            </div>
                          </div>

                          {space.type === 'property' && (
                            <button
                              className={styles.mortgageButton}
                              onClick={() => { handleMortgage(spaceId); }}
                              disabled={property.collectivizationLevel > 0 && !property.mortgaged}
                              title={
                                property.collectivizationLevel > 0 && !property.mortgaged
                                  ? 'Cannot mortgage improved property'
                                  : ''
                              }
                            >
                              {property.mortgaged
                                ? `UNMORTGAGE (₽${String(unmortgageCost)})`
                                : `MORTGAGE (₽${String(mortgageValue)})`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {player.properties.length === 0 && (
            <div className={styles.noProperties}>
              You do not have any properties under custodianship.
            </div>
          )}

          <button className={styles.closeButton} onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
