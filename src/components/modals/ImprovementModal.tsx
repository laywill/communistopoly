// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSpaceById } from '../../data/spaces';
import { PROPERTY_GROUPS, COLLECTIVIZATION_LEVELS, getNextCollectivizationCost } from '../../data/properties';
import { PropertyGroup } from '../../types/game';
import styles from './ImprovementModal.module.css';

interface ImprovementModalProps {
  playerId: string;
  onClose: () => void;
}

export function ImprovementModal({ playerId, onClose }: ImprovementModalProps) {
  const players = useGameStore((state) => state.players);
  const properties = useGameStore((state) => state.properties);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const setCollectivizationLevel = useGameStore((state) => state.setCollectivizationLevel);
  const addLogEntry = useGameStore((state) => state.addLogEntry);

  const [, setSelectedProperty] = useState<number | null>(null);

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
    if (space?.group && space.type === 'property') {
      groupedProperties[space.group].push(spaceId);
    }
  });

  // Check if player owns complete group
  const ownsCompleteGroup = (group: PropertyGroup): boolean => {
    const groupInfo = PROPERTY_GROUPS[group];

    const ownedInGroup = groupedProperties[group];
    return ownedInGroup.length === groupInfo.properties.length;
  };

  // Check if can improve property (even building rule)
  const canImprove = (spaceId: number): { canImprove: boolean; reason: string } => {
    const property = properties.find((p) => p.spaceId === spaceId);
    const space = getSpaceById(spaceId);

    if (!property || !space?.group) {
      return { canImprove: false, reason: 'Property not found' };
    }

    // Cannot improve beyond level 5
    if (property.collectivizationLevel >= 5) {
      return { canImprove: false, reason: 'Maximum level reached' };
    }

    // Must own complete group to improve any property
    if (!ownsCompleteGroup(space.group)) {
      return { canImprove: false, reason: 'Must own all properties in group' };
    }

    // Check if can afford
    const cost = getNextCollectivizationCost(property.collectivizationLevel);
    if (player.rubles < cost) {
      return { canImprove: false, reason: `Insufficient rubles (need ₽${String(cost)})` };
    }

    // Check even building within group
    const groupProperties = groupedProperties[space.group];
    const currentLevel = property.collectivizationLevel;

    // Get levels of all properties in the group
    const groupLevels = groupProperties.map((id) => {
      const prop = properties.find((p) => p.spaceId === id);
      return prop?.collectivizationLevel ?? 0;
    });

    // Find minimum level in group (excluding current property)
    const otherLevels = groupLevels.filter((_, idx) => groupProperties[idx] !== spaceId);
    const minLevel = otherLevels.length > 0 ? Math.min(...otherLevels) : 0;

    // Can only build if current property is not already ahead
    if (currentLevel > minLevel) {
      return { canImprove: false, reason: 'Must improve evenly across group' };
    }

    return { canImprove: true, reason: '' };
  };

  const handleImprove = (spaceId: number) => {
    const property = properties.find((p) => p.spaceId === spaceId);
    const space = getSpaceById(spaceId);

    if (!property || !space) return;

    const { canImprove: canImproveProperty, reason } = canImprove(spaceId);
    if (!canImproveProperty) {
      alert(reason);
      return;
    }

    const cost = getNextCollectivizationCost(property.collectivizationLevel);
    const newLevel = property.collectivizationLevel + 1;
    const levelInfo = COLLECTIVIZATION_LEVELS[newLevel];

    // Deduct cost
    updatePlayer(playerId, { rubles: player.rubles - cost });

    // Increase collectivization level
    setCollectivizationLevel(spaceId, newLevel);

    addLogEntry({
      type: 'property',
      message: `${player.name} improved ${space.name} to ${levelInfo.name} for ₽${String(cost)}`,
      playerId,
    });

    setSelectedProperty(null);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.header}>
          <span className={styles.icon}>⚒️</span>
          <h2 className={styles.title}>PROPERTY COLLECTIVIZATION</h2>
          <span className={styles.icon}>⚒️</span>
        </div>

        <div className={styles.content}>
          <div className={styles.playerInfo}>
            <span className={styles.playerName}>{player.name}</span>
            <span className={styles.playerRubles}>₽{player.rubles}</span>
          </div>

          <div className={styles.instructions}>
            <p>
              Improve your properties to increase quota collection.
              Must improve evenly across each color group.
            </p>
          </div>

          <div className={styles.propertyGroups}>
            {Object.entries(groupedProperties).map(([group, spaceIds]) => {
              if (spaceIds.length === 0 || group === 'railroad' || group === 'utility') return null;

              const groupInfo = PROPERTY_GROUPS[group as PropertyGroup];
              const isComplete = ownsCompleteGroup(group as PropertyGroup);

              return (
                <div key={group} className={styles.propertyGroup}>
                  <div
                    className={styles.groupHeader}
                    style={{ backgroundColor: groupInfo.color }}
                  >
                    <span className={styles.groupName}>{groupInfo.name}</span>
                    {isComplete && <span className={styles.completeIndicator}>COMPLETE SET</span>}
                  </div>

                  <div className={styles.properties}>
                    {spaceIds.map((spaceId) => {
                      const space = getSpaceById(spaceId);
                      const property = properties.find((p) => p.spaceId === spaceId);
                      const { canImprove: canImproveProperty, reason } = canImprove(spaceId);

                      if (!space || !property) return null;

                      const currentLevel = property.collectivizationLevel;
                      const nextCost = getNextCollectivizationCost(currentLevel);
                      const currentLevelInfo = COLLECTIVIZATION_LEVELS[currentLevel];
                      const nextLevelInfo = COLLECTIVIZATION_LEVELS[currentLevel + 1];

                      return (
                        <div key={spaceId} className={styles.property}>
                          <div className={styles.propertyName}>{space.name}</div>

                          <div className={styles.levelInfo}>
                            <div className={styles.currentLevel}>
                              <span className={styles.levelLabel}>Current:</span>
                              <span className={styles.levelValue}>
                                {currentLevelInfo.name}
                                {currentLevel > 0 && (
                                  <span className={styles.stars}>
                                    {Array.from({ length: currentLevel }).map((_, i) => (
                                      <span key={i}>{i === 4 ? '★' : '☆'}</span>
                                    ))}
                                  </span>
                                )}
                              </span>
                            </div>

                            {currentLevel < 5 && (
                              <>
                                <div className={styles.nextLevel}>
                                  <span className={styles.levelLabel}>Next:</span>
                                  <span className={styles.nextLevelValue}>
                                    {nextLevelInfo.name} (₽{String(nextCost)})
                                  </span>
                                </div>

                                <button
                                  className={styles.improveButton}
                                  onClick={() => { handleImprove(spaceId); }}
                                  disabled={!canImproveProperty}
                                  title={reason}
                                >
                                  {canImproveProperty ? `IMPROVE (₽${String(nextCost)})` : reason}
                                </button>
                              </>
                            )}

                            {currentLevel === 5 && (
                              <div className={styles.maxLevel}>
                                ★ MAXIMUM LEVEL REACHED ★
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {player.properties.filter(p => {
            const space = getSpaceById(parseInt(p));
            return space?.type === 'property';
          }).length === 0 && (
            <div className={styles.noProperties}>
              You do not have any properties to improve.
            </div>
          )}

          <div className={styles.levelReference}>
            <h4 className={styles.referenceTitle}>Collectivization Levels:</h4>
            <div className={styles.levels}>
              {COLLECTIVIZATION_LEVELS.slice(1).map((level) => (
                <div key={level.level} className={styles.levelItem}>
                  <span className={styles.levelStars}>
                    {Array.from({ length: level.level }).map((_, i) => (
                      <span key={i}>{i === 4 ? '★' : '☆'}</span>
                    ))}
                  </span>
                  <span className={styles.levelName}>{level.name}</span>
                  <span className={styles.levelCost}>₽{level.cost}</span>
                  <span className={styles.levelBonus}>+{(level.multiplier - 1) * 100}%</span>
                </div>
              ))}
            </div>
          </div>

          <button className={styles.closeButton} onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
