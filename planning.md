# Implementation Plan

## HDB Interior Design Web App

| Field | Value |
|-------|-------|
| **Status** | Draft v1.1 |
| **Date** | 2026-06-03 |
| **Author** | Johnathan Wong |
| **Previous** | v1.0 (initial 6-phase plan) |
| **Estimated Timeline** | 16 weeks (single dev) |

---

## 1. Revised Phases (Based on New UX)

The refined user flow (OAuth → BTO discovery → AI consultant → auto-furnish/SketchUp → renders) changes the implementation order. The AI consultant now comes **before** the SketchUp export, and furniture templates are a new phase.

| Phase | Weeks | Focus |
|-------|-------|-------|
| 0 | 1 | Project scaffold + infrastructure |
| 1 | 2-3 | Admin panel + BTO template system |
| 2 | 4-5 | 3D viewport + mesh generation |
| 3 | 6-8 | AI design consultant (chat + brief) |
| 4 | 9-10 | Furniture template system |
| 5 | 11-12 | SketchUp export/import |
| 6 | 13-14 | Photorealistic rendering (Gemini) |
| 7 | 15-16 | User features + polish |

---

## 2. Phase Details

### Phase 0 — Project Scaffold (Week 1)

| # | Task | Key Files | Verification |
|---|------|-----------|-------------|
| 0.1 | Create Next.js 16 app with App Router, TypeScript, Tailwind | `package.json`, `next.config.ts` | `npm run dev` starts |
| 0.2 | Install deps: R3F, drei, zustand, react-konva, shadcn/ui, prisma, next-auth | `package.json` | All imports resolve |
| 0.3 | Init shadcn/ui + add components | `components/ui/` | Components render on test page |
| 0.4 | Set up Prisma schema + Neon DB | `prisma/schema.prisma`, `.env` | `prisma db push` succeeds |
| 0.5 | Set up Cloudflare R2 bucket + CORS | `.env` (R2 keys) | Test upload via signed URL |
| 0.6 | Create all route stubs | All `/app/` route files | Routes render "Coming Soon" |
| 0.7 | GitHub → Vercel deployment pipeline | Vercel dashboard | Preview deployment green |

---

### Phase 1 — Admin Panel & BTO Template System (Week 2-3)

| # | Task | Key Files | Verification |
|---|------|-----------|-------------|
| 1.1 | NextAuth with Google OAuth + admin role | `app/api/auth/[...nextauth]/route.ts` | Login with Google works |
| 1.2 | Admin login + dashboard layout | `app/admin/login/`, `app/admin/layout.tsx` | Protected admin routes |
| 1.3 | BTO project CRUD | `app/admin/bto/page.tsx`, API routes | Create, list, edit BTO projects |
| 1.4 | Flat model CRUD (within BTO project) | `app/admin/bto/[id]/models/` | Add 4-room/5-room variants |
| 1.5 | Floor plan upload → R2 → preview | `app/api/upload/route.ts` | Image uploads, preview renders |
| 1.6 | Room annotation canvas (react-konva) | `components/admin/RoomAnnotationCanvas.tsx` | Draw room polygons on floor plan |
| 1.7 | Room property panel (type, dimensions, materials) | `components/admin/RoomPropertyPanel.tsx` | Save room config |
| 1.8 | Door/window placement on walls | Added to annotation canvas | Markers visible on rooms |
| 1.9 | Save + publish BTO project with all models | API routes + DB | Published projects visible to users |

**Checkpoint:** Admin can add a BTO project, upload floor plan, annotate rooms, publish.

---

### Phase 2 — 3D Viewport & Mesh Generation (Week 4-5)

| # | Task | Key Files | Verification |
|---|------|-----------|-------------|
| 2.1 | R3F Canvas with lighting + orbit controls | `components/viewport/Scene.tsx` | Empty scene renders |
| 2.2 | Wall mesh from 2D vertices → 3D at 2.8m | `lib/mesh/generateWalls.ts` | Walls visible |
| 2.3 | Floor + ceiling slabs | `lib/mesh/generateFloor.ts`, `generateCeiling.ts` | Slabs visible |
| 2.4 | Door cutouts (subtract from walls) | `lib/mesh/generateDoors.ts` | Door gaps in walls |
| 2.5 | Window cutouts + glass | `lib/mesh/generateWindows.ts` | Window gaps + transparent glass |
| 2.6 | Room component = walls + floor + ceiling | `components/viewport/Room.tsx` | Complete room renders |
| 2.7 | Building = all rooms merged | `components/viewport/Building.tsx` | Full flat visible |
| 2.8 | Room labels in 3D | `components/viewport/RoomLabels.tsx` | Names float above rooms |
| 2.9 | Viewport controls toolbar | `components/viewport/Controls.tsx` | Orbit, pan, zoom, walkthrough |
| 2.10 | Camera presets per room | `components/viewport/CameraPresets.tsx` | Click room → camera snaps to it |

**Checkpoint:** User selects flat type → complete 3D model renders in browser.

---

### Phase 3 — AI Design Consultant (Week 6-8)

