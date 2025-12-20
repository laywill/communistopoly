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

- **RailwayModal** (`src/components/modals/RailwayModal.tsx`)
  - Handles railway fee payment when landing on controlled railway
  - Calculates and displays fee based on stations owned (₽50/₽100/₽150/₽200)
  - Shows special rule notification for all 4 stations (Gulag power)
  - Handles payment or debt acknowledgment

- **UtilityModal** (`src/components/modals/UtilityModal.tsx`)
  - Handles utility fee payment when landing on controlled utility
  - Dynamic fee calculation (dice × 4 or dice × 10)
  - Displays dice roll and multiplier breakdown
  - Shows secret rule warning for Proletariat controllers
  - Includes rank information display

- **TaxModal** (`src/components/modals/TaxModal.tsx`)
  - Handles both Revolutionary Contribution and Bourgeois Decadence Tax
  - **Revolutionary Contribution:** Player choice between 15% wealth or ₽200 flat rate
  - Stalin audit system with penalty calculation
  - Wealth breakdown display (rubles + properties + improvements)
  - **Bourgeois Decadence:** Automatic wealthiest player detection
  - Demotion system for wealthiest player (₽200 + rank loss)

- **ImprovementModal** (`src/components/modals/ImprovementModal.tsx`)
  - Complete collectivization system with 5 levels
  - Properties grouped by color with complete set indicators
  - Even building enforcement across property groups
  - People's Palace requirement (must own complete group)
  - Real-time affordability checking
  - Collectivization level reference chart
  - Cannot improve mortgaged properties

- **PropertyManagementModal** (`src/components/modals/PropertyManagementModal.tsx`)
  - Comprehensive property portfolio interface
  - Properties displayed in grid grouped by color
  - Shows collectivization stars and levels
  - One-click access to ImprovementModal
  - Mortgage/unmortgage functionality
  - Complete group indicators
  - Property count and value display

---

## 🚧 Remaining Components to Implement

### Board Visual Updates

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

### Board Visual Updates
1. Update each space component to fetch property state from store
2. Add CSS for owner indicators, stars, and special states
3. Test visual appearance with different ownership states

**Implementation Steps:**
- Update `PropertySpace.tsx` to show ownership indicator and collectivization stars
- Update `RailwaySpace.tsx` to show ownership indicator
- Update `UtilitySpace.tsx` to show ownership indicator
- Add CSS styling for mortgaged properties (grayed/striped appearance)
- Add visual highlighting for complete property groups

---

## 🧪 Testing Checklist

**Core Functionality (Ready to Test):**

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
- [ ] Property management modal works
- [ ] Mortgage/unmortgage functionality works
- [ ] Collectivization improvement system works correctly

**Visual Features (Pending Implementation):**

- [ ] Board shows ownership indicators
- [ ] Board shows collectivization stars
- [ ] Complete group highlighting on board
- [ ] Mortgaged properties show visual distinction

---

## 📊 Progress Summary

**Completed:** 13/15 major tasks (87%)

**Core Functionality:** ✅ Complete
- ✅ Type system
- ✅ Store actions
- ✅ Utility functions
- ✅ Purchase flow
- ✅ Quota payment flow
- ✅ Railway fee system
- ✅ Utility fee system
- ✅ Tax system (Revolutionary Contribution & Bourgeois Decadence)
- ✅ Collectivization/improvement system (5 levels)
- ✅ Property management interface
- ✅ Turn flow integration

**Remaining Work:** 2/15 tasks (13%)
- Board visual updates (ownership indicators, stars, highlighting)
- Comprehensive testing

**Estimated Time to Complete:** 2-3 hours

All core modal functionality is complete and integrated. Only visual polish and testing remain.

---

## 🎯 Next Steps

1. ✅ ~~Create RailwayModal~~ - **COMPLETE**
2. ✅ ~~Create UtilityModal~~ - **COMPLETE**
3. ✅ ~~Create TaxModal~~ - **COMPLETE**
4. ✅ ~~Create ImprovementModal~~ - **COMPLETE**
5. ✅ ~~Create PropertyManagementModal~~ - **COMPLETE**
6. ⏳ **Update Board Visuals** - Add ownership indicators and collectivization stars
7. ⏳ **Full Integration Testing** - Play through all property scenarios
8. 🎯 **Create Pull Request** - Merge to main when testing complete

**Latest Commit:** `d0f4998` - feat: implement railway/utility fees, tax system, and property collectivization

**Milestone 4 Status:** ~90% Complete - All core functionality implemented!

**Glory to the Revolution! The means of production are under custodianship!** ☭
