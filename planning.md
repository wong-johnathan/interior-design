# Implementation Plan

## HDB Interior Design Web App

| Field | Value |
|-------|-------|
| **Status** | Draft v1.0 |
| **Date** | 2026-06-03 |
| **Author** | Johnathan Wong |
| **Estimated Timeline** | 14 weeks (single dev) |

---

## 1. Guiding Principles

| Principle | How We Apply It |
|-----------|----------------|
| **YAGNI** | Don't build what we don't need yet. No Redis until batch rendering. No auth until users ask for accounts. |
| **Admin-first** | Admin panel enables the core insight: curated HDB templates eliminate floor plan parsing complexity. |
| **Client-side 3D** | All geometry processing in the browser via Three.js. No Python backend needed. |
| **API-key simplicity** | Gemini calls proxied through Next.js API routes. No separate service or queue. |
| **Deploy early** | Vercel preview deployments on every push. Working prototype from Week 2. |

---

## 2. Phase Breakdown

### Phase 0 — Project Scaffold (Week 1)

| Task | Description | Files | Verification |
|------|-------------|-------|-------------|
| **0.1** Create Next.js 16 app | `npx create-next-app@latest` with App Router, TypeScript, Tailwind | `package.json`, `next.config.ts`, `tsconfig.json` | `npm run dev` starts |
| **0.2** Install dependencies | R3F, drei, zustand, react-konva, shadcn/ui, prisma, next-auth | `package.json` | All imports resolve |
| **0.3** Initialize shadcn/ui | `npx shadcn@latest init` + add components (button, card, dialog, sheet, select, input, badge, separator) | `components/ui/` | Components render on test page |
| **0.4** Set up Prisma + Neon | `npx prisma init`, define schema, push to Neon | `prisma/schema.prisma`, `.env` | `prisma db push` succeeds |
| **0.5** Set up R2 bucket | Create bucket via Cloudflare dashboard; configure CORS | `.env` (R2 keys) | Upload test file via signed URL |
| **0.6** Basic route structure | Create all route files (stubs) per architecture doc | `app/page.tsx`, `app/browse/`, `app/studio/`, `app/admin/`, `app/api/` | Routes render "Coming Soon" |
| **0.7** GitHub + Vercel | Push to GitHub; connect Vercel project; env variables | Vercel dashboard | Preview deployment green |

**Checkpoint:** App runs on Vercel with all routes stubbed.

---

### Phase 1 — Admin Panel & Template System (Week 2-3)

| Task | Description | Key Files | Verification |
|------|-------------|-----------|-------------|
| **1.1** NextAuth setup | Configure NextAuth with email/password (credentials provider), admin role | `app/api/auth/[...nextauth]/route.ts`, `lib/auth.ts` | Login/logout works |
| **1.2** Admin login page | Login form UI with shadcn card + input | `app/admin/login/page.tsx` | Login form visible, submits |
| **1.3** Admin dashboard layout | Protected layout with sidebar nav (Templates, Presets, Settings) | `app/admin/layout.tsx`, `app/admin/dashboard/page.tsx` | Redirects to login if unauthenticated |
| **1.4** Template list page | Fetch + display all templates from Postgres; create/delete buttons | `app/admin/dashboard/page.tsx` | Lists templates from DB |
| **1.5** Template form (upload) | Upload floor plan image → R2 → get signed URL → display preview | `app/admin/templates/new/page.tsx`, `app/api/upload/route.ts` | Image uploads to R2, preview appears |
| **1.6** Room annotation canvas | react-konva canvas overlaid on floor plan image; draw polygon rooms | `components/annotation/Canvas.tsx`, `components/annotation/WallTool.tsx` | Draw rooms on canvas, polygon appears |
| **1.7** Room labeling | Click room → label dialog (room type, dimensions, colour) | `components/annotation/RoomLabeler.tsx` | Room has type + size data |
| **1.8** Doors & windows | Click wall edge → add door/window with dimension inputs | `components/annotation/DoorWindowTool.tsx` | Door/window markers on walls |
| **1.9** Save template | POST template data + room configs to Postgres | `app/api/templates/route.ts` | Template saved, appears in list |
| **1.10** Template edit page | Load existing template, re-show annotation with saved data | `app/admin/templates/[id]/edit/page.tsx` | Saved rooms render on canvas, editable |
| **1.11** Publish toggle | Switch to make template visible to users | Prisma: `Template.published` field | Unpublished templates hidden from /browse |

