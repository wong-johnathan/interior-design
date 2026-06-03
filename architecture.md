# Architecture Document

## HDB Interior Design Web App

| Field | Value |
|-------|-------|
| **Status** | Draft v1.0 |
| **Date** | 2026-06-03 |
| **Author** | Johnathan Wong |

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                           │
│                                                                   │
│  ┌──────────┐  ┌──────────────────────┐  ┌──────────────────┐   │
│  │ Next.js  │  │  3D Engine (R3F)      │  │ Style Studio     │   │
│  │ Pages/UI │  │  ┌────────────────┐   │  │ ┌──────────────┐│   │
│  │          │  │  │ Mesh Generator │   │  │ │ Presets      ││   │
│  │ shadcn/ui│  │  │ (BufferGeom)  │   │  │ │ AI Prompt    ││   │
│  │ Tailwind │  │  │ Material Swap │   │  │ │ Apply Styles ││   │
│  │          │  │  │ Export/Import │   │  │ └──────────────┘│   │
│  └──────────┘  │  └────────────────┘   │  └──────────────────┘   │
│                └──────────────────────┘                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Floor Plan Annotation (react-konva)                      │    │
│  │  [Upload Image] → [Draw Walls] → [Label Rooms] → [Save]  │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                          │  API Calls (HTTPS)
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES (Vercel)                     │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ Templates│  │ Projects │  │ Render   │  │ Auth            │  │
│  │ CRUD     │  │ CRUD     │  │ Proxy    │  │ (NextAuth.js)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬─────────┘  │
│       │              │             │                │             │
└───────┼──────────────┼─────────────┼────────────────┼─────────────┘
        │              │             │                │
        ▼              ▼             ▼                ▼
┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────┐
│PostgreSQL │  │Cloudflare  │  │Google Gemini │  │ NextAuth │
│ (Neon)    │  │R2 (Files)  │  │API (Imagen)  │  │ Session  │
└──────────┘  └────────────┘  └──────────────┘  └──────────┘
```

### Key Architectural Decision: No Separate Backend

Unlike many 3D web apps, this project does **not** require a separate Python/FastAPI server or a Redis queue. All geometry processing is done client-side in Three.js:

| Operation | Where | Why |
|-----------|-------|-----|
| 3D Mesh Generation | Browser (R3F) | Room data is simple polygons; BufferGeometry is instant |
| Collada Export | Browser (Three.js exporter) | Runs in a Web Worker, no server load |
| Collada Import | Browser (Three.js loader) | Parses geometry client-side |
| Material Swapping | Browser (R3F) | Three.js PBR materials update in real-time |
| Gemini Rendering | Next.js API route (proxy) | Hides API key; response streams back to client |
| File Storage | Next.js API route → R2 | Signed URLs for direct upload/download |

This keeps the architecture **simple, deployable on Vercel alone**, and avoids the operational cost of managing a Python service.

---

## 2. Detailed Component Architecture

### 2.1 Frontend Architecture

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── browse/                   # Flat type browsing
│   │   ├── page.tsx
│   │   └── [templateId]/
│   │       └── page.tsx
│   ├── studio/
│   │   └── [projectId]/
│   │       └── page.tsx          # Main 3D studio page
│   ├── admin/                    # Admin panel (protected)
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── templates/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   └── layout.tsx
│   └── api/                      # API routes
│       ├── auth/                 # NextAuth
│       ├── templates/route.ts
│       ├── projects/route.ts
│       ├── render/route.ts       # Gemini proxy
│       └── upload/route.ts       # R2 signed upload
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── viewport/                 # 3D viewport components
│   │   ├── Scene.tsx             # R3F Canvas setup
│   │   ├── Building.tsx          # Main 3D model mesh
│   │   ├── Room.tsx              # Individual room mesh
│   │   ├── Doors.tsx             # Door geometries
│   │   ├── Windows.tsx           # Window geometries
│   │   ├── Flooring.tsx          # Floor material per room
│   │   ├── Controls.tsx          # Orbit, pan, zoom
│   │   └── Walkthrough.tsx       # First-person mode
│   ├── annotation/               # Floor plan annotation
│   │   ├── Canvas.tsx            # react-konva canvas
│   │   ├── WallTool.tsx          # Wall drawing tool
│   │   ├── RoomLabeler.tsx       # Room type selector
│   │   └── DimensionInput.tsx    # Room size input
│   ├── styles/                   # Style engine
│   │   ├── PresetSelector.tsx    # Style preset cards
│   │   ├── PromptInput.tsx       # AI style text input
│   │   ├── MaterialPreview.tsx   # Before/after comparison
│   │   └── ColorPicker.tsx       # Manual colour override
│   ├── export/                   # Export/import
│   │   ├── ExportButton.tsx      # Collada download
│   │   ├── ImportButton.tsx      # Re-upload handler
│   │   └── FormatSelect.tsx      # Format picker
│   ├── renders/                  # Render gallery
│   │   ├── RenderCard.tsx        # Single render thumbnail
│   │   ├── RenderGallery.tsx     # Grid of room renders
│   │   └── RenderButton.tsx      # Trigger Gemini render
│   └── admin/                    # Admin panel components
│       ├── TemplateList.tsx
│       ├── TemplateForm.tsx
│       └── RoomEditor.tsx
│
├── lib/                          # Utilities
│   ├── mesh/                     # 3D mesh generation
│   │   ├── generateWalls.ts      # Wall→BufferGeometry
│   │   ├── generateFloor.ts      # Floor slab
│   │   ├── generateCeiling.ts    # Ceiling slab
│   │   ├── generateDoors.ts      # Door openings
│   │   └── generateWindows.ts    # Window openings
│   ├── materials/                # Material definitions
│   │   ├── palettes.ts           # Style palette data
│   │   ├── presets.ts            # Preset style configs
│   │   └── textures.ts           # Texture URL mappings
│   ├── export/                   # File operations
│   │   ├── exportCollada.ts      # Three.js → Collada
│   │   ├── exportOBJ.ts          # Three.js → OBJ
│   │   └── importModel.ts        # Uploaded file → Three.js
│   ├── ai/                       # AI integration
│   │   ├── gemini.ts             # Gemini API client
│   │   ├── stylePrompt.ts        # Prompt → style params
│   │   └── renderRoom.ts         # Room view → render
│   ├── r2.ts                     # Cloudflare R2 helpers
│   └── utils.ts                  # Shared utilities
│
├── hooks/                        # Custom hooks
│   ├── useMeshGeneration.ts      # Generate 3D from room data
│   ├── useStyleApplication.ts    # Apply style to materials
│   ├── useExport.ts              # Export lifecycle
│   └── useGeminiRender.ts        # Render lifecycle
│
├── store/                        # Zustand stores
│   ├── projectStore.ts           # Current project state
│   ├── styleStore.ts             # Active style config
│   └── viewportStore.ts          # Camera/view settings
│
├── prisma/                       # Prisma schema
│   └── schema.prisma
│
└── types/                        # TypeScript types
    ├── template.ts               # Template & RoomConfig types
    ├── project.ts                # Project types
    ├── render.ts                 # Render types
    ├── material.ts               # Material & style types
    └── geometry.ts               # 3D geometry types
```

