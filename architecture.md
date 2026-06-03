# Architecture Document

## HDB Interior Design Web App

| Field | Value |
|-------|-------|
| **Status** | Draft v1.1 |
| **Date** | 2026-06-03 |
| **Author** | Johnathan Wong |
| **Previous** | v1.0 (initial draft) |

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                                 │
│                                                                           │
│  ┌────────────┐  ┌──────────────────────┐  ┌────────────────────────┐   │
│  │ Next.js UI  │  │  3D Engine (R3F)      │  │ Design Studio          │   │
│  │             │  │  ┌────────────────┐   │  │ ┌──────────────────┐ │   │
│  │ Landing     │  │  │ Mesh Generator │   │  │ │ AI Consultant    │ │   │
│  │ Browse      │  │  │(BufferGeom)    │   │  │ │ Chat Interface   │ │   │
│  │ Studio      │  │  │ Material Swap  │   │  │ │ Per-Room Brief   │ │   │
│  │ Gallery     │  │  │ Export/Import  │   │  │ │ Design Summary   │ │   │
│  │ Admin       │  │  │ Furniture      │   │  │ └──────────────────┘ │   │
│  └────────────┘  │  │ Placement      │   │  └────────────────────────┘   │
│                  │  └────────────────┘   │                               │
│                  └──────────────────────┘                               │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Floor Plan Annotation (react-konva) — Admin Only                 │    │
│  │  [Upload BTO Floor Plan] → [Draw Rooms] → [Label] → [Save]       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
                              │ API Calls (HTTPS)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS API ROUTES (Vercel)                           │
│                                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ BTO      │  │ Projects │  │ AI       │  │ Render   │  │ Auth     │  │
│  │ Projects │  │ CRUD     │  │ Consultant│  │ (Gemini  │  │ (NextAuth│  │
│  │ + Models │  │          │  │ (Chat    │  │  Imagen) │  │  + OAuth)│  │
│  │ CRUD     │  │          │  │  + Brief)│  │          │  │          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │             │              │              │       │
└───────┼──────────────┼─────────────┼──────────────┼──────────────┼───────┘
        │              │             │              │              │
        ▼              ▼             ▼              ▼              ▼
┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│PostgreSQL │  │Cloudflare  │  │Google Gemini │  │ Google   │  │ NextAuth │
│ (Neon)    │  │R2 (Files)  │  │API 2.5 Pro   │  │Imagen    │  │ Session  │
│           │  │            │  │(Consultant)  │  │(Renders) │  │          │
└──────────┘  └────────────┘  └──────────────┘  └──────────┘  └──────────┘
```

---

## 2. Core Components

### 2.1 AI Design Consultant

The most architecturally significant component. It is a **stateful, conversational agent** that maintains a **Design Brief JSON** across multi-turn exchanges.

```
User: "I want Japandi overall"
        │
        ▼
┌──────────────────────────────────────────┐
│  API: POST /api/ai/consult                │
│  {                                        │
│    projectId: "abc",                      │
│    message: "I want Japandi overall",     │
│    chatHistory: [...],                    │
│    currentBrief: { rooms: {} }            │
│  }                                        │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  Gemini 2.5 Pro                           │
│  System Prompt: Interior Design Consultant│
│  Input: chat history + current brief       │
│  Output: {                                 │
│    response: "Great! Light oak or dark    │
│              walnut for the floor?",      │
│    updatedBrief: { overall_vibe, rooms }  │
│  }                                        │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  Response to client:                      │
│  {                                        │
│    message: "Great! Light oak...",        │
│    briefDiff: { rooms.living.floor },     │
│    fullBrief: { ... }                     │
│  }                                        │
│                                           │
│  Client: applies briefDiff to 3D viewport │
│  (real-time material preview)             │
└──────────────────────────────────────────┘
```

**Architecture decisions:**

| Decision | Rationale |
|----------|-----------|
| **Server-side chat state** | Design brief saved to DB after each turn. User can refresh or come back later. |
| **Streaming responses** | Use Gemini streaming for typing-effect in chat. Feels more conversational. |
| **Brief diff → 3D preview** | When the AI updates the brief (e.g. "floor = light oak"), client immediately applies it to the 3D model. User sees changes in real-time. |
| **No RAG** | The AI consultant doesn't need external knowledge — it's purely conversational + structured output. |

### 2.2 Design Brief Data Model

The Design Brief is the **single source of truth** for the entire project. It flows from the AI consultant → 3D material engine → Gemini render prompt.

```typescript
interface DesignBrief {
  overallVibe: string;           // "Japandi", "Industrial", etc.
  rooms: Record<string, RoomBrief>;
  createdAt: string;
  updatedAt: string;
}

