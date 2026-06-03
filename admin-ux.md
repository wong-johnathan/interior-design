# Admin Panel UX Guide

## Managing BTO Projects, Floor Plans & Content

| Field | Value |
|-------|-------|
| **Status** | Draft v2.0 |
| **Date** | 2026-06-03 |
| **Author** | Johnathan Wong |
| **Intended Admin** | You — Johnathan — the only person managing templates |

---

## 1. Admin Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  🏠 Admin Panel                        Johnathan ▼          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Dashboard                            Welcome back!   │    │
│  │  ─────────────────────────────────                    │    │
│  │                                                       │    │
│  │  📊 Overview                                           │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│    │
│  │  │ 12       │  │ 24       │  │ 8        │  │ 156    ││    │
│  │  │ BTO      │  │ Flat     │  │ Furniture│  │ Users  ││    │
│  │  │ Projects │  │ Models   │  │ Templates│  │        ││    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘│    │
│  │                                                       │    │
│  │  🏗️ BTO Projects          See all →                  │    │
│  │  ┌────────────────────────────────────────────────┐   │    │
│  │  │ Verandah Kallang 2024    4 models  ✅ Published │   │    │
│  │  │ Queenstown 2024          3 models  ✅ Published │   │    │
│  │  │ Clementi Ridges 2025     2 models  ⏳ Draft     │   │    │
│  │  │ Tampines Greenwalk 2025  3 models  ✅ Published │   │    │
│  │  │ [+ Add New BTO Project]                         │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  │                                                       │    │
│  ├─── Sidebar ───────────────────────────────────────────┤    │
│  │  📊 Dashboard                                         │    │
│  │  🏗️ BTO Projects                                     │    │
│  │  🪑 Furniture Templates                               │    │
│  │  📦 Furniture Catalog                                 │    │
│  │  🎨 Style Presets                                     │    │
│  │  👥 Users                                             │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. BTO Project Management

### 2.1 BTO Project List

```
┌──────────────────────────────────────────────────────────────┐
│  🏗️ BTO Projects                    [+ New BTO Project]     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Search: [🔍 Search projects...]                              │
│  Filter: [All Years ▼]  [All Locations ▼]  [All Status ▼]   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Verandah Kallang 2024  │ Kallang  │ 4 models │ ✅ Pub │⏎ │
│  │────────────────────────────────────────────────────────│  │
│  │ Queenstown 2024        │ Queenstown│ 3 models │ ✅ Pub │⏎ │
│  │────────────────────────────────────────────────────────│  │
│  │ Clementi Ridges 2025   │ Clementi │ 2 models │ ⏳ Draft│⏎ │
│  │────────────────────────────────────────────────────────│  │
│  │ Tampines Greenwalk 2025│ Tampines │ 3 models │ ✅ Pub │⏎ │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Each row:                                                    │
│  ⏎ = Click to see flat models inside this BTO project         │
│  ⋮ = Context menu: Edit, Duplicate, Delete                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Create/Edit BTO Project Form

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to BTO Projects        New BTO Project              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Project Name *                                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Verandah Kallang 2024                            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  Slug (auto-generated from name, editable)           │
│  ┌──────────────────────────────────────────────────┐ │
│  │ verandah-kallang-2024                            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  Location *                  Launch Year *            │
│  ┌──────────────────────┐   ┌────────────────────┐   │
│  │ Kallang               │   │ 2024               │   │
│  └──────────────────────┘   └────────────────────┘   │
│                                                       │
│  Description (shown on user browse page)              │
│  ┌──────────────────────────────────────────────────┐ │
│  │ A premium BTO project in the Kallang area,       │ │
│  │ located near the Kallang Riverside Park.         │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  Hero Image (shown on browse page, 16:9)             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [Drop image here or click to upload]              │ │
│  │                                                   │ │
│  │ Supported: PNG, JPG  Max: 5MB                    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│           [Cancel]           [Save & Add Models →]    │
└──────────────────────────────────────────────────────┘
```

---

## 3. Flat Model Annotation (The Core Workflow)

