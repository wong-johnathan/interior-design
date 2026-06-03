# User Experience Guide

## HDB Interior Design Web App

| Field | Value |
|-------|-------|
| **Status** | Draft v1.0 |
| **Date** | 2026-06-03 |
| **Author** | Johnathan Wong |

---

## 1. User Journey Map

```
 ┌────────────┐     ┌────────────┐     ┌──────────────┐     ┌────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
 │  Sign Up    │ ──► │  BTO/Buy   │ ──► │  3D Model    │ ──► │  AI Design  │ ──► │  Furnish or  │ ──► │  Photoreal   │ ──► │  Gallery &   │
 │  (OAuth)    │     │  Project   │     │  Preview    │     │  Consultant │     │  Export      │     │  Renders     │     │  Share       │
 └────────────┘     └────────────┘     └──────────────┘     └────────────┘     └─────────────┘     └──────────────┘     └──────────────┘
                         │                   │                   │                   │                   │                   │
                     Search BTO         See empty 3D         Chat about          Pick furniture      Generate           View renders
                     by project name    flat with all        style per room       template or         per-room           Download /
                         │             room labels            │  export to       realistic images     share link
                         ▼                   ▼                   ▼            SketchUp ▼                   ▼                   ▼
                    Select flat         Orbit / zoom /       AI asks Qs,        Template places     Gemini Imagen       Public gallery
                    type (4/5 rm)      walkthrough          user answers        furniture in         transforms 3D       with before/
                         │                   │             brief builds         correct spots        view + brief        after slider
                     Floor plan         Real-time           per room                  │            → styled photo
                     preview            material             │                   OR user exports           │
                         │             preview from          │                   to SketchUp,         Options:
                         ▼             brief changes         ▼                   edits, re-import     download full res
                    Ready to                          User says "I'm                              share link
                    start styling?                     happy!" → Brief                            regenerate
                                                        finalized
```

---

## 2. Screens & States

### Screen 1: Landing Page

| State | What User Sees |
|-------|---------------|
| **Default** | Hero: "Design your dream HDB home in minutes" + "Get Started" button |
| **Logged out** | "Sign in with Google" CTA |
| **Logged in** | "Continue to your projects" or "Start a new design" |

**Mobile:** Single column, hero image full-width, CTA prominent at bottom.

---

### Screen 2: BTO Project Discovery

| UI Element | Description |
|------------|-------------|
| **Search bar** | "Search your BTO project name..." with autocomplete |
| **Filter chips** | By year (2024, 2025, 2026), by location (Kallang, Queenstown, Jurong) |
| **Project cards** | Image thumbnail, project name, location, year, "N models available" badge |
| **Empty state** | "Can't find your project? Check back soon — we add new BTOs regularly" |
| **CTA** | Click card → expand to show available flat models |

**States:**

| State | Message |
|-------|---------|
| **Loading** | Skeleton cards × 4 |
| **No results** | "No BTO projects match your search. Try a different location or check back soon." |
| **Error** | "Couldn't load BTO projects. Check your connection and try again." |
| **Success** | Grid of project cards |

**Mobile:** Stacked cards, search at top, filter as horizontal scroll chips.

---

### Screen 3: Flat Model Selector

```
┌────────────────────────────────────────────────────┐
│  ← Back to projects                  Verandah Kallang 2024  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Floor Plan Preview (image)                         │    │
│  │                                                      │    │
│  │         [Living] [MBR] [Bed2] [Kitchen]              │    │
│  │         Room labels overlaid on floor plan           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Available Models:                                            │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ 4-Room Model A│  │ 4-Room Model B│                         │
│  │ 90 sqm       │  │ 92 sqm       │                           │
│  │ 3 bedrooms   │  │ 3 bedrooms   │                           │
│  │ Selected ████ │  │              │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                               │
│  [Start Designing →]                                          │
└────────────────────────────────────────────────────────────────┘
```

**Key UX rule:** The user should be able to see the floor plan layout at a glance, with room labels clearly marked. This is their "ah, that's my flat" moment.

---

### Screen 4: 3D Studio (Main Design Screen)

