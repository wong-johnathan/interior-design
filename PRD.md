# Product Requirements Document (PRD)

## HDB Interior Design Web App

| Field | Value |
|-------|-------|
| **Status** | Draft v1.0 |
| **Date** | 2026-06-03 |
| **Author** | Johnathan Wong |

---

## 1. Executive Summary

A web application that lets HDB homeowners generate a 3D model of their flat from standard floor plans, apply interior design styles via AI prompting, export to SketchUp for furniture placement, and produce photorealistic AI renders using Google Gemini Imagen. The system uses a curated template library of common HDB layouts (4-room, 5-room) maintained via an admin panel, eliminating the need for brittle floor-plan auto-parsing.

---

## 2. Business Objectives

| Objective | Metric | Target |
|-----------|--------|--------|
| Reduce time from floor plan to render | Session duration to first render | < 5 minutes |
| Eliminate floor plan parsing complexity | Floor plans that need custom configuration | Zero (all via admin templates) |
| Enable real-time design iteration | Style changes without re-exporting | All material swaps in-browser |
| Deliver professional-grade renders | User satisfaction on render quality | ≥ 4/5 |

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend Framework** | Next.js 16 (App Router) | User's established stack, SSR for landing, API routes |
| **3D Engine** | React Three Fiber (R3F) + Three.js | Declarative 3D for React; full control over mesh generation |
| **UI Components** | shadcn/ui + Tailwind CSS v4 | User's preferred library; rapid, consistent UI |
| **State Management** | Zustand | Lightweight, R3F-compatible, no boilerplate |
| **Floor Plan Annotation** | react-konva (Canvas overlay) | Simple wall-drawing on uploaded image |
| **Database** | PostgreSQL (Neon) + Prisma ORM | Relational schema for users, projects, templates, style presets |
| **File Storage** | Cloudflare R2 | S3-compatible, zero egress fees, fast CDN delivery |
| **3D Export** | Three.js ColladaExporter / OBJExporter | Client-side export; no backend needed |
| **AI Rendering** | Google Gemini API (Imagen) | Photorealistic interior rendering from 3D base images |
| **AI Style Parsing** | Google Gemini API (Gemini 2.5 Pro) | Natural language → structured style parameters |
| **Authentication** | NextAuth.js (Auth.js) | Email/password + OAuth providers |
| **Deployment** | Vercel (frontend + API routes) | Zero-config, edge functions, preview deploys |
| **Queue** | None (MVP) → BullMQ + Redis (v2) | Async rendering not needed until batch operations |

### 3.1 Why No Separate Python Backend?

All heavy 3D operations (mesh generation, format export/import) are handled **client-side in the browser** using Three.js:

- **Mesh generation** — Room annotation data → Three.js BufferGeometry via R3F. Trivially fast (sub-second).
- **Export** — Three.js ColladaExporter / OBJExporter produce files the user downloads directly.
- **Import** — Three.js ColladaLoader parses re-uploaded files client-side.
- **AI** — Gemini API calls are proxied through Next.js API routes (hiding the API key).

This eliminates the need for a separate Python/FastAPI server, a Redis queue, and the operational complexity of running two services. Everything lives in one Next.js app on Vercel.

---

## 4. User Personas

### 4.1 HDB Homeowner (Primary)

| Attribute | Detail |
|-----------|--------|
| **Needs** | See their flat design before renovation; compare styles |
| **Pain points** | No 3D modeling skills; ID quotes are expensive; unsure what styles work |
| **Tech level** | Low — comfortable with web apps, not CAD |
| **Conversion trigger** | "I want to see what my flat looks like in Scandinavian style" |

### 4.2 Interior Designer (Secondary)

| Attribute | Detail |
|-----------|--------|
| **Needs** | Quick client proposal renders without firing up SketchUp |
| **Pain points** | Time wasted on 3D modeling from scratch for every client |
| **Tech level** | Medium — uses SketchUp regularly |

### 4.3 Admin (You)

| Attribute | Detail |
|-----------|--------|
| **Needs** | Upload and configure new HDB floor plan templates |
| **Pain points** | HDB releases new BTO layouts every quarter |
| **Workflow** | Login → upload floor plan → draw rooms → publish template |

---

## 5. Features & Prioritization