This is the **most important admin screen**. You'll spend the most time here — one per layout per BTO project.

### 3.1 Layout: Three-Panel Split

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to BTO Projects         Verandah Kallang 2024        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Add Model Details                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Model Name *     Flat Type *     Total Area (sqm)    │    │
│  │ ┌──────────────┐ ┌──────────┐   ┌──────────────┐    │    │
│  │ │ 4-Room Model │ │ 4-room  │   │ 90           │    │    │
│  │ └──────────────┘ └──────────┘   └──────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ═══════════════════════════════════════════════════════════  │
│                                                               │
│  Step 2: Upload Floor Plan                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  [Drop floor plan image here or click to upload]      │    │
│  │                                                       │    │
│  │  Supported: PNG, JPG, PDF     Max: 50MB              │    │
│  │  Recommended: PNG at 2048px wide                      │    │
│  │                                                       │    │
│  │  Tip: Use HDB's official floor plan PDFs.            │    │
│  │  Convert to PNG with clean contrast.                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ═══════════════════════════════════════════════════════════  │
│                                                               │
│  Step 3: Annotate Rooms                                       │
│  ┌─────────────── Canvas ───────────────┬── Properties ───┐  │
│  │                                      │                  │  │
│  │    ┌──────────────┐                  │ Room: Living     │  │
│  │    │              │  ┌──────┐        │ (selected ▲)    │  │
│  │    │   Living     │  │ MBR  │        │──────────────── │  │
│  │    │   Room       │  │      │        │ Room Type:       │  │
│  │    │              │  └──────┘        │ [Living ▼]      │  │
│  │    └──────────────┘                  │ Label:           │  │
│  │  ┌────────────┐    🪟               │ [Living Room]   │  │
│  │  │  Kitchen   │                     │ Wall Height:     │  │
│  │  │            │                     │ [2.8] m          │  │
│  │  └────────────┘                     │ Default Wall:    │  │
│  │       🚪                            │ [#F5F5F0] [🎨]  │  │
│  │                                      │ Default Floor:   │  │
│  │                                      │ [Parquet ▼]     │  │
│  │                                      │ Floor Color:     │  │
│  │                                      │ [Light Oak ▼]   │  │
│  │                                      │                  │  │
│  │                                      │ Dimensions:      │  │
│  │                                      │ W: 5.2m  D: 4.8m│  │
│  │                                      │ Area: 24.96m²   │  │
│  │                                      │                  │  │
│  │                                      │ Doors: 1         │  │
│  │                                      │ 🚪 W: 0.9m       │  │
│  │                                      │    H: 2.1m       │  │
│  │                                      │    [Inward ▼]   │  │
│  │                                      │                  │  │
│  │                                      │ Windows: 1       │  │
│  │                                      │ 🪟 W: 1.2m       │  │
│  │                                      │    H: 1.2m       │  │
│  │                                      │    Sill: 1.0m   │  │
│  │                                      │                  │  │
│  │                                      │ [Add Door]       │  │
│  │                                      │ [Add Window]     │  │
│  │                                      │ [Delete Room]    │  │
│  ├────── Toolbar ───────────────────────┴──────────────────┤  │
│  │  [✏️ Draw] [✋ Select] [🚪 Door] [🪟 Window] [🗑️ Delete]│  │
│  │  [🔍 Zoom In] [🔍 Zoom Out] [🔲 Fit to Screen]          │  │
│  │                                    [Save] [Preview 3D]  │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Drawing Rooms — Step by Step

| Step | Action | What Happens |
|------|--------|-------------|
| **1** | Click **Draw** tool | Cursor changes to crosshair |
| **2** | Click on floor plan image | First vertex placed (dot appears) |
| **3** | Click next corner | Line draws between points |
| **4** | Continue clicking corners | Polygon forms around room |
| **5** | **Double-click** to close | Polygon closes, room highlighted |
| **6** | Properties panel opens | Shows room with auto-calculated dimensions |
| **7** | Select **Room Type** from dropdown | Sets icon colour + default materials |
| **8** | Adjust **label** if needed | e.g. "Master Bedroom" vs "Bedroom 2" |
| **9** | Repeat for all rooms | Each room added to list |
| **10** | Click **Save** | Rooms stored in database |

**Tips for accurate drawing:**
- Draw clockwise around the room for correct wall winding
- Zoom in for precise corner placement
- Use the floor plan's scale (if known) — set scale in model settings
- Walls between adjacent rooms should share the same edge

### 3.3 Placing Doors & Windows

```
After drawing rooms, place doors and windows on wall edges.

Door Placement:
1. Click on a wall edge → "Add Door" button appears
2. Click "Add Door" → dialog slides down from wall
3. Set: Width (default 0.9m), Height (2.1m), Swing direction
4. Drag door along wall to position it correctly
5. Click away to confirm

Window Placement:
1. Click on a wall edge → "Add Window" appears
2. Click "Add Window" → dialog appears
3. Set: Width (1.2m), Height (1.2m), Sill Height (1.0m)
4. Drag along wall to position
5. Click away to confirm

Visual feedback:
- Door: arch symbol on wall edge, shows swing arc
- Window: rectangle on wall, shows sill line
- Both: dashed line through wall showing cutout
```

### 3.4 Room Types & Visual Mapping

| Room Type | Icon | Default Wall Colour | Default Floor |
|-----------|------|--------------------|---------------|
| **Living Room** | 🛋️ | `#F5F5F0` Warm White | Parquet, Light Oak |
| **Master Bedroom** | 🛏️ | `#F0EDE6` Off White | Laminate, Light Walnut |
| **Bedroom** | 🛌 | `#F0EDE6` Off White | Laminate, Light Walnut |
| **Kitchen** | 🍳 | `#FFFFFF` White | Tiles, White |
| **Toilet** | 🚿 | `#E8E8E8` Light Grey | Tiles, Grey |
| **Bomb Shelter** | 🛡️ | `#D0D0D0` Grey | Vinyl, Grey |
| **Service Yard** | 🧺 | `#E0E0E0` Silver | Tiles, Grey |
| **Balcony** | 🌿 | `#E8E0D8` Warm Grey | Tiles, Stone |
| **Hallway** | 🚪 | `#F5F5F0` Warm White | Vinyl, Beige |

### 3.5 After All Rooms Are Drawn

```
┌──────────────────────────────────────────────────────────────┐
│  ✅ All rooms annotated for Verandah 4-Room Model A         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Room Summary                                         │    │
│  │  ─────────────                                       │    │
│  │  # │ Room          │ Type     │ Area    │ Doors│Win  │    │
│  │  ───┼──────────────┼──────────┼─────────┼──────┼─────│    │
│  │  1 │ Living Room   │ living   │ 24.96m² │ 1   │ 1   │    │
│  │  2 │ Master BR     │ mbr      │ 16.40m² │ 1   │ 1   │    │
│  │  3 │ Bedroom 2     │ bedroom  │ 12.30m² │ 1   │ 1   │    │
│  │  4 │ Kitchen       │ kitchen  │ 9.60m²  │ 1   │ 0   │    │
│  │  5 │ Toilet 1      │ toilet   │ 4.20m²  │ 1   │ 0   │    │
│  │  6 │ Toilet 2      │ toilet   │ 3.80m²  │ 1   │ 0   │    │
│  │  7 │ Bomb Shelter  │ bomb_    │ 4.00m²  │ 1   │ 0   │    │
│  │  8 │ Hallway       │ hallway  │ 5.50m²  │ 0   │ 0   │    │
│  │  ────────────────────────────────────────────────────│    │
│  │  Total: 8 rooms      80.76m²                         │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  [← Back to Edit Rooms]     [Preview in 3D 🏠]  [Save Draft] │
│                                                     [Publish] │
└──────────────────────────────────────────────────────────────┘
```

### 3.6 3D Preview

When you click "Preview in 3D", it opens the same viewport users see — but with an admin badge:

```
┌──────────────────────────────────────────────┐
│  ⚙️ Admin Preview —     [Edit Rooms] [Pub]  │
│  (read-only 3D of current annotation)        │
├──────────────────────────────────────────────┤
│                                              │
│           🏠 3D Viewport                      │
│                                              │
│   💡 Tip: Click a room to inspect it.        │
│   Check wall heights, door positions,        │
│   and window sills match the HDB floor       │
│   plan.                                      │
│                                              │
│  [Looks good → Publish] [Needs fixes ←]     │
└──────────────────────────────────────────────┘
```

---

## 4. Managing Multiple Models Per BTO

HDB projects often have 2-4 different layouts per flat type.

```
BTO Project: Verandah Kallang 2024
│
├── 4-Room Models (3 variants)
│   ├── Model A (90sqm)          ← You annotate each separately
│   ├── Model B (92sqm)
│   └── Model C (88sqm, corner unit)
│
├── 5-Room Models (2 variants)
│   ├── Model A (110sqm)
│   └── Model B (108sqm)
│
└── 3-Room Models (1 variant)
    └── Model A (72sqm)
```

**Workflow summary for one BTO project:**
1. Create BTO project (2 min)
2. Add Model A (1 min)
3. Upload floor plan (30s)
4. Draw 8 rooms + place doors/windows (15 min)
5. Set room properties (5 min)
6. Preview 3D → fix issues (5 min)
7. Publish (1 click)
8. Repeat for Model B, C...

**Total: ~30 min per layout. ~2-3 hours for an entire BTO project.**

---

## 5. Furniture Template Management

### 5.1 Template List

```
┌──────────────────────────────────────────────────────────────┐
│  🪑 Furniture Templates                [+ New Template]     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Filter: [All Rooms ▼]  [All Styles ▼]  [Published ▼]       │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🛋️ Scandi Living     │ Living │ Scandi     │ ✅ Pub  │  │
│  │  🛋️ Japandi Living    │ Living │ Japandi    │ ✅ Pub  │  │
│  │  🛋️ Industrial Living │ Living │ Industrial │ ✅ Pub  │  │
│  │  🛏️ Scandi MBR        │ MBR    │ Scandi     │ ✅ Pub  │  │
│  │  🛏️ Japandi MBR       │ MBR    │ Japandi    │ ✅ Pub  │  │
│  │  🍽️ Universal Dining  │ Dining │ —          │ ⏳ Draft│  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Click template → see furniture layout + item list            │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Creating a Furniture Template

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Templates           New Furniture Template       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Template Name *                                             │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Scandi Living Room Set                           │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  Room Category *          Style Tag                          │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │ Living ▼          │    │ Scandinavian ▼   │               │
│  └──────────────────┘    └──────────────────┘               │
│                                                               │
│  ═══════════════════════════════════════════════════════════  │
│                                                               │
│  Furniture Items                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [+ Add Item from Catalog]                              │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │ 🛋️ 3-Seater Sofa         [× Remove]  [🔽 Edit]  │  │    │
│  │  │    Default position: Against north wall          │  │    │
│  │  │    Wall anchor: against                          │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │ 🪑 Oval Coffee Table     [× Remove]  [🔽 Edit]  │  │    │
│  │  │    Default position: Center of room              │  │    │
│  │  │    Wall anchor: center                           │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │ 🟫 Tatami-style Rug        [× Remove]  [🔽 Edit]│  │    │
│  │  │    Default position: Under coffee table          │  │    │
│  │  │    Wall anchor: —                                │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  [Save Draft]  [Publish]                                      │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Positioning Furniture (2D Overhead View)

When editing an item's position, a simplified 2D overhead view appears:

```
┌──────────────────────────────────────────────────────────────┐
│  Position: 3-Seater Sofa          [Done]                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │      🛋️ ← Drag to move                               │    │
│  │      Sofa                                             │    │
│  │      (2.0m × 0.9m)                                    │    │
│  │                                                       │    │
│  │         🪑                                            │    │
│  │      Coffee Table                                     │    │
│  │      (1.2m × 0.7m)                                    │    │
│  │                                                       │    │
│  │  ════≡ Room boundary (5.2m × 4.8m)                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Wall Anchor: [Against north wall ▼]                         │
│  X Offset: [0.5] m from wall                                 │
│  Rotation: [0° ▼]                                            │
│                                                               │
│  Note: All positions are relative to room center (0,0)       │
│  and auto-scaled when placed in different-sized rooms.       │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Furniture Catalog Management

### 6.1 Catalog List

```
┌──────────────────────────────────────────────────────────────┐
│  📦 Furniture Catalog                  [+ Add Item]          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Search: [🔍 Search items...]                                 │
│  Filter: [All Categories ▼]  [All Styles ▼]                  │
│                                                               │
│  ┌──────┬────────────────────┬──────────┬─────────┬────────┐ │
│  │  🛋️ │ 3-Seater Sofa      │ Seating  │ Japandi │ 2.0m   │ │
│  │  🛋️ │ Sectional Sofa     │ Seating  │ Modern  │ 2.8m   │ │
│  │  🛏️ │ King Bed           │ Beds     │ Scandi  │ 2.0m   │ │
│  │  🪑  │ Oval Coffee Table  │ Tables   │ Japandi │ 1.2m   │ │
│  │  💡  │ Floor Lamp         │ Lighting │ —       │ 0.4m   │ │
│  │  🪴  │ Monstera Plant     │ Decor    │ —       │ 0.5m   │ │
│  │  🗄️ │ TV Console          │ Storage  │ Scandi  │ 1.8m   │ │
│  └──────┴────────────────────┴──────────┴─────────┴────────┘ │
│                                                               │
│  Items: 24 total    Page 1 of 3    [← Prev] [1] [2] [3] [Next →]│
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Adding a Catalog Item

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Catalog              Add Furniture Item          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Item Name *                                                 │
│  ┌──────────────────────────────────────────────────┐       │
│  │ 3-Seater Sofa                                    │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  Type *                 Category *                  │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │ sofa ▼            │   │ seating ▼         │                │
│  └──────────────────┘   └──────────────────┘                │
│                                                               │
│  Style Tag (optional)   Dimensions (metres) *               │
│  ┌──────────────────┐   W: ┌──────┐ H: ┌──────┐ D: ┌──────┐│
│  │ japandi ▼         │   │ 2.0  │   │ 0.8  │   │ 0.9  ││
│  └──────────────────┘   └──────┘   └──────┘   └──────┘│
│                                                               │
│  Wall Anchor (optional)     Min Clearance (cm)               │
│  ┌──────────────────┐       ┌──────────────────┐            │
│  │ against ▼         │       │ 5                │            │
│  └──────────────────┘       └──────────────────┘            │
│                                                               │
│  3D Model (GLB) *                                            │
│  ┌──────────────────────────────────────────────────┐       │
│  │ [Drop GLB file here or click to upload]           │       │
│  │                                                   │       │
│  │ Max: 10MB    Format: GLB (Draco compressed)      │       │
│  │ Max triangles: 5,000                              │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  Thumbnail Image                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ [Drop image here or click to upload]              │       │
│  │ Max: 1MB   Recommended: 512×512px                │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│           [Cancel]                     [Save Item]            │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Style Presets Management

```
┌──────────────────────────────────────────────────────────────┐
│  🎨 Style Presets                        [+ New Preset]     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Scandinavian                                            │  │
│  │ ───────────────────────────                             │  │
│  │ Floor: Parquet, Light Oak                               │  │
│  │ Walls: Warm White, Matte                                │  │
│  │ Accent: Sage Green (#7A9B7A)                            │  │
│  │ Lighting: Warm 2700K                                    │  │
│  │ Furniture Tags: scandinavian                             │  │
│  │ AI Hint: "Scandinavian interior with light oak flooring │  │
│  │ and warm white walls..."                                │  │
│  │ [Edit] [Delete]                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Japandi                                                 │  │
│  │ ───────────────────────────                             │  │
│  │ Floor: Parquet, Medium Walnut                           │  │
│  │ Walls: Cream, Matte                                     │  │
│  │ Accent: Forest Green (#2D5A27)                          │  │
│  │ ...                                                     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. User Management

```
┌──────────────────────────────────────────────────────────────┐
│  👥 Users                              Total: 156           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Search: [🔍 Search by name or email...]                      │
│                                                               │
│  ┌──────┬────────────────────┬──────────────┬────────┬─────┐ │
│  │ Name │ Email              │ Projects     │ Joined │Role │ │
│  ├──────┼────────────────────┼──────────────┼────────┼─────┤ │
│  │ John │ wong.j...@gmail   │ 3            │ 2 Jun  │Admin│ │
│  │ Sarah│ sarah@example.com │ 1            │ 1 Jun  │User │ │
│  │ ...  │                    │              │        │     │ │
│  └──────┴────────────────────┴──────────────┴────────┴─────┘ │
│                                                               │
│  Actions: Promote to Admin, Suspend, Delete                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Complete Admin Workflow Reference

### 9.1 Adding a New BTO Project (End-to-End)

```
Total time: ~30 min per layout

Step 1: Create BTO Project                           (2 min)
   └→ Navigate to Admin → BTO Projects → New
   └→ Fill name, location, year, description
   └→ Upload hero image
   └→ Save

Step 2: Add First Flat Model                         (1 min)
   └→ Click into BTO project → "Add Flat Model"
   └→ Name: "4-Room Model A"
   └→ Type: 4-room, Area: 90sqm
   └→ Upload floor plan image
   └→ Save

Step 3: Annotate Rooms                              (20 min)
   └→ Click "Annotate Rooms"
   └→ Use Draw tool: click corners around Living Room
   └→ Set room type → Living
   └→ Repeat for MBR, Bedroom 2, Kitchen, Toilet 1, Toilet 2,
       Bomb Shelter, Hallway (8 rooms typical)
   └→ Place doors on wall edges
   └→ Place windows on exterior walls
   └→ Save

Step 4: Preview & Fix                                (5 min)
   └→ Click "Preview 3D"
   └→ Check: wall heights, door positions, window sills
   └→ Fix any issues → back to annotation

Step 5: Publish                                      (1 min)
   └→ Click "Publish"
   └→ Model is now available to all users

Step 6: Repeat for Model B, C...                   (30 min each)
```

### 9.2 Adding Furniture After Publishing

```
Step 1: Create Furniture Templates                  (15 min each)
   └→ Admin → Furniture Templates → New
   └→ Pick room type + style
   └→ Add items from catalog
   └→ Position in 2D overhead view
   └→ Set wall anchor rules
   └→ Publish

Step 2: Populate Furniture Catalog                  (per item)
   └→ Admin → Furniture Catalog → Add Item
   └→ Upload GLB model
   └→ Set dimensions, category, style tag
   └→ Save

Step 3: Update Style Presets                        (5 min)
   └→ Admin → Style Presets → Edit
   └→ Link furniture tags to style
   └→ Save
```

---

## 10. Mobile Considerations

The admin panel is **desktop-first**. Mobile is not a priority since this is your tool only.

| Requirement | Desktop | Mobile |
|-------------|---------|--------|
| **Dashboard** | ✅ Full layout | ✅ Simplified cards |
| **Room annotation** | ✅ Canvas + properties side-by-side | ❌ Not supported (too complex) |
| **BTO project forms** | ✅ Full | ✅ Usable |
| **Furniture templates** | ✅ Full | ✅ View only |
| **User management** | ✅ Full | ✅ Table scrolls |

**Recommendation:** Room annotation on mobile is not feasible with the polygon-drawing canvas. Always use desktop for annotation work.

---

## 11. Data Entry Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last point while drawing |
| `Double-click` | Close polygon |
| `Esc` | Cancel current drawing |
| `Delete` / `Backspace` | Delete selected room/door/window |
| `Ctrl+S` | Save current model |
| `+` / `-` | Zoom in/out on canvas |
| `1` | Select Draw tool |
| `2` | Select Select/Edit tool |
| `3` | Select Door tool |
| `4` | Select Window tool |