*This is the most complex phase — allow extra time for prompt engineering.*

| # | Task | Key Files | Verification |
|---|------|-----------|-------------|
| 3.1 | Chat UI component | `components/consultant/ChatPanel.tsx` | Send message, receive reply |
| 3.2 | Chat message bubbles (user + AI) | `components/consultant/ChatMessage.tsx` | Styled, scrollable |
| 3.3 | SSE streaming for typing effect | `app/api/ai/consult/stream` route | Text streams character by character |
| 3.4 | Gemini 2.5 Pro integration | `lib/ai/consultant.ts` | API responds with JSON |
| 3.5 | Design Brief schema + validation | `types/designBrief.ts` | Brief parses correctly |
| 3.6 | System prompt: interior design consultant | `lib/ai/prompts/consultant.ts` | AI asks relevant questions |
| 3.7 | Per-room brief tracking | AI system prompt instructs per-room tracking | Room A ≠ Room B in brief |
| 3.8 | Brief → 3D material sync | When AI sets floor=oak, model updates in <500ms | Real-time preview |
| 3.9 | Room tab bar (switch which room to discuss) | `components/consultant/RoomTabBar.tsx` | Click "Kitchen" → chat focuses kitchen |
| 3.10 | Design summary panel | `components/consultant/DesignSummary.tsx` | Shows full brief at a glance |
| 3.11 | "I'm happy" flow | Chat concludes, brief finalized | Brief locked, proceed button enabled |
| 3.12 | Chat history persistence | Save to project in DB | Refresh page → chat resumes |
| 3.13 | Edge case: bad AI JSON → retry | Retry logic + fallback | AI recovers from malformed output |

**Checkpoint:** User chats with AI, brief accumulates per-room, 3D model updates in real-time.

---

### Phase 4 — Furniture Template System (Week 9-10)

| # | Task | Key Files | Verification |
|---|------|-----------|-------------|
| 4.1 | FurnitureTemplate Prisma model | `prisma/schema.prisma` | DB table created |
| 4.2 | Admin: furniture template CRUD | `app/admin/furniture/` | Create template with furniture list |
| 4.3 | Admin: upload 3D furniture models (GLB) to R2 | `app/api/upload/route.ts` | Furniture files stored |
| 4.4 | Template matching engine (roomType + styleTag) | `lib/furniture/matcher.ts` | Returns correct template |
| 4.5 | Furniture placement logic (scale + anchor) | `lib/furniture/placer.ts` | Sofa against wall, bed centered |
| 4.6 | Furniture 3D component (load GLB, position) | `components/viewport/Furniture.tsx` | Furniture visible in scene |
| 4.7 | Furniture selector UI | `components/furniture/FurnitureSelector.tsx` | Shows matching templates |
| 4.8 | Accept/reject per item | `components/furniture/PlacementToggle.tsx` | Toggle individual furniture pieces |
| 4.9 | Seed templates: 6 room×style combinations | Data file | Templates available |

**Seed templates (MVP):**

| Template | Rooms | Items |
|----------|-------|-------|
| Living - Scandi | Living | Sofa, coffee table, rug, lamp, TV console, plant |
| Living - Japandi | Living | Low sofa, wood coffee table, tatami rug, floor lamp |
| Living - Industrial | Living | Leather sofa, metal table, industrial lamp, shelf |
| MBR - Scandi | MBR | Bed, nightstand×2, wardrobe, rug, lamp |
| MBR - Japandi | MBR | Low platform bed, nightstand, sliding wardrobe |
| Dining | Dining/Kitchen | Table, chairs×4, pendant light |

---

### Phase 5 — SketchUp Export/Import (Week 11-12)

| # | Task | Key Files | Verification |
|---|------|-----------|-------------|
| 5.1 | Collada exporter via Three.js | `lib/export/exportCollada.ts` | .dae file downloads |
| 5.2 | Texture bundling in export | Collada texture refs | Textures load in SketchUp |
| 5.3 | Export UI (with/without furniture options) | `components/export/ExportPanel.tsx` | User chooses export mode |
| 5.4 | OBJ fallback exporter | `lib/export/exportOBJ.ts` | .obj + .mtl download |
| 5.5 | Collada importer (re-upload) | `lib/export/importModel.ts` | Parses uploaded .dae |
| 5.6 | Import dropzone | `components/export/ImportDropzone.tsx` | Drag-and-drop re-upload |
| 5.7 | Mesh merge (furniture into scene) | `lib/export/importModel.ts` | User's furniture appears |
| 5.8 | Diff highlight (new objects highlighted) | `components/viewport/Furniture.tsx` | New objects in different colour |

**Checkpoint:** Full export → SketchUp → re-import cycle works end-to-end.

---

### Phase 6 — Photorealistic Rendering (Week 13-14)