interface RoomBrief {
  roomType: string;              // "living", "kitchen", "mbr"
  label: string;                 // "Living Room"
  style: string;                 // "Japandi", "Vintage", ""
  description: string;           // Full natural language description
  wallColor: string;             // hex color or material name
  wallFinish: string;            // "matte", "satin", "textured"
  floorType: string;             // "parquet", "tiles", "laminate", "vinyl"
  floorColor: string;            // "light oak", "dark walnut", "white marble"
  accentColor: string;           // hex or material name
  furnitureStyle: string;        // "minimal", "warm", "maximalist"
  lighting: string;              // "warm 2700K", "cool 4000K", "natural"
  specialNotes: string;          // "needs study corner", "play area for kids"
  renderPrompt: string;          // Auto-constructed from above fields
}

interface FurnitureTemplatePlacement {
  templateId: string;
  roomType: string;
  roomLabel: string;
  furniture: FurnitureItem[];
  applied: boolean;              // User accepted or declined
}
```

### 2.3 Furniture Template System (Option C — MVP)

```
┌──────────────────────────────────────────────┐
│  FurnitureTemplate                            │
│  {                                            │
│    id: "scandi-living-01",                   │
│    name: "Scandinavian Living Room Set",      │
│    category: "living",                        │
│    styleTag: "scandinavian",                  │
│    roomType: "living",                        │
│    furniture: [                               │
│      { type: "sofa", label: "3-Seater Sofa", │
│        position: { x: 0, y: 0, z: 0 },       │
│        rotation: { x: 0, y: 90, z: 0 },       │
│        modelUrl: "r2://furniture/sofa.glb",  │
│        dimensions: { w: 2.0, h: 0.8, d: 0.9  │
│      },                                       │
│      { type: "coffee_table", ... },           │
│      { type: "rug", ... },                   │
│      { type: "floor_lamp", ... },            │
│      { type: "tv_console", ... }             │
│    ]                                          │
│  }                                            │
└──────────────────────────────────────────────┘

Placement Logic:
1. Fetch template matching roomType + styleTag
2. Scale furniture items relative to room dimensions
3. Position using rule-based anchors:
   - Sofa: against longest uninterrupted wall, facing TV wall
   - Bed: centered on bedroom wall, 50cm from each side
   - Dining table: center of dining area
   - Kitchen: along counter edge
4. User can accept, reject, or adjust individual pieces
```

### 2.4 Render Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  RENDER PIPELINE (Per Room)                                       │
│                                                                   │
│  Step 1: Position Camera                                          │
│  → Auto-calculate best POV for this room type                    │
│  → Living: corner view showing sofa + TV wall                    │
│  → Kitchen: from entrance, showing counter + cabinets            │
│  → MBR: from door, showing bed + window                          │
│                                                                   │
│  Step 2: Render 3D Viewport to PNG                                │
│  → Use offscreen canvas (Three.js renderer)                      │
│  → 1024×1024 at 72dpi                                            │
│  → Store as base64 or upload to R2 temporarily                   │
│                                                                   │
│  Step 3: Construct Render Prompt                                  │
│  → Read RoomBrief for this room                                   │
│  → Read FurnitureTemplatePlacement for this room                  │
│  → Combine into structured prompt:                                │
│    "Photorealistic interior... [style desc]... [furniture]..."    │
│                                                                   │
│  Step 4: Call Gemini Imagen                                       │
│  → POST /api/render                                               │
│  → Request: { image: screenshot, prompt: full_prompt }           │
│  → Response: rendered image URL (R2)                             │
│                                                                   │
│  Step 5: Save & Display                                           │
│  → Store render record in Postgres                                │
│  → Display in gallery with room label + style tag                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Architecture Decisions

| Decision | Choice | Alternative Considered | Why Chosen |
|----------|--------|----------------------|------------|
| AI Consultant state | Server-side (DB) | Client-only in-memory | User can refresh/return; shared history |
| Design Brief source | AI consultant output | User fills form directly | Conversational is faster, more creative |
| Furniture system | Curated templates | AI-generated layout | Reliable, controllable, faster MVP |
| Render engine | Gemini Imagen (img2img) | Stable Diffusion + ControlNet | Gemini has native image conditioning; simpler API |
| 3D geometry | Client-side Three.js | Server-side Python (trimesh) | No backend needed; sub-second mesh gen |
| Chat protocol | Streaming SSE | WebSocket | Simpler infrastructure; Vercel-compatible |
| BTO data model | Admin-curated | Scrape HDB website | Reliable, curated quality; no stale data |

---

## 4. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/bto` | GET | List published BTO projects |
| `/api/bto` | POST | Create BTO project (admin) |
| `/api/bto/[id]` | GET/PUT/DELETE | Single BTO project CRUD |
| `/api/bto/[id]/models` | GET | List flat models for a BTO project |
| `/api/bto/[id]/models` | POST | Create flat model (admin) |
| `/api/models/[id]` | GET | Flat model with room configs |
| `/api/models/[id]/rooms` | PUT | Update room configs (admin) |
| `/api/projects` | POST | Create new user project |
| `/api/projects/[id]` | GET/PUT | Get/update project |
| `/api/projects/[id]/brief` | PUT | Update design brief |
| `/api/projects/[id]/chat` | * | Chat history CRUD |
| `/api/ai/consult` | POST | Send msg to AI consultant |
| `/api/ai/consult/stream` | GET | SSE stream for typing effect |
| `/api/render` | POST | Trigger Gemini render for a room |
| `/api/render/[id]` | GET | Get render result |
| `/api/export` | POST | Generate Collada/OBJ download URL |
| `/api/import` | POST | Re-upload and parse .dae/.obj |
| `/api/upload` | POST | Upload file to R2 (signed URL) |
| `/api/furniture/templates` | GET | List furniture templates |
| `/api/furniture/apply` | POST | Apply furniture template to project |

---

## 5. Component Tree

```
app/
├── (public)/
│   ├── page.tsx                     # Landing page
│   ├── browse/page.tsx              # BTO project browser
│   ├── browse/[slug]/page.tsx       # BTO + flat model selector
│   └── share/[id]/page.tsx          # Public render gallery
│
├── (auth)/
│   └── login/page.tsx               # Google OAuth login
│
├── (dashboard)/
│   ├── layout.tsx                   # Auth-protected layout
│   ├── page.tsx                     # User's project list
│   └── project/
│       └── [id]/
│           ├── page.tsx             # Main studio page (viewport + chat + gallery)
│           └── export/page.tsx      # Export/import page
│
├── admin/
│   ├── login/page.tsx               # Admin login
│   ├── layout.tsx                   # Protected admin layout
│   ├── page.tsx                     # Dashboard
│   ├── bto/
│   │   ├── page.tsx                 # BTO project list
│   │   ├── new/page.tsx             # New BTO project form
│   │   └── [id]/
│   │       ├── edit/page.tsx         # Edit BTO project details
│   │       └── models/
│   │           ├── new/page.tsx      # New flat model
│   │           └── [modelId]/
│   │               └── annotate/page.tsx  # Room annotation canvas
│   └── furniture/
│       └── page.tsx                 # Furniture template manager

components/
├── ui/                              # shadcn/ui components
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── BottomNav.tsx               # Mobile
├── auth/
│   ├── LoginButton.tsx
│   ├── UserMenu.tsx
│   └── AuthGuard.tsx
├── discovery/                       # BTO project discovery
│   ├── BTOSearch.tsx
│   ├── BTOProjectCard.tsx
│   ├── FlatModelSelector.tsx
│   └── FloorPlanPreview.tsx
├── viewport/                        # 3D viewport
│   ├── Studio.tsx                   # Main studio layout (viewport + panels)
│   ├── Scene.tsx                    # R3F Canvas
│   ├── Building.tsx                 # Flat 3D model
│   ├── Room.tsx                     # Single room mesh
│   ├── Doors.tsx                    # Door geometries
│   ├── Windows.tsx                  # Window geometries
│   ├── Flooring.tsx                 # Per-room floor material
│   ├── Furniture.tsx                # Placed furniture objects
│   ├── RoomLabels.tsx               # 3D room name labels
│   ├── Controls.tsx                 # Orbit, walkthrough
│   └── CameraPresets.tsx            # Per-room camera positions
├── consultant/                      # AI design consultant
│   ├── ChatPanel.tsx                # Chat interface
│   ├── ChatMessage.tsx              # Single message bubble
│   ├── ChatInput.tsx                # Text input + send
│   ├── StylePreview.tsx             # Real-time material preview
│   ├── DesignSummary.tsx            # Current brief summary
│   └── RoomTabBar.tsx               # Switch between rooms in chat
├── furniture/                       # Furniture system
│   ├── FurnitureSelector.tsx        # Template picker
│   ├── FurnitureTemplateCard.tsx
│   ├── FurnitureItemList.tsx        # Items in selected template
│   └── PlacementToggle.tsx          # Accept/reject individual items
├── export/
│   ├── ExportPanel.tsx
│   ├── ExportButton.tsx
│   ├── ImportDropzone.tsx
│   └── FormatSelector.tsx
├── renders/                         # AI render gallery
│   ├── RenderGallery.tsx
│   ├── RenderCard.tsx
│   ├── RenderButton.tsx
│   ├── RenderLightbox.tsx
│   ├── BeforeAfterSlider.tsx
│   └── RoomRenderSelector.tsx       # Which room to render
└── admin/                           # Admin components
    ├── BTOProjectForm.tsx
    ├── FlatModelForm.tsx
    ├── RoomAnnotationCanvas.tsx
    ├── RoomPropertyPanel.tsx
    ├── FurnitureTemplateForm.tsx
    └── AdminDashboard.tsx
```

---

## 6. Data Flows

### 6.1 AI Consultant Chat

```
Client                    Next.js API               Gemini API            DB
  │                          │                         │                   │
  │  POST /api/ai/consult    │                         │                   │
  │  { msg, projectId }      │                         │                   │
  │ ──────────────────────►  │                         │                   │
  │                          │  [Load chatHistory +    │                   │
  │                          │   currentBrief from DB] │                   │
  │                          │ ─────────────────────────────────────────►  │
  │                          │ ◄─────────────────────────────────────────  │
  │                          │                         │                   │
  │                          │  POST Gemini 2.5 Pro    │                   │
  │                          │  System + History + Msg │                   │
  │                          │ ──────────────────────► │                   │
  │                          │  ◄── response + brief ──│                   │
  │                          │                         │                   │
  │                          │  [Save chat + brief]    │                   │
  │                          │ ─────────────────────────────────────────►  │
  │                          │                         │                   │
  │ ◄── SSE stream: ────────│                         │                   │
  │  { msg: "Light oak...",  │                         │                   │
  │    brief: { rooms:... }, │                         │                   │
  │    diff: { floor } }     │                         │                   │
  │                          │                         │                   │
  │  [Apply diff to 3D]      │                         │                   │
```

### 6.2 Render Generation

```
Client                    Next.js API               R2             Gemini Imagen
  │                          │                       │                   │
  │  POST /api/render        │                       │                   │
  │  { projectId, room }     │                       │                   │
  │ ──────────────────────►  │                       │                   │
  │                          │  [Capture viewport]   │                   │
  │                          │  ── render to PNG ──► │  (offscreen)      │
  │                          │                       │                   │
  │                          │  [Construct prompt]   │                   │
  │                          │  DesignBrief.rooms[r] │                   │
  │                          │  + Furniture in room  │                   │
  │                          │                       │                   │
  │                          │  POST imagen-3.0      │                   │
  │                          │  { image, prompt }    │                   │
  │                          │ ───────────────────────────────────────►  │
  │                          │                       │                   │
  │                          │  [Save to R2]         │                   │
  │                          │  ◄── output image ────│────────────────────│
  │                          │ ────────────────────► │                   │
  │                          │                       │                   │
  │                          │  [Save render record] │                   │
  │  ←── renderUrl + id ─────│                       │                   │
```

---

## 7. AI System Prompts

### 7.1 Design Consultant (Gemini 2.5 Pro)

```
You are an AI interior design consultant for Singapore HDB flats.
You help users design their home room-by-room through friendly conversation.

RULES:
1. Start broad: ask about their overall desired vibe/style
2. Never ask more than 1-2 questions at once
3. Offer specific choices ("light oak or dark walnut flooring?") — never "what floor do you want?"
4. After every 2-3 exchanges, briefly summarize what you've noted
5. Track per-room preferences independently
6. Use Singapore-appropriate materials: vinyl, laminate, homogeneous tiles, solid surface, quartz
7. Reference real HDB constraints: "Most HDB living rooms are ~4m×5m, so a 2.5m sofa fits well"
8. When user says "I'm happy" or "looks good", present the full design brief for confirmation

OUTPUT FORMAT (respond in JSON):
{
  "message": "Your conversational response here...",
  "brief": { /* full updated DesignBrief JSON */ },
  "briefDiff": { /* only changed fields from previous brief */ }
}
```

### 7.2 Render Prompts (Gemini Imagen)

```
For each room, construct a prompt like:

"Photorealistic interior render of a {roomLabel} in a Singapore HDB flat.
Style: {style}.
{description}
Floor: {floorType}, {floorColor}.
Walls: {wallColor}, {wallFinish} finish.
Accent color: {accentColor}.
Furniture: {furnitureStyle} style with {furniture description from template}.
Lighting: {lighting} tone.
Natural light from window on {window wall}.
Camera: eye level, wide angle lens. Professional photography lighting.
High resolution, realistic textures, depth of field."
```

---

## 8. Furniture Template System Detail

### Template Design

Furniture templates are pre-designed room layouts that the AI matches to the user's room + style.

```
Template Matching Logic:
  1. Filter by roomType === current room's roomType
  2. Filter by styleTag === current room's style (or null for universal)
  3. Score by: dimension fit (room area vs template total footprint)
  4. Pick highest-scoring template
  5. Scale furniture positions proportionally to room dimensions
  6. Anchor furniture to walls:
     - sofa: back to wall, 10cm gap
     - bed: headboard to wall, 50cm side clearance
     - dining: center of room, 90cm from walls for chairs

Fallback: If no matching template, show empty room with note "No
furniture template available for this style yet"
```

### Initial Template Scope (MVP)

| Room Type | Style | Items |
|-----------|-------|-------|
| Living - Scandi | Scandinavian | Sofa, coffee table, rug, floor lamp, TV console, plant |
| Living - Japandi | Japandi | Low sofa, wooden coffee table, tatami rug, floor lamp, screen |
| Living - Industrial | Industrial | Leather sofa, metal coffee table, industrial lamp, shelf |
| MBR - Scandi | Scandinavian | Bed, nightstand ×2, wardrobe, rug, floor lamp |
| MBR - Japandi | Japandi | Low bed platform, nightstand, sliding wardrobe, paper lamp |
| Dining | Universal | Dining table, chairs ×4, pendant light |
| Kitchen | Universal | Kitchen island (if space), stool ×2 |

---

## 9. Performance

| Area | Target | Strategy |
|------|--------|----------|
| 3D model load | < 2s | Pre-merged geometry; glTF with Draco; lazy texture load |
| Chat response | < 3s | Gemini streaming; first token in < 500ms |
| Material swap | < 500ms | Only update material references; no re-mesh |
| Render generation | < 10s/room | Parallel room renders; progress callbacks |
| Collada export | < 3s | Web Worker off main thread |
| Initial bundle | < 200KB JS | Dynamic import R3F; code-split by route |

---

## 10. Security

1. **API keys**: Vercel environment variables only (Gemini, R2)
2. **OAuth**: NextAuth with Google provider; HTTPS-only cookies
3. **Admin routes**: Session-based role guard (`role: "admin"`)
4. **File uploads**: R2 signed URLs with 15-minute expiry
5. **Rate limits**: Render: 10/min/session; Chat: 30/min/session; Upload: 5/min/session
6. **CSP**: Strict Content Security Policy headers

---

## 11. Failure Modes

| Mode | Impact | Mitigation |
|------|--------|------------|
| Gemini API down | Consultant + renders fail | Show "Service unavailable, try again later"; cache last brief |
| Gemini returns bad JSON | Consultant breaks | Retry with "Please format as valid JSON"; fallback to text-only mode |
| WebGL not supported | 3D viewport blank | Detect on load; show 2D floor plan view as fallback |
| SketchUp export fails | File corrupt | Retry with OBJ format; show user-friendly error |
| Furniture template doesn't fit room | Objects clip through walls | Auto-scale to 90% of room size; add margin check |