**Checkpoint:** Admin can upload floor plan, annotate rooms, save as template, and publish.

---

### Phase 2 — 3D Viewport & Mesh Generation (Week 4-5)

| Task | Description | Key Files | Verification |
|------|-------------|-----------|-------------|
| **2.1** R3F Canvas setup | Full-page canvas with orbit controls, lighting (ambient + directional), sky | `components/viewport/Scene.tsx` | Grey empty scene with orbit controls |
| **2.2** Wall mesh generator | Extrude wall polygon from 2D vertices → 3D wall at 2.8m height | `lib/mesh/generateWalls.ts` | Wall mesh appears in scene |
| **2.3** Floor mesh generator | Generate floor slab from room polygon | `lib/mesh/generateFloor.ts` | Floor appears below walls |
| **2.4** Ceiling mesh generator | Generate ceiling slab at wall top | `lib/mesh/generateCeiling.ts` | Ceiling visible with opacity toggle |
| **2.5** Door opening cutouts | Subtract door box from wall mesh | `lib/mesh/generateDoors.ts` | Door-shaped gap in wall |
| **2.6** Window opening cutouts | Subtract window box from wall mesh; add glass pane | `lib/mesh/generateWindows.ts` | Window-shaped gap + transparent pane |
| **2.7** Room component | Combine wall + floor + ceiling + doors + windows per room | `components/viewport/Room.tsx` | Complete room renders |
| **2.8** Building component | Merge all rooms into single unit | `components/viewport/Building.tsx` | Full flat visible, rooms connected |
| **2.9** Room labels | 3D text labels floating above each room | `components/viewport/RoomLabel.tsx` | Room names visible in scene |
| **2.10** Viewport UX | Controls toolbar: zoom, pan, walkthrough, room highlight, floor plan overlay | `components/viewport/Controls.tsx` | All buttons functional |

**Checkpoint:** Complete 3D flat visible in browser with all rooms, doors, windows, labels.

---

### Phase 3 — Style Engine (Week 6-7)

| Task | Description | Key Files | Verification |
|------|-------------|-----------|-------------|
| **3.1** Material definitions | TypeScript types for wall/floor/trim materials with PBR properties | `types/material.ts` | Type definitions compile |
| **3.2** Texture atlas | Source PBR textures (wood, tile, concrete, paint) → store in R2 public bucket | R2 bucket textures/ | Textures load on 3D objects |
| **3.3** Apply materials to rooms | Map RoomConfig.wallColor/floorType → Three.js MeshStandardMaterial | `components/viewport/Flooring.tsx`, `lib/materials/textures.ts` | Each room shows correct material |
| **3.4** Style preset data | 5 presets: Scandinavian, Japandi, Industrial, Minimalist, Coastal | `lib/materials/presets.ts` | Each preset has complete palette |
| **3.5** Preset selector UI | Card grid showing each style with preview thumbnail + name | `components/styles/PresetSelector.tsx` | Clicking preset shows visual feedback |
| **3.6** Apply preset | Swap all room materials when preset selected | `hooks/useStyleApplication.ts` | All rooms update in <500ms |
| **3.7** AI prompt input | Textarea with placeholder: "Describe your dream interior..." | `components/styles/PromptInput.tsx` | Text input accepts and submits |
| **3.8** Gemini prompt parser | Send prompt → Gemini 2.5 Pro → extract structured style map | `lib/ai/stylePrompt.ts` | Returns { wallColor, floorType, accentColor, style, mood } |
| **3.9** Apply AI style | Convert structured style map → material updates | `hooks/useStyleApplication.ts` | Rooms update from AI result |
| **3.10** Color picker overrides | Allow manual colour/material override per room (overrules preset) | `components/styles/ColorPicker.tsx` | Single room colour changes independently |