### P0 — MVP (Must Have)

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| **Admin Login** | Secure login to admin panel | Email/password auth; session persists |
| **Floor Plan Template Admin** | Upload floor plan image, draw room boundaries, label rooms, set dimensions | Save as named template; edit existing |
| **Flat Type Selector** | User picks their flat type from available templates | Shows template name + preview image |
| **3D Model Generation** | Generate 3D model from template data (walls, floor, ceiling) | Model displays in R3F viewport with orbit controls |
| **3D Viewport** | Interactive 3D view of the unit | Orbit, pan, zoom; room labels; walkthrough mode |
| **Basic Materials** | Default wall colours and floor textures per room type | Living = parquet, Bedroom = laminate, Kitchen = tiles, Toilet = tiles |
| **Style Presets** | Predefined design styles with material/colour palettes | Scandinanian, Japandi, Industrial, Minimalist, Coastal — 5 presets minimum |
| **AI Style Prompting** | Free-text prompt to style the interior | "Warm lighting, oak flooring, navy accent wall" → applies matching materials |
| **SketchUp Export** | Download 3D model as Collada (.dae) with textures | Valid .dae file that opens in SketchUp Pro |
| **SketchUp Re-import** | Upload edited .dae back into project | Geometry merges with original; furnishings appear |
| **Photorealistic Render** | Gemini Imagen generates realistic image from model + style prompt | One render per room view; downloadable |

### P1 — Next Phase (Should Have)

| Feature | Description |
|---------|-------------|
| **User Accounts** | Sign up, save projects, revisit history |
| **Multi-view Renders** | Batch-render all rooms at once (living, MBR, bedroom 2, kitchen) |
| **Render Quality Options** | Standard (free) vs. HD (paid) vs. 4K (premium) |
| **Shareable Renders** | Public link with before/after slider |
| **Custom Floor Plans** | User uploads their own floor plan for manual annotation (no admin needed) |

### P2 — Nice to Have

| Feature | Description |
|---------|-------------|
| **360° Panorama** | VR-style walkthrough render |
| **Furniture Library** | Pre-built furniture objects user can drag into scene |
| **AR Preview** | Overlay rendered room on phone camera view |
| **Colour Palette Extraction** | Upload a reference image → AI extracts palette → applies to model |
| **Renovation Cost Estimator** | Estimate costs from selected materials + room sizes |

---

## 6. User Flows

### 6.1 Core Flow: Floor Plan to Render

```
[Landing Page]
     ↓
Select Flat Type (4-room, 5-room, etc.)
     ↓
Select Specific Layout (e.g. "4-Room BTO 2025 Model A")
     ↓
3D Model Loads in Viewport 🏠
     ↓
Choose Style: [Presets] or [Custom Prompt]
     ↓
Materials Update in Real-Time
     ↓
[Export to SketchUp] → Edit Furnishings → [Re-import]
     ↓
[Generate Photorealistic Renders]
     ↓
View / Download / Share
```

### 6.2 Admin Flow

```
[Admin Login]
     ↓
Dashboard: List of Templates
     ↓
[Add New Template]
     ↓
Upload Floor Plan Image
     ↓
Annotate Rooms (draw walls on canvas)
     ↓
Label Each Room (Living, MBR, Kitchen, Toilet 1, etc.)
     ↓
Set Dimensions (room width/height, wall height default 2.8m)
     ↓
Set Door/Window Positions
     ↓
Publish Template → Available to Users
```

---

## 7. Site Map / Routes

```
/                                    ← Landing / Hero
/browse                              ← Browse flat types & layouts
/browse/[templateId]                 ← Specific layout detail
/studio/[projectId]                  ← Main 3D studio (viewport + style controls)
/studio/[projectId]/export           ← Export/download page
/studio/[projectId]/renders          ← Rendered images gallery
/admin                               ← Admin login
/admin/dashboard                     ← Template management
/admin/templates/new                 ← Create new template
/admin/templates/[id]/edit           ← Edit template
/api/auth/*                          ← NextAuth routes
/api/templates                       ← CRUD templates
/api/projects                        ← CRUD projects
/api/render                          ← Gemini render proxy
/api/export                          ← Export file generation
```

---

## 8. Data Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("user") // "user" | "admin"
  projects  Project[]
  createdAt DateTime @default(now())
}