### 2.2 Mesh Generation Pipeline (Client-Side)

The heart of the app: converting room annotation polygons into a 3D mesh.

```
RoomConfig.vertices (2D polygon)
         │
         ▼
  Extrude to 3D (wallHeight = 2.8m)
         │
    ┌────┴────┐
    ▼         ▼
 Wall Mesh  Floor Mesh
 (sides)    (planar)
    │         │
    └────┬────┘
         ▼
  Add Door Openings
  (subtract boxes from wall mesh)
         │
         ▼
  Add Window Openings
  (subtract boxes from wall mesh)
         │
         ▼
  Apply Materials per RoomConfig
  (wallColor, floorType, floorColor)
         │
         ▼
  Merge into Single Unit Mesh
  (merge geometries, deduplicate vertices)
         │
         ▼
  3D Model ready for R3F display
```

This is done entirely with Three.js `BufferGeometry` operations:
- `ExtrudeGeometry` for walls from polygons
- `ShapeGeometry` for floors and ceilings
- `CSG` (Constructive Solid Geometry) via Three.js CSG for door/window cutouts
- `mergeGeometries` for combining room meshes

---

## 3. Data Flow Diagrams

### 3.1 Admin: Creating a Template

```
Admin                     Next.js API              R2              Postgres
  │                          │                    │                  │
  │  [Upload floor plan]     │                    │                  │
  │ ─────────────────────►   │                    │                  │
  │                          │  [Store image]     │                  │
  │                          │ ──────────────────► │                  │
  │                          │ ◄────────────────── │ (signed URL)    │
  │                          │                    │                  │
  │ ←── image preview ───────│                    │                  │
  │                          │                    │                  │
  │  [Draw rooms on canvas]  │                    │                  │
  │  [Label rooms]           │                    │                  │
  │  [Set dimensions]        │                    │                  │
  │                          │                    │                  │
  │  [Save Template]         │                    │                  │
  │ ─────────────────────►   │                    │                  │
  │                          │  [INSERT template]  │                  │
  │                          │ ──────────────────────────────────►   │
  │                          │ ◄──────────────────────────────────   │
  │ ←── template created ────│                    │                  │
```

### 3.2 User: Full Pipeline