**Checkpoint:** User can pick a preset or type a prompt → all room materials update in real-time.

---

### Phase 4 — SketchUp Export/Import (Week 8-9)

| Task | Description | Key Files | Verification |
|------|-------------|-----------|-------------|
| **4.1** Collada exporter | Use Three.js ColladaExporter to export full scene model | `lib/export/exportCollada.ts` | .dae file downloads |
| **4.2** Texture bundling | Embed texture images in the export folder structure | `lib/export/exportCollada.ts` | Textures reference correctly in .dae |
| **4.3** Export UI | Download button with format dropdown (Collada, OBJ) | `components/export/ExportButton.tsx` | Click → download starts |
| **4.4** OBJ exporter | Fallback export format | `lib/export/exportOBJ.ts` | .obj + .mtl download |
| **4.5** Collada importer | Use Three.js ColladaLoader to parse re-uploaded .dae | `lib/export/importModel.ts` | File parsed => Three.js Object3D |
| **4.6** Import UI | Drag-and-drop upload zone for .dae/.obj files | `components/export/ImportButton.tsx` | File uploads and processes |
| **4.7** Mesh merging | Merge imported furniture meshes with original building | `lib/export/importModel.ts` | Furniture appears in correct rooms |
| **4.8** Material preservation | Preserve SketchUp-applied materials on re-import | `lib/export/importModel.ts` | Furniture colours visible |
| **4.9** Diff detection | Highlight new objects vs. original building geometry | `lib/export/importModel.ts` | New objects highlighted in scene |

**Checkpoint:** Full export→SketchUp→re-import cycle works end-to-end.

---

### Phase 5 — Photorealistic Rendering (Week 10-11)

| Task | Description | Key Files | Verification |
|------|-------------|-----------|-------------|
| **5.1** Viewport screenshot | Capture specific room view as PNG | `hooks/useGeminiRender.ts` | PNG saved, view correct |
| **5.2** Gemini API client | Initialize Gemini client with API key from env | `lib/ai/gemini.ts` | API responds |
| **5.3** Render API route | POST `/api/render` → takes room image + prompt → calls Gemini Imagen | `app/api/render/route.ts` | Returns rendered image URL |
| **5.4** Render button control | "Generate Render" button per room with loading state | `components/renders/RenderButton.tsx` | Button shows spinner during render |
| **5.5** Render gallery | Grid of rendered room images | `components/renders/RenderGallery.tsx` | Renders display in grid |
| **5.6** Render history | Store renders in Postgres + R2; show previous renders | `prisma schema: Render` | Previous renders load on revisit |
| **5.7** Multi-view renders | Render all rooms at once (batch) | `hooks/useGeminiRender.ts` | All rooms rendered sequentially |
| **5.8** Resolution options | 1024×1024 (free), 2048×2048 (HD), 4096×4096 (4K) | `app/api/render/route.ts` | Different sizes produce different outputs |

**Checkpoint:** User can generate photorealistic renders of any room from any style.

---

### Phase 6 — User Features & Polish (Week 12-14)

| Task | Description | Verification |
|------|-------------|-------------|
| **6.1** User registration | Sign-up flow with email + password | New account created, logged in |
| **6.2** Project saving | Save project state (style, materials, camera position) | Revisit → restores exact state |
| **6.3** Project list | Dashboard showing saved projects | Loads from DB |
| **6.4** Browse page polish | Template cards with preview images, flat type filter | Filter + grid layout |
| **6.5** Landing page | Hero section, feature highlights, CTA | Professional first impression |
| **6.6** Shareable renders | Public URL with before/after slider | Public page renders |
| **6.7** Onboarding flow | Tutorial overlay on first visit | Step-by-step guide |
| **6.8** Mobile responsive | Test all pages on mobile viewport; fix layout issues | All flows work on 375px viewport |
| **6.9** Performance audit | Lighthouse test; lazy loading; code splitting | Score ≥ 85 |
| **6.10** Error boundaries | Graceful error handling across all pages | Errors show friendly messages |