This is the **core screen** where most time is spent. It has a 3-panel layout on desktop:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Studio Header: Project name | Save | Room selector dropdown | ...  │
├────────────────┬─────────────────────────────────────────────────────┤
│                │                                                      │
│  CHAT PANEL    │              3D VIEWPORT                              │
│  (collapsible) │                                                       │
│                │                                                       │
│  ┌──────────┐  │       ┌─────────────────────────────────┐            │
│  │ AI: "I   │  │       │  [🧑‍🦱 Orbit Controls]            │            │
│  │ love the │  │       │                                 │            │
│  │ Scandi   │  │       │    🏠 Building in 3D             │            │
│  │ look!    │  │       │                                 │            │
│  │ Light    │  │       │   [Living]   [MBR]              │            │
│  │ oak or   │  │       │   ┌────┐    ┌────┐              │            │
│  │ dark     │  │       │   │    │    │    │              │            │
│  │ walnut?  │  │       │   └────┘    └────┘              │            │
│  └──────────┘  │       │                                 │            │
│                │       │   [Kitchen]                     │            │
│  ┌──────────┐  │       │                                 │            │
│  │ You:     │  │       └─────────────────────────────────┘            │
│  │ "Light   │  │                                                       │
│  │ oak,     │  │  ┌──────────────────────────────────────────┐        │
│  │ but      │  │  │  DESIGN BRIEF SUMMARY                      │        │
│  │ kitchen  │  │  │  Living: Japandi 🌿  Kitchen: Vintage 🪴   │        │
│  │ green"   │  │  │  MBR: Japandi        Bed 2: Kid/Colorful  │        │
│  └──────────┘  │  └──────────────────────────────────────────┘        │
│                │                                                       │
│  [Input...]    │  [Auto-Furnish] [Export] [Render] [Gallery]          │
├────────────────┴─────────────────────────────────────────────────────┤
│  Action Bar: Chat (expand) | Furnish | Export | Render | Gallery     │
└──────────────────────────────────────────────────────────────────────┘
```

**Mobile Layout:**

```
┌─────────────────────────────────────┐
│  Studio Header                      │
├─────────────────────────────────────┤
│                                     │
│   3D VIEWPORT (full width)          │
│                                     │
│  [Orbit Controls — floating]        │
│                                     │
├─────────────────────────────────────┤
│  Design Summary (collapsed bar)     │
│  Living: Japandi | Kitchen: Vintage │
├─────────────────────────────────────┤
│  [💬 Chat] [🪑 Furnish] [📷 Render] │
└─────────────────────────────────────┘
 → Chat opens as bottom sheet overlay
 → Tap room on 3D → camera snaps to it
```

**States:**

| State | Message |
|-------|---------|
| **Loading 3D** | "Generating your BTO flat..." spinner |
| **3D Ready** | Full interactive model visible |
| **Chat waiting** | AI consultant typing indicator |
| **Brief updating** | Brief summary panel animates change |
| **Furniture placing** | "Furnishing rooms with [Style] templates..." |
| **Exporting** | Progress bar + "Preparing your SketchUp file..." |
| **Rendering** | "AI is creating your photorealistic render (~10s)" |

---

### Screen 5: AI Consultant Chat

**Visual design principles:**

- Chat bubbles: AI is left-aligned with avatar (interior designer icon), user is right-aligned
- AI messages always end with a question (2-3 choices max)
- When the AI updates the design brief, a small animated preview shows the material change in the 3D viewport
- "I'm happy" button appears once at least all rooms have a minimal style defined

**Example conversation:**

```
┌─ AI ─────────────────────────────────────┐
│  Welcome! Let's design your Verandah     │
│  Kallang 4-Room flat. What overall       │
│  vibe are you going for?                 │
│                                          │
│  [🌿 Japandi] [🏭 Industrial] [❄️ Minimalist] │
│  [🌊 Coastal] [🪴 Describe yourself...] │
└──────────────────────────────────────────┘

┌─ You ────────────────────────────────────┐
│ I want Japandi overall, but the kitchen  │
│ should be vintage green tiles            │
└──────────────────────────────────────────┘
    ↻ Brief updates in background
    ↻ Living room walls → warm white
    ↻ Brief summary flashes change

