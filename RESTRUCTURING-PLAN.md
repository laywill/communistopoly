# README & Documentation Restructuring Plan

## Current Problems

The README.md currently tries to serve multiple purposes:
1. Landing page / Project introduction
2. Development setup guide
3. User gameplay manual
4. Quick reference guide (property tables)
5. Technical documentation

This makes it:
- Too long and overwhelming for visitors
- Hard to find specific information
- Duplicative with other docs
- Not optimized for any single purpose

## Proposed Solution

Transform the README into a focused **landing page** that effectively directs users to the right documentation, while moving detailed content into organized docs.

---

## NEW README.md Structure

### Keep (Streamlined):
1. **Header & Tagline** - The compelling intro (lines 1-8)
2. **Overview** - Brief description (lines 10-14, condensed)
3. **Current Status** - Milestone/playability status (lines 16-18)
4. **Quick Start** - Minimal steps to get running (condensed from lines 20-75)
   - Just the essential commands
   - Link to detailed setup in docs
5. **Project Links** - Clear navigation to docs:
   ```markdown
   - 📖 [Game Rules](docs/communistopoly-rules.md) - Complete rulebook
   - 🎮 [How to Play Guide](docs/how-to-play.md) - Gameplay walkthrough
   - 📊 [Property Quick Reference](docs/property-reference.md) - Rents and costs at a glance
   - 🔧 [Technical Specification](Designs/communistopoly-technical-spec.md) - For developers
   - 🎨 [Design Document](Designs/communistopoly-design.md) - Visual design specs
   ```
6. **Technology Stack** - Brief list (keep lines 105-113, condensed)
7. **Browser Support** - Keep as-is (lines 238-244)
8. **Contributing** - Keep as-is (lines 246-252)
9. **License** - Keep legal section (lines 254-273)
10. **Glory to the Motherland!** - Keep the footer slogan (lines 318-321)

### Remove/Move:
1. **Project Structure** (lines 76-102) → Move to technical spec (already there)
2. **Design Philosophy** (lines 115-125) → Already in design doc, just link to it
3. **"How to Play" section** (lines 131-235) → Extract to `docs/how-to-play.md`
4. **Property Tables** (lines 149-213) → Move to `docs/property-reference.md`
5. **Features & Highlights** (lines 276-307) → Condense to 3-4 bullet points in Overview
6. **Known Limitations** (lines 310-315) → Move to user guide or remove

---

## NEW Documentation Files

### 1. `docs/how-to-play.md` (NEW)
**Purpose**: User-friendly gameplay guide

**Content**:
- Setup instructions (choosing Stalin, starting conditions)
- Basic gameplay flow
- Turn structure
- Property mechanics (buying, collectivization, quotas)
- Special spaces (STOY, Breadline, Gulag, Enemy of State)
- Gulag mechanics (entering, escaping)
- Winning conditions
- Special features (piece abilities, rank system, trading)
- Tips for new players

**Source**: Extract from README lines 131-235, plus reference rules.md

---

### 2. `docs/property-reference.md` (NEW)
**Purpose**: Quick lookup table for all property values

**Content**:
- Introduction explaining collectivization levels
- Standard Properties table (from README lines 164-196)
- Railways table (lines 198-204)
- Utilities table (lines 206-212)
- Notes about ownership restrictions
- Link back to full rules for property abilities

**Source**: README lines 149-213

**Alternative name**: `docs/rents-quick-reference.md` (as user suggested)

---

### 3. `docs/communistopoly-rules.md` (EXISTS - ENHANCE)
**Current status**: Already contains core rules

**Enhancements needed**:
- Consider adding property table as appendix OR link to the new property-reference.md
- Ensure it's comprehensive and doesn't duplicate how-to-play guide
- This is the authoritative rulebook
- How-to-play is the "getting started" companion

---

### 4. Update `Designs/communistopoly-technical-spec.md` (EXISTS)
**Current status**: Very comprehensive

**Enhancements**:
- Already contains project structure - no changes needed
- Maybe add a link from README for clarity
- This is already well-structured for developers

---

## Detailed Restructuring Actions

### Action 1: Create `docs/how-to-play.md`
Extract and reorganize from README:
- Setup (from lines 133-138)
- Basic Gameplay (from lines 140-147)
- Turn structure and dice rolling
- Property mechanics
- Special spaces
- Gulag (from lines 215-220, plus rules reference)
- Winning (from lines 222-226)
- Special Features (from lines 228-235)
- Add beginner tips section

