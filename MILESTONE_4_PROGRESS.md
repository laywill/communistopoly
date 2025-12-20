# Milestone 4: Property System - Implementation Progress

## ✅ Completed Components

### 1. Core Infrastructure
- **Type definitions** (`src/types/game.ts`)
  - Added `mortgaged` field to Property interface
  - Added `skipNextTurn` and `usedRailwayGulagPower` to Player interface
  - Extended `PendingActionType` with property-related actions

- **Game Store** (`src/store/gameStore.ts`)
  - Added property transaction actions: `purchaseProperty`, `payQuota`, `mortgageProperty`, `unmortgageProperty`
  - Added `setPendingAction` action
  - Updated `finishMoving` to trigger property-related pending actions
  - Integrated property purchase, quota payment, railway, and utility fee logic into turn flow

### 2. Utility Functions
- **Property Utils** (`src/utils/propertyUtils.ts`)
  - `ownsCompleteGroup()` - Check if player owns all properties in a group
  - `calculateQuota()` - Calculate quota with collectivization and group bonuses
  - `calculateRailwayFee()` - Calculate railway fees based on stations owned
  - `calculateUtilityFee()` - Calculate utility fees based on dice roll
  - `canPurchaseProperty()` - Check rank restrictions for property purchase
  - `getRankDiscount()` - Get discount percentage based on player rank
  - `calculateTotalWealth()` - Calculate player's total wealth for tax purposes
  - `canImproveProperty()` - Check if a property can be improved
  - `getRailwayCount()` - Count railways owned by player
  - `getUtilityCount()` - Count utilities owned by player

### 3. Reusable Components
- **StalinPriceSetter** (`src/components/property/StalinPriceSetter.tsx`)
  - Allows Stalin to set property prices within range (50%-200% of base value)
  - Input validation and error handling
  - Fully styled with Soviet aesthetic

- **PropertyCard** (`src/components/property/PropertyCard.tsx`)
  - Reusable property display component
  - Shows custodian, quota, collectivization level
  - Supports compact and detailed modes
  - Displays mortgaged status and special rules

### 4. Modal Components
- **PropertyPurchaseModal** (`src/components/modals/PropertyPurchaseModal.tsx`)
  - Handles property purchase flow
  - Integrates StalinPriceSetter for price setting
  - Shows rank restrictions
  - Displays collectivization level information
  - Handles utility donation for low-rank players

- **QuotaPaymentModal** (`src/components/modals/QuotaPaymentModal.tsx`)
  - Handles quota payments when landing on owned properties
  - Implements Collective Farm announcement rule
  - Handles Industrial Centers conscripted labor
  - Shows Party Elite District double quota + salute requirement
  - Handles inability to pay (with placeholder for debt system)

- **PendingActionHandler** (`src/components/modals/PendingActionHandler.tsx`)
  - Central handler for all pending action modals
  - Routes to appropriate modal based on pending action type
  - Integrated into GameScreen

### 5. Integration
- **GameScreen** (`src/components/screens/GameScreen.tsx`)
  - Updated to use PendingActionHandler
  - Simplified modal handling

---

## 🚧 Remaining Components to Implement

### 1. Railway Modal
**File:** `src/components/modals/RailwayModal.tsx`

**Purpose:** Handle railway fee payment when landing on a railway controlled by another player

**Key Features:**
- Display railway name and controller
- Calculate and show fee based on number of stations owned (50/100/150/200)
- Handle payment or inability to pay
- Show special rule for all 4 stations (send player to Gulag once per game)

**Template Pattern:** Follow `QuotaPaymentModal.tsx` structure

### 2. Utility Modal
**File:** `src/components/modals/UtilityModal.tsx`

**Purpose:** Handle utility fee payment when landing on a utility controlled by another player

**Key Features:**
- Display utility name and controller
- Show dice roll and calculate fee (4× or 10× dice roll)
- Enforce rank restriction (Commissar+ only)
- Handle donation to State if player is too low rank
- Include Stalin's secret rule about Proletariats with utilities