┌─ AI ─────────────────────────────────────┐
│  Great choices! I've set the main areas   │
│  to Japandi: light oak flooring, warm    │
│  white walls.                            │
│                                          │
│  For the kitchen with vintage green      │
│  tiles — should the cabinets be dark     │
│  wood or white?                          │
│                                          │
│  [Dark wood] [White] [Something else...] │
└──────────────────────────────────────────┘
```

**States:**

| State | What Happens |
|-------|-------------|
| **AI typing** | Animated dots in AI bubble |
| **Brief update** | 3D viewport material changes smoothly |
| **User idle > 30s** | AI suggests: "Would you like me to suggest some styles?" |
| **All rooms styled** | "I'm Happy!" button becomes active |
| **User says "I'm happy"** | AI summarizes full brief, shows final render preview prompts |

---

### Screen 6: Furniture Selection & Tweak Mode

Two modes: **Quick Apply** (AI places everything) or **Tweak Mode** (drag-to-place, LAVU-style).

#### Mode A: Quick Apply

```
┌────────────────────────────────────────────────┐
│  Furniture: Living Room                        │
│  Style: Japandi                                │
│                                                │
│  Recommended Template:                         │
│  ┌────────────────────────────────────────┐    │
│  │  Japandi Living Room Set                │    │
│  │  [Preview image of furniture in room]   │    │
│  │                                          │    │
│  │  ✅ Low wooden sofa                      │    │
│  │  ✅ Oval coffee table                    │    │
│  │  ✅ Tatami rug                           │    │
│  │  ✅ Floor lamp                           │    │
│  │  ✅ TV console                           │    │
│  │                                          │    │
│  │  [Apply & Continue]  [Tweak Mode ▼]     │    │
│  └────────────────────────────────────────┘    │
│                                                │
│  Alternative:                                  │
│  [Minimalist Living Set] [Export to SketchUp]  │
└────────────────────────────────────────────────┘
```

#### Mode B: Tweak Mode (Drag-to-Place)

When user enters Tweak Mode, the 3D viewport transforms:

```
┌───────────────────────────────────────────────────────────────┐
│  [Done Tweaking] [Undo] [Redo] [Reset]          Living Room   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│            ┌──────────────────────┐                           │
│            │          Wall snap ──│─── [15cm ✅]             │
│            │     🛋️               │                           │
│            │    Sofa  ← dragging  │  💡 Floor Lamp           │
│            │                      │                           │
│            │         ┌──────┐     │                           │
│            │         │ Table│     │  🪴 Plant                │
│            │         └──────┘     │                           │
│            └──────────────────────┘                           │
│                       ════ Grid overlay (25cm)                │
│                                                               │
│  Room dims: 5.2m × 4.8m                                      │
├───────────────────────────────────────────────────────────────┤
│  [🛋️ Catalog ➜]    Tap furniture to move. Drag handles.      │
└───────────────────────────────────────────────────────────────┘
```

**Interaction states:**

| Action | Visual Feedback |
|--------|----------------|
| **Hover over furniture** | Glow outline + cursor change to grab |
| **Start dragging** | Ghost preview (40% opacity) at current position; original stays as reference |
| **Snap preview** | Ghost snaps to nearest grid/wall position; green tint = valid, red = collision |
| **Drop in invalid position** | Furniture returns to original position; red flash |
| **Drop in valid position** | Furniture slides to snapped position; green checkmark toast |
| **Rotate** | Rotation ring appears; snap at 45° increments |
| **Long-press / right-click** | Context menu with: Swap, Remove, Rotate, Copy |

#### Furniture Catalog Panel

```
┌──────────────────────────────────────────────┐
│  🛋️ Furniture Catalog        🔍 Search...   │
│──────────────────────────────────────────────│
│                                              │
│  Seating   │  🛋️ 3-Seater Sofa     [4]     │
│            │  🛋️ Sectional Sofa    [2]     │
│  Tables    │  🛋️ Loveseat         [3]     │
│            │  🛋️ Chaise Lounge     [1]     │
│  Lighting  │────────────────────────────────│
│            │  Filter by style: [Japandi ▼]  │
│  Decor     │  Sort by: [Popularity ▼]       │
│            │                                │
│  Storage   │  Drag any item into the room   │
│            │  to place it!                  │
└──────────────────────────────────────────────┘
```

**Swap flow:**
1. Right-click sofa → "Swap Item"
2. Catalog panel opens filtered to Seating category
3. Click sectional sofa → preview in place (ghost)
4. Confirm → old sofa removed, new one appears
5. Fine-tune position by dragging

**Add new flow:**
1. Open catalog panel
2. Drag "Floor Lamp" from panel into 3D viewport
3. Ghost appears at cursor position on floor
4. Release to place; snap to nearest valid position

### Screen 7: Export Options

```
┌────────────────────────────────────────────┐
│  Export Your Model                          │
│                                             │
│  What to export:                            │
│  ○ Empty shell (walls only)                 │
│  ● With furniture (current design)          │
│  ○ With current materials only              │
│                                             │
│  Format:                                     │
│  ● Collada (.dae) — SketchUp Pro            │
│  ○ OBJ (.obj) — Universal                   │
│                                             │
│  [Download ↓]                               │
│                                             │
│  ┌─ Tips ────────────────────────────────┐  │
│  │  • Opens directly in SketchUp Pro     │  │
│  │  • Each room is a named group          │  │
│  │  • Furniture is separate group layer   │  │
│  │  • Don't rename or delete rooms        │  │
│  └────────────────────────────────────────┘  │
│                                             │
│  ┌─ Re-import ──────────────────────────┐   │
│  │  [Upload your edited .dae here]       │   │
│  │  Drag & drop or click to browse       │   │
│  │  - or -                               │   │
│  │  [Continue with current design]       │   │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

### Screen 8: Photorealistic Renders Gallery