### Action 2: Create `docs/property-reference.md`
Move from README:
- Collectivization explanation (lines 149-161)
- Standard properties table (lines 164-196)
- Railways table (lines 198-204)
- Utilities table (lines 206-212)
- Add cross-references to rules.md for special abilities

### Action 3: Rewrite README.md
New structure:
```markdown
# Communistopoly ☭
[Tagline and overview - condensed to 2-3 paragraphs]

## Status
✓ Fully playable - All milestones complete

## Quick Start
[3-5 essential commands to get running]
[Link to detailed setup in how-to-play.md]

## Documentation
- 📖 Game Rules - Complete rulebook
- 🎮 How to Play - Getting started guide
- 📊 Property Reference - Quick lookup tables
- 🔧 Technical Spec - For developers
- 🎨 Design Doc - Visual specifications

## Technology
[Brief bullet list - 5-6 items max]

## Features
[3-4 compelling highlights only]
- Automatic save/load
- Stalin control panel
- Authentic Soviet aesthetic
- 8 unique player pieces with abilities

## Browser Support
[Keep as-is]

## Contributing
[Keep as-is]

## License
[Keep legal disclaimers as-is]

Слава Родине! Glory to the Motherland!
```

### Action 4: Update cross-references
Ensure these files link to each other appropriately:
- README → All docs
- how-to-play.md → rules.md, property-reference.md
- property-reference.md → rules.md (for special abilities)
- rules.md → property-reference.md (for quick lookups)

---

## File Organization

```
communistopoly/
├── README.md                        [REWRITE - Landing page]
├── Designs/
│   ├── communistopoly-rules.md      [DEPRECATED - moved to docs/]
│   ├── communistopoly-design.md     [KEEP]
│   └── communistopoly-technical-spec.md [KEEP]
└── docs/
    ├── communistopoly-rules.md      [ENHANCE - Main rulebook]
    ├── how-to-play.md               [NEW - User guide]
    └── property-reference.md        [NEW - Quick reference tables]
```

**Note**: The original rules.md is in `Designs/` but was moved to `docs/` based on recent commit. Confirm location and remove from Designs/ if duplicate.

---

## Benefits of This Structure

### For New Users:
- README gives immediate overview and clear next steps
- "How to Play" provides friendly onboarding
- Property reference for quick lookups during gameplay

### For Players:
- Rules document is authoritative reference
- Property reference speeds up gameplay
- How-to-play is a refresher

### For Developers:
- README points clearly to technical spec
- Technical spec already comprehensive
- Design doc accessible for UI work

### For Contributors:
- Clear separation of concerns
- Less duplication
- Easier to maintain

---

## Implementation Order

1. **Create `docs/property-reference.md`** - Extract tables from README
2. **Create `docs/how-to-play.md`** - Extract and reorganize gameplay content
3. **Update `docs/communistopoly-rules.md`** - Add appendix or cross-reference to property-reference.md
4. **Rewrite `README.md`** - Transform into clean landing page with links
5. **Test all links** - Ensure navigation works
6. **Clean up any duplicates** - Check for rules.md in multiple locations

---

## Open Questions for User

1. **Property Reference Name**:
   - ✅ `property-reference.md` (descriptive)
   - NO `rents-quick-reference.md` (matches user suggestion)
   - NO `property-tables.md` (simple)

2. **Rules Location**:
   - Confirm rules.md should stay in `docs/` (not `Designs/`)
     - Yes
   - Remove from Designs/ if it's now in docs/?
     - Yes

3. **How-to-Play vs Rules**:
   - Keep separate (recommended)?
     - Yes. Think of this as the comprehensive rules vs a "Quick start" How to play guide that covers just the essentials. "Have you played a boardgame before? You have. Very bourgeoisie of you, though helpful just this once!"
   - Or merge into expanded rules.md with clear sections?
     - The rules must be comprehensive, but the seperate how-to-play is a short guide coving just the essentials.

4. **Features Section in README**:
   - Include condensed highlights (3-4 items)?
   - Or remove entirely and let docs speak for themselves?

5. **Known Limitations**:
   - Keep in README (brief)?
   - Move to how-to-play?
   - Remove entirely?

---

## Notes

- All content preserved, just reorganized
- No information loss
- Improved discoverability
- Better separation of concerns
- Maintains all existing links with updates
- Technical spec unchanged (already good)
- Design doc unchanged (already focused)