**Template Pattern:** Follow `QuotaPaymentModal.tsx` structure with rank check from `PropertyPurchaseModal.tsx`

### 3. Tax Modal
**File:** `src/components/modals/TaxModal.tsx`

**Purpose:** Handle tax spaces (Revolutionary Contribution & Bourgeois Decadence Tax)

**Key Features:**

**Revolutionary Contribution (Position 4):**
- Calculate 15% of total wealth using `calculateTotalWealth()`
- Allow player to choose: 15% OR ₽200
- Stalin audit button
- If audit reveals player chose lower amount, charge difference + ₽50 penalty

**Bourgeois Decadence Tax (Position 38):**
- Standard ₽100 payment
- Check if player is wealthiest (compare total wealth of all players)
- If wealthiest: pay ₽200 AND lose one rank (call `demotePlayer()`)

**Template Pattern:** Create two sub-components or conditional rendering based on space ID

### 4. Improvement Modal
**File:** `src/components/modals/ImprovementModal.tsx`

**Purpose:** Allow players to improve their properties during their turn

**Key Features:**
- List all player's properties grouped by color
- Show current collectivization level for each
- Show cost to improve (₽100 for levels 1-4, ₽200 for level 5)
- Check improvement rules using `canImproveProperty()`:
  - Must own all properties in group for People's Palace
  - Must improve evenly across group
  - Cannot improve mortgaged properties
- Deduct rubles and call `updateCollectivizationLevel()`

**Template Pattern:** Similar to `PropertyPurchaseModal.tsx` but shows multiple properties

**Integration Point:** Add "IMPROVE PROPERTIES" button to PlayerDashboard in post-turn phase

### 5. Property Management Modal
**File:** `src/components/modals/PropertyManagementModal.tsx`

**Purpose:** Comprehensive property management interface for player dashboard

**Key Features:**
- List all player's properties with PropertyCard components
- Show properties grouped by color
- For each property:
  - Current collectivization level
  - Improve button (if eligible)
  - Mortgage/Unmortgage button
  - Mortgage value display
- Calculate and display total property value
- Show which groups are complete

**Template Pattern:** Grid/list layout with PropertyCard components and action buttons

### 6. Board Visual Updates

**Files to Update:**
- `src/components/board/PropertySpace.tsx`
- `src/components/board/RailwaySpace.tsx`
- `src/components/board/UtilitySpace.tsx`

**Changes Needed:**

1. **Ownership Indicators:**
   - Add small colored dot/icon showing which player owns the property
   - Use player's piece color or index

