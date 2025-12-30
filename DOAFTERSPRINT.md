# Post-Sprint Features

Features to implement after current sprint work is complete.

---

## 3D Sector View Toggle

**Priority:** High
**Complexity:** Medium-Large
**Dependencies:** `expo-gl`, `expo-three`, `three`, `@types/three`

### Overview

Add a 3D rendering mode to SectorView2D using Three.js. Users can toggle between the current 2D SVG tactical view and an immersive 3D view.

### User Requirements

- **Simple shapes first** - Use geometric primitives (cones, pyramids, spheres) for ships/stations. GLTF models added later.
- **Isometric default camera** - 45° above, looking at sector center
- **Reset Perspective button** - Snap camera back to default position
- **Hybrid approach** - 2D for tactical overview, 3D for immersion

### Implementation Plan

#### 1. Install Dependencies

```bash
npx expo install expo-gl expo-three three
bun add -D @types/three
```

#### 2. Files to Create

| File | Purpose |
|------|---------|
| `components/sector/SectorView3D.tsx` | Three.js 3D scene component |
| `components/sector/entities/Ship3D.tsx` | 3D ship geometry (cone/pyramid) |
| `components/sector/entities/Station3D.tsx` | 3D station geometry (cube/octahedron) |
| `components/sector/entities/Star3D.tsx` | 3D star (glowing sphere) |
| `components/sector/entities/AsteroidField3D.tsx` | Particle system for asteroids |
| `lib/three/cameraControls.ts` | Touch-based orbit/pan/zoom controls |

#### 3. Files to Modify

| File | Changes |
|------|---------|
| `components/hud/ViewModeSelector.tsx` | Add "3D" toggle button |
| `stores/settingsStore.ts` | Add `sectorView3DEnabled` boolean |
| `components/npc/SectorView2D.tsx` | Conditional render: 2D SVG or 3D Three.js |

#### 4. 3D Scene Structure

```
Scene
├── AmbientLight (soft fill)
├── PointLight (at star position, warm color)
├── Star3D (center, glowing sphere)
├── PlayerShip3D (orange cone, pointing forward)
├── OtherShips3D[] (purple cones)
├── NPCShips3D[] (colored by type: red pirates, blue traders, green patrol)
├── Stations3D[] (green cubes/octahedrons)
├── AsteroidFields3D[] (particle clusters)
└── OrbitCamera (isometric default, touch controls)
```

#### 5. Camera Controls

- **Single finger drag** - Orbit around center
- **Two finger drag** - Pan camera
- **Pinch** - Zoom in/out
- **Double tap** - Reset to default perspective
- **Reset button** - Explicit reset control in UI

#### 6. Entity Shapes (Phase 1 - Primitives)

| Entity | Shape | Color |
|--------|-------|-------|
| Player ship | Cone (pointing forward) | Orange (#FF9900) |
| Other players | Cone | Purple (#8b5cf6) |
| Pirate NPC | Cone | Red (#ef4444) |
| Trader NPC | Cone | Blue (#3b82f6) |
| Patrol NPC | Cone | Green (#10b981) |
| Station | Octahedron | Green (#10b981) |
| Star | Sphere + glow | Yellow (from procgen) |
| Asteroids | Small spheres (instanced) | Brown (#8B7355) |

#### 7. Entity Shapes (Phase 2 - GLTF Models)

- Load `.gltf`/`.glb` models from assets
- Different models per ship type (scout, fighter, trader, explorer)
- Station models by type (trade, military, research, mining)
- Maintain color tinting for faction/type identification

### Technical Notes

- **Coordinate mapping**: Sector is 20,000 units (-10k to +10k). Scale to Three.js units (e.g., 1:100 → 200 Three.js units)
- **Performance**: Use instanced meshes for asteroids, limit draw calls
- **Selection**: Raycasting for entity selection (tap to select ship/station)
- **Sync with 2D**: Same data sources (npcs, dbStations, otherShips, playerPosition)

### Acceptance Criteria

- [ ] 3D toggle button appears in ViewModeSelector
- [ ] Clicking 3D switches to Three.js rendered view
- [ ] Player ship visible at correct position
- [ ] Other ships/NPCs visible with correct colors
- [ ] Stations visible and selectable
- [ ] Star renders at center with glow effect
- [ ] Camera orbit/pan/zoom works via touch
- [ ] Reset Perspective button returns to isometric default
- [ ] Performance acceptable on mid-range devices (30+ FPS)
- [ ] Switching back to 2D works correctly

---

## Future Considerations

- **Flight mode integration** - Could FlightViewport also use Three.js?
- **Weapon effects** - Laser beams, explosions in 3D
- **Warp/jump animations** - Visual effects for sector transitions
- **Nebula backgrounds** - Skybox with procgen nebula textures