**Checkpoint:** App is ready for beta users.

---

## 3. File Change Map

```
PHASE 0: Scaffold
  create: package.json
  create: next.config.ts
  create: tsconfig.json
  create: tailwind.config.ts
  create: prisma/schema.prisma
  create: .env.local
  create: app/layout.tsx
  create: app/page.tsx
  create: app/browse/page.tsx
  create: app/studio/[projectId]/page.tsx
  create: app/admin/layout.tsx
  create: app/admin/login/page.tsx
  create: app/admin/dashboard/page.tsx
  create: components/ui/ (shadcn components)

PHASE 1: Admin Panel
  create: app/api/auth/[...nextauth]/route.ts
  create: lib/auth.ts
  create: app/api/templates/route.ts
  create: app/api/templates/[id]/route.ts
  create: app/api/upload/route.ts
  create: app/admin/templates/new/page.tsx
  create: app/admin/templates/[id]/edit/page.tsx
  create: components/annotation/Canvas.tsx
  create: components/annotation/WallTool.tsx
  create: components/annotation/RoomLabeler.tsx
  create: components/annotation/DoorWindowTool.tsx
  create: lib/r2.ts
  modify: prisma/schema.prisma (add Template, RoomConfig models)

PHASE 2: 3D Engine
  create: components/viewport/Scene.tsx
  create: components/viewport/Building.tsx
  create: components/viewport/Room.tsx
  create: components/viewport/Doors.tsx
  create: components/viewport/Windows.tsx
  create: components/viewport/Flooring.tsx
  create: components/viewport/Controls.tsx
  create: components/viewport/RoomLabel.tsx
  create: lib/mesh/generateWalls.ts
  create: lib/mesh/generateFloor.ts
  create: lib/mesh/generateCeiling.ts
  create: lib/mesh/generateDoors.ts
  create: lib/mesh/generateWindows.ts
  create: types/geometry.ts

PHASE 3: Style Engine
  create: types/material.ts
  create: lib/materials/palettes.ts
  create: lib/materials/presets.ts
  create: lib/materials/textures.ts
  create: components/styles/PresetSelector.tsx
  create: components/styles/PromptInput.tsx
  create: components/styles/ColorPicker.tsx
  create: hooks/useStyleApplication.ts
  create: lib/ai/stylePrompt.ts
  create: store/styleStore.ts

PHASE 4: Export/Import
  create: lib/export/exportCollada.ts
  create: lib/export/exportOBJ.ts
  create: lib/export/importModel.ts
  create: components/export/ExportButton.tsx
  create: components/export/ImportButton.tsx
  create: hooks/useExport.ts

PHASE 5: Rendering
  create: lib/ai/gemini.ts
  create: lib/ai/renderRoom.ts
  create: app/api/render/route.ts
  create: components/renders/RenderButton.tsx
  create: components/renders/RenderGallery.tsx
  create: components/renders/RenderCard.tsx
  create: hooks/useGeminiRender.ts
  create: store/projectStore.ts
  modify: prisma/schema.prisma (add Render model)

PHASE 6: User Features
  create: app/api/auth/register/route.ts
  create: app/api/projects/route.ts
  create: app/api/projects/[id]/route.ts
  create: app/api/share/[id]/route.ts
  create: app/share/[id]/page.tsx (public render page)
  create: app/dashboard/page.tsx (user projects list)
  modify: app/page.tsx (landing page)
  modify: app/browse/page.tsx (polish)
```

---

## 4. Dependencies & Prerequisites

Before Phase 0 starts, we need:

| Prerequisite | Details | Owner |
|-------------|---------|-------|
| **GitHub repo** | `wong-johnathan/interior-design` | ✅ Already created |
| **Vercel account** | Connected to GitHub | ✅ Already set up |
| **Neon database** | Create free-tier Postgres instance; get connection string | Johnathan |
| **Cloudflare R2 bucket** | Create bucket + generate access keys | Johnathan |
| **Google Cloud project** | Enable Gemini API; create API key | Johnathan |
| **Gemini API key** | With Imagen access enabled | Johnathan |
| **Sample floor plans** | 4-room and 5-room HDB floor plan images | Johnathan |
| **Domain** | Optional: custom domain for production | Johnathan |

---

## 5. Risk Register

| Risk | Probability | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| Three.js CSG operations fail on complex room shapes | Medium | High — walls don't render correctly | Use simplified geometries; test with real HDB layouts | Fall back to wall segments with gaps (no CSG) |
| Gemini Imagen doesn't respect 3D model geometry | Medium | High — renders don't match room layout | Use image conditioning with strong guidance scale | Switch to SD + ControlNet pipeline |
| Collada export/import has compatibility issues with SketchUp | Medium | High — export/import cycle broken | Test early with SketchUp Pro trial | Use OBJ format as fallback |
| NextAuth credentials provider is not secure enough for production | Low | Medium — auth vulnerability | Use OAuth providers for production | Add 2FA layer |
| browser memory with large HDB 5-room models | Low | Medium — crashes on low-end devices | Geometry merging; LOD; test on multiple devices | Reduce polygon count; use instancing |
| Gemini API quota insufficient for beta users | Medium | Medium — renders hit rate limits | Implement queue + retry | Add rate limiting; upgrade API tier |
| Three.js r160+ API changes during development | Low | Low — breaking changes | Pin Three.js version in package.json | Upgrade on stable schedule |

---

## 6. Testing Strategy

| Level | Scope | Tools | Frequency |
|-------|-------|-------|-----------|
| **Type check** | All TypeScript files | `tsc --noEmit` | Every commit |
| **Lint** | All files | ESLint + Prettier | Every commit |
| **Unit** | Mesh generation, material application, export functions | Vitest | Per feature |
| **Integration** | API routes, Prisma queries, R2 upload | Vitest + MSW | Per phase |
| **E2E** | Full user flow: browse → view → style → export → re-import → render | Playwright | Before launch |
| **Manual** | Real HDB floor plan annotation, SketchUp export/import | Human | Each phase |

### 6.1 Key Test Cases

```
Mesh Generation:
  ✓ Room vertices produce correct wall count (4 walls for rectangle)
  ✓ Door cutout subtracts correct volume from wall
  ✓ Window cutout creates opening at correct sill height
  ✓ Two adjacent rooms share a wall (no gap or overlap)
  ✓ Non-rectangular rooms (L-shaped, irregular) generate correctly

Export/Import:
  ✓ Collada export contains all geometry as Mesh nodes
  ✓ Textures referenced in .dae have correct relative paths
  ✓ SketchUp opens exported .dae without errors
  ✓ Re-imported model has same room positions as original
  ✓ New meshes (furniture) are distinguishable from building

Rendering:
  ✓ Room viewport screenshot captures correct camera angle
  ✓ Gemini API returns valid image within 10 seconds
  ✓ Rendered image matches room layout (room boundaries correct)
  ✓ Style prompt changes are visible in render output
```

---

## 7. Glossary

| Term | Definition |
|------|-----------|
| **P0/P1/P2** | Priority levels: Must have / Should have / Nice to have |
| **R3F** | React Three Fiber |
| **R2** | Cloudflare R2 object storage |
| **CSG** | Constructive Solid Geometry (boolean 3D operations) |
| **PBR** | Physically Based Rendering |
| **Collada** | `.dae` XML-based 3D interchange format |
| **Imagen** | Google's image generation AI model |
| **Signed URL** | Temporary access URL for private storage objects |
| **LOD** | Level of Detail — lower-poly versions for distant objects |
| **glTF** | GPU-friendly 3D transmission format (alternative to Collada) |