```
User                    Next.js App              R3F/Three.js      Gemini API
  │                         │                        │                 │
  │  [Select flat type]     │                        │                 │
  │ ───────────────────►    │                        │                 │
  │  ←── template data ─────│                        │                 │
  │                         │                        │                 │
  │  [View 3D Model]        │   ──── mesh gen ───►  │                 │
  │                         │   ◄── model ready ──── │                 │
  │                         │                        │                 │
  │  [Pick Style]           │                        │                 │
  │  ───────────────────►   │   ── swap materials ──►│                 │
  │  ←── style applied ─────│   ◄── updated ──────── │                 │
  │                         │                        │                 │
  │  [Export to SketchUp]   │                        │                 │
  │                         │   ── Collada exp ────► │                 │
  │  ←── .dae download ─────│                        │                 │
  │                         │                        │                 │
  │  [Edit in SketchUp]     │                        │                 │
  │                         │                        │                 │
  │  [Re-import .dae]       │                        │                 │
  │  ───────────────────►   │   ── Collada imp ────► │                 │
  │  ←── merged model ──────│   ◄── parsed ──────── │                 │
  │                         │                        │                 │
  │  [Generate Render]      │                        │                 │
  │  ───────────────────►   │                        │                 │
  │                         │  ── screenshot ──────► │                 │
  │                         │  ◄── base image ────── │                 │
  │                         │                        │                 │
  │                         │  ── render req ──────────────────────►  │
  │                         │  ◄── rendered img ─────────────────────│
  │  ←── render ready ──────│                        │                 │
```

---

## 4. Tech Stack Deep Dive

### 4.1 Frontend

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 16 | App Router, API routes, server components |
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Three.js | r160+ | 3D rendering engine |
| @react-three/fiber | 9.x | React renderer for Three.js |
| @react-three/drei | 10.x | R3F utilities (OrbitControls, etc.) |
| @react-three/postprocessing | 3.x | Bloom, ambient occlusion post-processing |
| three-mesh-bvh | Latest | BVH acceleration for raycasting |
| zustand | 5.x | State management |
| react-konva | 19.x | 2D canvas for floor plan annotation |
| shadcn/ui | Latest | UI components (button, card, dialog, etc.) |
| Tailwind CSS | 4.x | Utility-first CSS |
| next-auth | 5.x | Authentication |
| @prisma/client | 6.x | Database ORM |
| @google-cloud/aiplatform | Latest | Gemini API client (or direct fetch) |

### 4.2 Database (PostgreSQL via Neon)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `User` | Accounts & auth | id, email, role |
| `Template` | HDB layout definitions | id, name, flatType, imageUrl, scale |
| `RoomConfig` | Room within a template | id, templateId, label, roomType, vertices, floorHeight, wallColor, floorType, floorColor |
| `Project` | User project | id, userId, templateId, stylePrompt, stylePreset |
| `Render` | Generated renders | id, projectId, room, imageUrl, prompt, resolution |
| `StylePreset` | Predefined styles | id, name, description, palette, promptHint |
| `Session` | NextAuth sessions | id, sessionToken, userId, expires |

### 4.3 File Storage (Cloudflare R2)

| Bucket | Contents | Access Pattern |
|--------|----------|----------------|
| `floor-plans` | Uploaded HDB floor plan images | Signed URLs (admin upload, user view) |
| `models` | Exported 3D models (.dae, .obj) | Direct download (short-lived) |
| `renders` | Gemini-generated interior images | Signed URLs (user gallery) |
| `textures` | Material textures (tile, wood, etc.) | Public CDN |

### 4.4 AI Services (Google Gemini)

| API | Model | Use Case | Cost Model |
|-----|-------|----------|------------|
| **Imagen** | `imagen-3.0-generate-001` | Photorealistic interior renders from base image + prompt | Per-image pricing |
| **Gemini** | `gemini-2.5-pro` | Parse natural language style prompt → structured parameters | Per-token (cheap) |

**Gemini Render Flow:**

```
1. Capture viewport screenshot (user's current 3D view) → base image (PNG)
2. Combine with style prompt: "Make this living room Scandinavian with oak flooring, white walls, and a navy accent wall"
3. Send to Gemini Imagen API: imagen-3.0-generate-001(base_image, prompt, aspect_ratio)
4. Return generated image → store in R2 → display in gallery
```

The Gemini API supports **image conditioning** (img2img), which means it uses the 3D model's geometry and lighting as a base and re-styles it, rather than generating from scratch. This is ideal for interior design — the room layout stays accurate while materials, furniture, and lighting change.

---

## 5. Performance Considerations

### 5.1 3D Model Optimization