model Template {
  id          String          @id @default(cuid())
  name        String          // "4-Room BTO Clementi 2025"
  flatType    String          // "4-room" | "5-room"
  description String?
  imageUrl    String          // Uploaded floor plan image
  scale       Float           @default(1.0) // Pixels-to-metres ratio
  rooms       RoomConfig[]
  published   Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model RoomConfig {
  id          String   @id @default(cuid())
  template    Template @relation(fields: [templateId], references: [id], onDelete: Cascade)
  templateId  String
  label       String   // "Living Room", "MBR", "Kitchen", etc.
  roomType    String   // "living", "bedroom", "kitchen", "toilet", "bomb_shelter", "service_yard", "hallway"
  vertices    Json     // Polygon coordinates [[x,y], [x,y], ...]
  floorHeight Float    @default(2.8) // metres
  wallColor   String   @default("#F5F5F0")
  floorType   String   @default("parquet") // "tiles", "parquet", "laminate", "vinyl"
  floorColor  String   @default("#C4A882")
  doors       Json?    // [{position, width, height, swing}]
  windows     Json?    // [{position, width, height, sillHeight}]
  sortOrder   Int      @default(0)
}

model Project {
  id            String   @id @default(cuid())
  user          User?    @relation(fields: [userId], references: [id])
  userId        String?
  name          String   @default("My Project")
  templateId    String?
  stylePrompt   String?  // User's natural language style input
  stylePreset   String?  // "scandinavian" | "japandi" | ...
  modelData     Json?    // Cached 3D model state
  renders       Render[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Render {
  id          String   @id @default(cuid())
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId   String
  room        String   // "living", "mbr", etc.
  imageUrl    String   // R2 URL
  prompt      String   // Style prompt used
  resolution  String   @default("1024x1024")
  createdAt   DateTime @default(now())
}

model StylePreset {
  id          String   @id @default(cuid())
  name        String   @unique // "Scandinavian", "Japandi"
  description String
  palette     Json     // { floorType, floorColor, wallColor, accentColor, trimColor }
  promptHint  String   // "Scandinavian interior with light oak flooring..."
  createdAt   DateTime @default(now())
}
```

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Metric | Target |
|--------|--------|
| Time from flat type selection to 3D model visible | < 2 seconds |
| Style preset switch latency | < 500ms (material swap only) |
| Gemini render generation | < 10 seconds per room |
| Collada export download size | < 5 MB (compressed) |
| Lighthouse Performance score | ≥ 85 |

### 9.2 Mobile Responsiveness (Hard Requirement)

| Requirement | Detail |
|-------------|--------|
| **Thumb targets** | All tap targets ≥ 44px |
| **Viewport** | 3D viewport fills mobile screen, controls float |
| **Breakpoints** | Single column on mobile (≤ 768px), side panel on tablet+ |
| **No horizontal scroll** | Overflow hidden, images auto-scale |
| **Forms** | Full-width inputs, large tap areas |
| **Gesture support** | Pinch-to-zoom, two-finger orbit in 3D view |

### 9.3 Compatibility

| Requirement | Support |
|-------------|---------|
| **Browsers** | Chrome, Firefox, Safari, Edge (last 2 major versions) |
| **SketchUp** | SketchUp Pro 2022+ (Collada import/export) |
| **File formats** | Upload: PNG, JPG, PDF (floor plans). Export: Collada (.dae), OBJ. Re-import: .dae, .obj |

### 9.4 Security

- API keys for Gemini and R2 stored in Vercel environment variables only
- File uploads scanned for malware (R2 + Cloudflare protection)
- Admin routes protected by session auth

---

## 10. Success Criteria

- [ ] Admin can configure a new HDB flat type in under 10 minutes
- [ ] User goes from "first visit" to "first render" in under 5 minutes
- [ ] At least 5 style presets produce visually distinct results
- [ ] Gemini renders are rated "good" or "excellent" in blind tests
- [ ] Collada export opens without errors in SketchUp Pro
- [ ] Re-imported model merges furniture correctly
- [ ] All core flows work on mobile (viewport + controls)

---

## 11. Future Considerations

| Feature | Trigger to Build |
|---------|-----------------|
| Redis / BullMQ queue | When render generation exceeds 10s or batch rendering is needed |
| Python FastAPI backend | When advanced 3D operations (boolean geometry, procedural furniture) are needed |
| Payment integration | When user base exceeds 100 active projects |
| ComfyUI self-hosted | When Gemini costs exceed budget and GPU becomes available |
| Multi-user collaboration | When designers request shared projects |

---

## 12. Open Questions (To Be Decided)

1. **Pricing model?** Freemium (limited renders) vs. subscription vs. pay-per-render?
2. **Which HDB flat types to support at launch?** 4-room and 5-room only, or add 3-room and Executive?
3. **Sample floor plans?** Do you have HDB floor plan images to use as initial templates?
4. **Gemini API quota?** What's your current Gemini API tier / monthly budget for Imagen calls?
5. **Brand name?** What should the app be called? (impacts domain, landing page, SEO)
