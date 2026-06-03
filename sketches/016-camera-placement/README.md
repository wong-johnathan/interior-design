## Wireframe: Interactive Camera Placement

### Design stance
Tool-like, precise. User enters free-camera mode to compose their own render shots. Saved custom angles appear alongside auto-generated ones in the render selector.

### Key elements
- **Left:** 3D viewport with crosshair, camera info HUD (position, target, FOV), dashed frame indicator
- **Right:** Capture form (name, room, resolution) + saved angles list (auto vs custom sections)
- **Bottom toolbar:** Snap to room center, eye level reset, wide angle toggle
- **Saved angles:** Auto-generated per room (Corner, Entrance, Door) + user-captured custom angles
- **Custom angles** are editable (rename) and deletable

### UX flow
1. User clicks "📷 Add Custom Angle" from Final Render config
2. Viewport switches to Camera Mode (free camera, crosshair, HUD)
3. User positions camera by dragging/orbiting
4. Names the angle, selects room, clicks Capture
5. Angle appears in Custom section → available in render angle checklist