| # | Task | Key Files | Verification |
|---|------|-----------|-------------|
| 6.1 | Offscreen room screenshot capture | `lib/ai/renderRoom.ts` | PNG of room from best angle |
| 6.2 | Construct per-room render prompt from brief | `lib/ai/renderPrompt.ts` | Prompt describes room accurately |
| 6.3 | Gemini Imagen API integration | `lib/ai/gemini.ts` | API returns image |
| 6.4 | Render API route (proxy, rate-limited) | `app/api/render/route.ts` | POST → image URL returned |
| 6.5 | Render button + loading state | `components/renders/RenderButton.tsx` | Spinner during generation |
| 6.6 | Render gallery grid | `components/renders/RenderGallery.tsx` | Thumbnails of all rooms |
| 6.7 | Render lightbox (full-size view) | `components/renders/RenderLightbox.tsx` | Click → full size |
| 6.8 | Room selector (which room to render) | `components/renders/RoomRenderSelector.tsx` | Pick specific room |
| 6.9 | Render history (save to DB + R2) | `prisma: Render model` | Previous renders loadable |
| 6.10 | Before/after slider | `components/renders/BeforeAfterSlider.tsx` | Slide between empty and styled |

**Checkpoint:** User can generate photorealistic renders of any room with chosen style.

---

### Phase 7 — User Features & Polish (Week 15-16)

| # | Task | Verification |
|---|------|-------------|
| 7.1 | Landing page (hero + CTA + feature tour) | Professional first impression |
| 7.2 | User project dashboard | Shows saved projects, create new |
| 7.3 | Project save/restore (full state) | Revisit → exact state restored |
| 7.4 | BTO discovery page (browse projects) | Searchable, filterable |
| 7.5 | Shareable render page with before/after | Public URL, no login needed |
| 7.6 | Mobile responsive: viewport | 3D controls work on phone |
| 7.7 | Mobile responsive: chat | Bottom sheet on mobile |
| 7.8 | Mobile responsive: gallery | Single-column responsive |
| 7.9 | Performance audit + Lighthouse | Score ≥ 85 |
| 7.10 | Error boundaries + error states | All errors show friendly messages |

---

## 3. Key Dependencies

| Depends On | Phase | Why |
|------------|-------|-----|
| R2 bucket setup | Phase 0 | All file operations need storage |
| Prisma schema finalized | Phase 0 | All CRUD operations depend on it |
| BTO projects in DB | Phase 1 → Phase 2 | 3D model needs room config data |
| Template + rooms saved | Phase 2 → Phase 3 | Chat needs room list from template |
| AI consultant working | Phase 3 → Phase 4 | Furniture needs style from brief |
| Brief finalized | Phase 3 → Phase 5 | Export includes styled model |
| Brief + furniture placed | Phase 5 → Phase 6 | Render needs both |

---

## 4. Phased Rollout Strategy

```
Week 1-3:    Admin can create BTO projects → You seed initial library
Week 4-5:    3D model works → Internal demo
Week 6-8:    AI consultant works → Dogfood with friends
Week 9-10:   Furniture templates → Closer to real product
Week 11-12:  SketchUp cycle → Power user workflow verified
Week 13-14:  Renders work → First "wow" moment
Week 15-16:  Polish → Beta launch
```

---

## 5. Testing Strategy

| Level | Scope | Tool | Who |
|-------|-------|------|-----|
| **TypeScript** | Types compile | `tsc --noEmit` | Pre-commit |
| **Unit** | Mesh gen, export/import, AI prompt builders | Vitest | Per feature |
| **Integration** | API routes, Prisma queries, R2 upload | Vitest + MSW | Per phase |
| **AI testing** | Chat responses, render quality | Manual + prompt eval | Phase 3+ |
| **E2E** | Full user flow (smoke test) | Playwright | Pre-launch |
| **Manual** | SketchUp export/import, render quality | Human | Each phase |

---

## 6. Prerequisites Checklist

- [ ] GitHub repo: `wong-johnathan/interior-design` ✅
- [ ] Vercel account connected to GitHub
- [ ] Neon Postgres database (free tier)
- [ ] Cloudflare R2 bucket + access keys
- [ ] Google Cloud project with Gemini API enabled
- [ ] Gemini API key (with Imagen access)
- [ ] Google OAuth client ID (for NextAuth)
- [ ] Sample HDB floor plans (4-room + 5-room)
- [ ] Sample 3D furniture models (GLB format)

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemini returns poor render quality | Medium | High — renders don't wow | Iterate prompt engineering; fall back to SD |
| AI consultant generates bad brief JSON | Medium | Medium — chat breaks | Retry with "fix your format"; parse fallback |
| Three.js CSG fails on complex layouts | Low | Medium — wall gaps wrong | Use simpler cutout (wall panels with gaps) |
| SketchUp Collada import fails | Low | High — export cycle broken | Test with SketchUp Pro; OBJ as fallback |
| WebGL unsupported on device | Medium | High — 3D doesn't work | Show 2D floor plan + fallback message |
| Furniture templates wrong size for room | Medium | Low — visual but fixable | Auto-scale to 90% room dimensions |
| User overwhelmed by open-ended chat | Medium | Low — churn risk | AI always offers choices; never blank "what do you want?" |