```
┌──────────────────────────────────────────────────────────┐
│  Your Renders                                 [Batch All] │
│                                                           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │        │ │        │ │        │ │        │              │
│  │ Living │ │  MBR   │ │ Bed 2  │ │ Kitchen│              │
│  │ Room   │ │        │ │        │ │        │              │
│  │        │ │        │ │        │ │        │              │
│  │   🖼️   │ │   🖼️   │ │   🖼️   │ │   🖼️   │              │
│  │        │ │        │ │        │ │        │              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│                                                           │
│  ┌─ Before/After Slider ───────────────────────────────┐  │
│  │                                                     │  │
│  │     ┌──────┐      ┌──────┐                          │  │
│  │     │Empty │  ◄──► │Styled│                          │  │
│  │     └──────┘      └──────┘                          │  │
│  │                                                     │  │
│  │  [Download HD] [Share Link] [Regenerate]            │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**States:**

| State | Message |
|-------|---------|
| **No renders yet** | "Generate your first render to see your design come to life!" |
| **Rendering** | Progress bar per room with ETA |
| **Render complete** | Gallery grid with thumbnails |
| **Render failed** | "Couldn't generate this render. Try again or adjust your prompt." |
| **Batch complete** | Notification: "All rooms rendered!" |

---

## 3. Error States & Edge Cases

| Scenario | UX Response |
|----------|-------------|
| **BTO project not found** | "This BTO isn't in our library yet. Check back soon — we add new projects regularly." + "Notify me when added" button |
| **No matching furniture template** | "We don't have a furniture set for this combination yet. You can export to SketchUp and add your own." |
| **AI consultant stuck** | "I'm having trouble understanding. Could you rephrase?" After 3 retries: fallback to style preset picker |
| **Gemini render fails** | "Render failed. We've logged the issue. Try again with a simpler description." |
| **User refreshes mid-chat** | Chat history restored from DB; AI picks up where it left off |
| **WebGL not supported** | Fallback: 2D floor plan view with room colors; no 3D |
| **SketchUp file too large** | "File too large (max 50MB). Try exporting fewer rooms at once." |
| **Re-imported file unrecognized** | "Couldn't read this file. Make sure it was exported from this system and hasn't been heavily modified." |
| **Mobile + 3D performance** | Show simplified model (lower polygon count); show "Performance mode" toggle |

---

## 4. Visual Design Guide

### Colour Palette

| Role | Colour | Hex |
|------|--------|-----|
| **Primary** | Warm teal | `#0D9488` (teal-600) |
| **Secondary** | Slate | `#475569` (slate-600) |
| **Accent** | Amber | `#D97706` (amber-600) |
| **Background** | White / slate-50 | `#FFFFFF` / `#F8FAFC` |
| **Surface** | White | `#FFFFFF` |
| **Text** | Slate-900 | `#0F172A` |
| **Muted** | Slate-500 | `#64748B` |
| **Success** | Emerald | `#059669` |
| **Error** | Red | `#DC2626` |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| **H1** | 3rem / 48px | Bold |
| **H2** | 1.875rem / 30px | Semibold |
| **H3** | 1.25rem / 20px | Semibold |
| **Body** | 0.938rem / 15px | Normal |
| **Small** | 0.813rem / 13px | Normal |
| **Button** | 0.938rem / 15px | Medium |

### Key UX Patterns

| Pattern | Implementation |
|---------|---------------|
| **Loading** | Skeleton screens over spinners |
| **Errors** | Inline error + toast notification + retry button |
| **Empty states** | Illustration + helpful message + CTA |
| **Progress** | Step indicator for multi-step flows |
| **Undo** | "Undo" snackbar for 5 seconds after changes |
| **Confirm** | "Are you sure?" for destructive actions (delete project) |
| **Onboarding** | First visit: overlay tooltip pointing to chat, viewport, action bar |

---

## 5. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Keyboard navigation** | Tab through all interactive elements; Enter to activate; Escape to close modals |
| **Screen readers** | aria-labels on 3D viewport controls; alt text on renders |
| **Colour contrast** | All text meets WCAG AA (4.5:1 ratio) |
| **Focus indicators** | Visible focus ring on all interactive elements |
| **Reduced motion** | Respect `prefers-reduced-motion` for animations |

---

## 6. Copy Guide (Tone of Voice)

| Context | Tone | Example |
|---------|------|---------|
| **Landing page** | Excited, aspirational | "Turn your BTO into a home you'll love, before you even get the keys." |
| **AI consultant** | Warm, patient, knowledgeable | "I love that choice! To complement the Japandi vibe in your living room..." |
| **Error messages** | Helpful, not blame-y | "Something went wrong. We've noted it — try again?" |
| **Success moments** | Celebratory | "Your render is ready! It looks amazing 😊" |
| **Admin panel** | Functional, clear | "Draw room boundaries on the floor plan. Double-click to close a polygon." |
| **Empty states** | Encouraging, clear next step | "Your gallery is empty. Generate your first render to see your design come to life!" |