| Strategy | Implementation |
|----------|---------------|
| **Geometry merging** | All rooms merged into single `BufferGeometry` after generation |
| **Instanced meshes** | Repeated objects (light switches, outlets) use InstancedMesh |
| **LOD** | Lower polygon count when camera is far |
| **Draco compression** | glTF export with Draco for fast loading (if needed) |
| **Texture atlas** | All room textures packed into single atlas |

### 5.2 Render Pipeline Optimization

| Strategy | Implementation |
|----------|---------------|
| **Thumbnail capture** | Render to offscreen canvas (not user's screen) |
| **Web Workers** | Export/import operations off main thread |
| **Lazy loading** | Only load visible rooms' textures |
| **Progressive rendering** | Show low-res placeholder while Gemini generates |

---

## 6. Security Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Security Layers                        │
│                                                         │
│  1. API Key Protection                                  │
│     - Gemini API key → Vercel env vars only             │
│     - R2 access keys → Vercel env vars only             │
│     - No keys exposed to client JavaScript              │
│                                                         │
│  2. Authentication (NextAuth)                           │
│     - Admin routes: require session + admin role        │
│     - User routes: optional auth for MVP                │
│     - Session tokens: HTTP-only cookies                 │
│                                                         │
│  3. File Upload Security                                │
│     - R2 signed URLs: time-limited (15 min)             │
│     - File type validation: PNG, JPG, PDF, DAE, OBJ     │
│     - File size limit: 50 MB per upload                 │
│                                                         │
│  4. API Rate Limiting                                   │
│     - Render endpoint: 10 req/min per session           │
│     - Upload endpoint: 5 req/min per session            │
│     - Auth endpoint: 3 req/min per IP                   │
│                                                         │
│  5. CORS & CSP                                          │
│     - Strict CSP headers                                │
│     - CORS: allow own domain only                       │
└────────────────────────────────────────────────────────┘
```

---

## 7. Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│                   Vercel                             │
│                                                      │
│  ┌────────────┐   ┌──────────────────────────────┐  │
│  │  Edge       │   │  Serverless Functions         │  │
│  │  (Static)  │   │  - /api/* routes              │  │
│  │  - Landing  │   │  - NextAuth handlers          │  │
│  │  - Static   │   │  - Render proxy               │  │
│  │    assets   │   │  - Upload handlers            │  │
│  └────────────┘   └──────────────────────────────┘  │
│                                                      │
│  Client Components (dynamic):                        │
│  - /studio/[id]        (3D viewport)                │
│  - /admin/*            (dashboard + editor)         │
│  - /browse             (template browser)            │
│                                                      │
│  Server Components (SSR/SSG):                        │
│  - /                   (landing page)               │
│  - /browse/[id]        (template detail)            │
└────────────────────────────────────────────────────┘
         │
         │ Environment Variables (Vercel)
         ├── GEMINI_API_KEY
         ├── R2_ACCESS_KEY_ID
         ├── R2_SECRET_ACCESS_KEY
         ├── R2_BUCKET_NAME
         ├── DATABASE_URL (Neon)
         └── NEXTAUTH_SECRET
```

### 7.1 CI/CD Pipeline

```
Git Push (main)
    │
    ▼
GitHub Action: Lint + Type Check
    │
    ▼
Vercel: Preview Deployment (staging)
    │
    ▼
Vercel: Production Deployment (main branch)
    │
    ▼
Cloudflare R2: Textures + Static assets via CDN
```

---

## 8. Failure Modes & Mitigations

| Failure Mode | Impact | Mitigation |
|-------------|--------|------------|
| Gemini API down | Renders fail | Cache recent renders; show error with retry button |
| R2 unavailable | Uploads/downloads fail | Retry with exponential backoff; show user-friendly error |
| Neon DB slow | Template loading delayed | Prisma connection pooling; query caching with React Query |
| Browser lacks WebGL | 3D viewport blank | Detect WebGL on load; show fallback 2D floor plan view |
| Collada re-import fails | User loses SketchUp edits | Store original .dae in R2; support re-upload |
| Large floor plan image | Annotation canvas lags | Downscale to 2048px max dimension on upload |

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **BTO** | Build-To-Order, HDB's flat allocation scheme |
| **Collada (.dae)** | XML-based 3D interchange format; native SketchUp Pro import |
| **Imagen** | Google's text-to-image AI model (via Gemini API) |
| **PBR** | Physically Based Rendering — material system that responds to lighting realistically |
| **R3F** | React Three Fiber — React renderer for Three.js |
| **BufferGeometry** | Three.js class for storing vertex data (positions, normals, UVs) |
| **CSG** | Constructive Solid Geometry — boolean operations on meshes (union, subtract, intersect) |
| **Signed URL** | Time-limited access URL for private R2 objects |
| **ExtrudeGeometry** | Three.js operation that turns a 2D shape into a 3D volume |
