// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { Property } from '../../types/game';
import { getSpaceById } from '../../data/spaces';
import { PROPERTY_GROUPS, getCollectivizationName } from '../../data/properties';
import { calculateQuota } from '../../utils/propertyUtils';
import { useGameStore } from '../../store/gameStore';
import styles from './PropertyCard.module.css';

interface PropertyCardProps {
  property: Property;
  showCurrentQuota?: boolean;
  compact?: boolean;
}

export function PropertyCard({ property, showCurrentQuota = false, compact = false }: PropertyCardProps) {
  const properties = useGameStore((state) => state.properties);
  const players = useGameStore((state) => state.players);

  const space = getSpaceById(property.spaceId);
  if (!space) return null;

  const group = space.group ? PROPERTY_GROUPS[space.group] : null;
  const custodian = property.custodianId
    ? players.find((p) => p.id === property.custodianId)
    : null;

  const currentQuota = showCurrentQuota && space.baseQuota
    ? calculateQuota(property, properties)
    : null;

  const collectivizationName = getCollectivizationName(property.collectivizationLevel);

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      {/* Color band */}
      {group && (
        <div
          className={styles.colorBand}
          style={{ backgroundColor: group.color }}
        />
      )}

      {/* Property info */}
      <div className={styles.content}>
        <h4 className={styles.name}>{space.name}</h4>

        {!compact && group && (
          <div className={styles.group}>{group.name}</div>
        )}

        {/* Custodian */}
        <div className={styles.custodian}>
          <span className={styles.label}>Custodian:</span>
          <span className={styles.value}>
            {custodian ? custodian.name : 'STATE'}
          </span>
        </div>

        {/* Base Quota */}
        {space.baseQuota && (
          <div className={styles.quota}>
            <span className={styles.label}>Base Quota:</span>
            <span className={styles.value}>₽{space.baseQuota}</span>
          </div>
        )}

        {/* Current Quota */}
        {currentQuota !== null && (
          <div className={styles.currentQuota}>
            <span className={styles.label}>Current Quota:</span>
            <span className={styles.value}>₽{currentQuota}</span>
          </div>
        )}

        {/* Collectivization Level */}
        {!compact && property.collectivizationLevel > 0 && (
          <div className={styles.collectivization}>
            <div className={styles.stars}>
              {Array.from({ length: property.collectivizationLevel }).map((_, i) => (
                <span key={i} className={styles.star}>
                  {i === 4 ? '★' : '☆'}
                </span>
              ))}
            </div>
            <div className={styles.levelName}>{collectivizationName}</div>
          </div>
        )}

        {compact && property.collectivizationLevel > 0 && (
          <div className={styles.compactStars}>
            {Array.from({ length: property.collectivizationLevel }).map((_, i) => (
              <span key={i} className={styles.star}>
                {i === 4 ? '★' : '☆'}
              </span>
            ))}
          </div>
        )}

        {/* Mortgaged status */}
        {property.mortgaged && (
          <div className={styles.mortgaged}>MORTGAGED</div>
        )}

        {/* Special rule hint */}
        {!compact && space.specialRule && (
          <div className={styles.specialRule}>
            ⚠ Special Rule Applies
          </div>
        )}
      </div>
    </div>
  );
}