2. **Collectivization Stars:**
   - Display stars (☆☆☆☆★) on property spaces
   - Show level 5 with a different icon (★ for People's Palace)

3. **Complete Group Highlighting:**
   - Add visual indication when a player owns all properties in a group
   - Border glow or special styling

4. **Mortgaged Properties:**
   - Striped/grayed out appearance for mortgaged properties

**Example PropertySpace.tsx additions:**
```tsx
const property = useGameStore((state) =>
  state.properties.find((p) => p.spaceId === space.id)
);
const custodian = property?.custodianId
  ? useGameStore((state) => state.players.find((p) => p.id === property.custodianId))
  : null;

// In JSX:
{custodian && (
  <div className={styles.ownerIndicator} style={{ background: getPlayerColor(custodian) }} />
)}
{property && property.collectivizationLevel > 0 && (
  <div className={styles.stars}>
    {Array.from({ length: property.collectivizationLevel }).map((_, i) => (
      <span key={i}>{i === 4 ? '★' : '☆'}</span>
    ))}
  </div>
)}
```

---

## 📝 Implementation Guide for Remaining Components

### Step 1: Railway Modal
1. Copy `QuotaPaymentModal.tsx` as starting point
2. Replace quota calculation with `calculateRailwayFee()`
3. Update styling to use railroad theme (black/red)
4. Add special rule display for 4 stations

### Step 2: Utility Modal
1. Copy `QuotaPaymentModal.tsx` as starting point
2. Use `calculateUtilityFee()` with dice total from pending action data
3. Add rank restriction check from `PropertyPurchaseModal`
4. Handle donation flow for low-rank players

### Step 3: Tax Modal
1. Create new modal with two modes based on space ID (4 or 38)
2. Use `calculateTotalWealth()` for Revolutionary Contribution
3. Implement choice mechanism (buttons for 15% or ₽200)
4. Add Stalin audit functionality
5. For Bourgeois Decadence, compare player wealth to find wealthiest

### Step 4: Improvement Modal
1. Fetch all player's properties
2. Group by color using `PROPERTY_GROUPS`
3. For each property, check `canImproveProperty()`
4. Display PropertyCard components in grid
5. Add improve buttons with cost display
6. Handle improvement purchase and call `updateCollectivizationLevel()`

### Step 5: Property Management Modal
1. Similar to ImprovementModal but more comprehensive
2. Add mortgage/unmortgage functionality
3. Call `mortgageProperty()` or `unmortgageProperty()` from store
4. Show all property statistics

### Step 6: Board Visual Updates
1. Update each space component to fetch property state from store
2. Add CSS for owner indicators, stars, and special states
3. Test visual appearance with different ownership states

### Step 7: Update PendingActionHandler
Replace placeholder divs for railway-fee, utility-fee, and tax-payment with actual components:

```tsx
case 'railway-fee':
  return <RailwayModal spaceId={...} payerId={...} onClose={handleClose} />;

case 'utility-fee':
  return <UtilityModal spaceId={...} payerId={...} diceTotal={...} onClose={handleClose} />;

case 'tax-payment':
  return <TaxModal spaceId={...} playerId={...} onClose={handleClose} />;
```

---

## 🧪 Testing Checklist

Once all components are implemented:

- [ ] Landing on unowned property shows purchase modal
- [ ] Stalin can set price within valid range
- [ ] Player can accept or decline purchase
- [ ] Rank restrictions prevent invalid purchases (Green, Kremlin, Utilities)
- [ ] Landing on owned property charges correct quota
- [ ] Complete group doubles the quota
- [ ] Collective Farm announcement requirement works
- [ ] Industrial Centers conscript labor on non-payment
- [ ] Party Elite doubles quota for Proletariats
- [ ] Improvements can only be built evenly
- [ ] People's Palace requires complete group
- [ ] Railway fees scale correctly (50/100/150/200)
- [ ] Utilities only purchasable by Commissar+
- [ ] Utility fees calculated correctly (4× or 10× dice)
- [ ] Revolutionary Contribution tax calculations are correct
- [ ] Stalin audit works for Revolutionary Contribution
- [ ] Bourgeois Decadence Tax identifies wealthiest player
- [ ] Board shows ownership indicators
- [ ] Board shows collectivization stars
- [ ] Property management modal works
- [ ] Mortgage/unmortgage functionality works

---

## 📊 Progress Summary

**Completed:** 8/15 major tasks (53%)

**Core Functionality:** ✅ Complete
- Type system
- Store actions
- Utility functions
- Purchase flow
- Quota payment flow
- Turn flow integration

**Remaining Work:** 7/15 tasks (47%)
- 4 Modal components (Railway, Utility, Tax, Improvement)
- 1 Management interface
- Board visual updates
- Testing

**Estimated Time to Complete:** 4-6 hours

The foundation is solid. All remaining components follow established patterns. Focus on one component at a time, test it, then move to the next.

---

## 🎯 Next Steps

1. **Create RailwayModal** - Simplest remaining modal
2. **Create UtilityModal** - Similar to Railway
3. **Create TaxModal** - More complex with two modes
4. **Create ImprovementModal** - Property management
5. **Update Board Visuals** - Visual polish
6. **Full Integration Testing** - Play through scenarios
7. **Create Pull Request** - Ready for Milestone 5

**Glory to the Revolution! The means of production await their custodians!** ☭
