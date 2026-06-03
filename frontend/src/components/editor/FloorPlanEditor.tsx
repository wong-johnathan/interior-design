'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Text, Group, Rect } from 'react-konva';
import { useFloorPlanStore, WallSegment, DetectedRoom, snapPoint, nextWallId, ToolMode } from '@/stores/floorPlanStore';
import { FloorPlanToolbar } from '@/components/flooreditor/FloorPlanToolbar';
import { LivePreview3D } from '@/components/flooreditor/LivePreview3D';
import { DeleteWallDialog } from '@/components/flooreditor/DeleteWallDialog';
import { StructuralWallOverlay } from '@/components/flooreditor/StructuralWallOverlay';
import {
  ArrowLeft,
  Eye,
  MousePointer2,
  Pencil,
  Trash2,
  Undo2,
  Redo2,
  Grid3X3,
  RefreshCw,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StudioBreadcrumb } from '@/components/layout/StudioBreadcrumb';

// ── Constants ──────────────────────────────────────────────────────────────

const PIXELS_PER_METER = 50;
const GRID_PX = 10; // grid lines every 10px
const SNAP_DISTANCE = 10; // snap threshold in px for drawing
const WALL_HANDLE_RADIUS = 4;

function metersToPx(m: number): number {
  return m * PIXELS_PER_METER;
}

function pxToMeters(px: number): number {
  return px / PIXELS_PER_METER;
}

// ── Colors ─────────────────────────────────────────────────────────────────

function getWallColor(wall: WallSegment): string {
  if (wall.wallType === 'external') return '#ef4444'; // red
  if (wall.isLoadBearing) return '#f97316'; // orange
  return '#9ca3af'; // gray
}

function getWallThicknessPx(wall: WallSegment): number {
  if (wall.wallType === 'external') return metersToPx(0.2);
  if (wall.isLoadBearing) return metersToPx(0.15);
  return metersToPx(0.1);
}

// ── Geometry helpers ───────────────────────────────────────────────────────

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function wallLength(wall: WallSegment): number {
  return distance(wall.startX, wall.startY, wall.endX, wall.endY);
}

function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return distance(px, py, x1, y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return distance(px, py, projX, projY);
}

function wallCenter(wall: WallSegment): { x: number; y: number } {
  return {
    x: (wall.startX + wall.endX) / 2,
    y: (wall.startY + wall.endY) / 2,
  };
}

// ── Room detection ─────────────────────────────────────────────────────────

const DEFAULT_ROOM_NAMES = [
  'Living Room', 'MBR', 'Bedroom 2', 'Bedroom 3', 'Kitchen',
  'Dining Room', 'Bathroom 1', 'Bathroom 2', 'Utility Room',
  'Study', 'Hallway', 'Store Room', 'Balcony',
];

function detectRooms(walls: WallSegment[]): DetectedRoom[] {
  if (walls.length < 3) return [];

  // Build adjacency: key = "x,y", value = list of neighbor keys + wall info
  const adj = new Map<string, { nx: number; ny: number; wallId: string }[]>();

  function addEdge(x1: number, y1: number, x2: number, y2: number, wallId: string) {
    // Round coordinates to avoid floating point issues
    const rx1 = Math.round(x1 * 1000) / 1000;
    const ry1 = Math.round(y1 * 1000) / 1000;
    const rx2 = Math.round(x2 * 1000) / 1000;
    const ry2 = Math.round(y2 * 1000) / 1000;

    const k1 = `${rx1},${ry1}`;
    const k2 = `${rx2},${ry2}`;

    if (!adj.has(k1)) adj.set(k1, []);
    if (!adj.has(k2)) adj.set(k2, []);

    adj.get(k1)!.push({ nx: rx2, ny: ry2, wallId });
    adj.get(k2)!.push({ nx: rx1, ny: ry1, wallId });
  }

  for (const w of walls) {
    addEdge(w.startX, w.startY, w.endX, w.endY, w.id);
  }

  // Find connected components of the graph
  const visited = new Set<string>();
  const components: string[][] = [];

  function dfs(k: string, comp: string[]) {
    if (visited.has(k)) return;
    visited.add(k);
    comp.push(k);
    const neighbors = adj.get(k) || [];
    for (const n of neighbors) {
      dfs(`${n.nx},${n.ny}`, comp);
    }
  }

  for (const k of adj.keys()) {
    if (!visited.has(k)) {
      const comp: string[] = [];
      dfs(k, comp);
      if (comp.length >= 3) components.push(comp);
    }
  }

  if (components.length === 0) return [];

  // For each component, find the minimal cycles (faces) using a planar graph walk
  const rooms: DetectedRoom[] = [];
  let roomCounter = 0;

  for (const comp of components) {
    // Build an edge map for this component
    const edgeMap = new Map<string, { nx: number; ny: number; wallId: string }[]>();
    for (const k of comp) {
      const neighbors = (adj.get(k) || []).filter((n) => comp.includes(`${n.nx},${n.ny}`));
      edgeMap.set(k, [...neighbors]);
    }

    // Helper to convert key to coordinates
    function kToXY(k: string): [number, number] {
      const [xs, ys] = k.split(',');
      return [parseFloat(xs), parseFloat(ys)];
    }

    // Sort neighbors by angle for planar walk
    for (const [key, neighbors] of edgeMap) {
      const [kx, ky] = kToXY(key);
      neighbors.sort((a, b) => {
        const angleA = Math.atan2(a.ny - ky, a.nx - kx);
        const angleB = Math.atan2(b.ny - ky, b.nx - kx);
        return angleA - angleB;
      });
    }

    // Find faces using the sorted edge traversal
    const edgesSet = new Set<string>();
    for (const k of comp) {
      for (const n of edgeMap.get(k) || []) {
        const e1 = `${k}->${n.nx},${n.ny}`;
        const e2 = `${n.nx},${n.ny}->${k}`;
        if (!edgesSet.has(e1) && !edgesSet.has(e2)) {
          edgesSet.add(e1);
          edgesSet.add(e2);
        }
      }
    }

    // Find cycles
    const usedEdges = new Set<string>();
    const cycles: { x: number; y: number }[][] = [];

    for (const startKey of comp) {
      const neighbors = edgeMap.get(startKey) || [];
      for (const startN of neighbors) {
        const edgeKey = `${startKey}->${startN.nx},${startN.ny}`;
        if (usedEdges.has(edgeKey)) continue;

        // Walk along the face
        const face: { x: number; y: number }[] = [];
        let currentKey = startKey;
        let prevKey: string | null = null;
        let currentN = startN;
        let iterations = 0;
        const maxIter = 1000;

        while (iterations < maxIter) {
          iterations++;
          const [cx, cy] = kToXY(currentKey);
          face.push({ x: cx, y: cy });

          const edgeKey2 = `${currentKey}->${currentN.nx},${currentN.ny}`;
          usedEdges.add(edgeKey2);

          // Move to next node
          prevKey = currentKey;
          currentKey = `${currentN.nx},${currentN.ny}`;

          // Find the next edge: from currentKey, take the edge BEFORE the one we came from
          const currentNeighbors = edgeMap.get(currentKey) || [];
          const prevIdx = currentNeighbors.findIndex(
            (n) => `${n.nx},${n.ny}` === prevKey
          );

          // Next neighbor is the one before prevIdx (in sorted order) 
          // (clockwise around the face)
          const nextIdx = prevIdx >= 0
            ? (prevIdx - 1 + currentNeighbors.length) % currentNeighbors.length
            : 0;

          const nextN = currentNeighbors[nextIdx];
          if (!nextN) break;

          currentN = nextN;

          // Check if we returned to start
          if (`${currentN.nx},${currentN.ny}` === startKey && currentKey === `${startN.nx},${startN.ny}`) {
            face.push({ x: currentN.nx, y: currentN.ny });
            break;
          }
        }

        if (face.length >= 3) {
          // Compute area using shoelace formula
          let area = 0;
          for (let i = 0; i < face.length; i++) {
            const j = (i + 1) % face.length;
            area += face[i].x * face[j].y;
            area -= face[j].x * face[i].y;
          }
          area = Math.abs(area) / 2;

          // Only keep faces with positive area (minimal cycles)
          if (area > 0.001) {
            cycles.push(face);
          }
        }
      }
    }

    // Sort cycles by area (descending) - largest is the outer boundary
    cycles.sort((a, b) => {
      let areaA = 0,
        areaB = 0;
      for (let i = 0; i < a.length; i++) {
        const j = (i + 1) % a.length;
        areaA += a[i].x * a[j].y - a[j].x * a[i].y;
      }
      for (let i = 0; i < b.length; i++) {
        const j = (i + 1) % b.length;
        areaB += b[i].x * b[j].y - b[j].x * b[i].y;
      }
      return Math.abs(areaB) - Math.abs(areaA);
    });

    // The largest face is the outer boundary - skip it
    const innerCycles = cycles.slice(1);

    for (const face of innerCycles) {
      // Compute center
      let cx = 0,
        cy = 0;
      for (const p of face) {
        cx += p.x;
        cy += p.y;
      }
      cx /= face.length;
      cy /= face.length;

      // Check if point is inside the polygon (ray casting)
      // Also check if this room overlaps with previously found rooms
      let area = 0;
      for (let i = 0; i < face.length; i++) {
        const j = (i + 1) % face.length;
        area += face[i].x * face[j].y - face[j].x * face[i].y;
      }
      area = Math.abs(area) / 2;

      const label = DEFAULT_ROOM_NAMES[roomCounter % DEFAULT_ROOM_NAMES.length];
      const id = `room_${roomCounter}`;

      rooms.push({
        id,
        label,
        vertices: face,
        area,
      });

      roomCounter++;
    }
  }

  // Sort rooms by area descending for consistent labeling
  rooms.sort((a, b) => b.area - a.area);

  // Re-label
  rooms.forEach((room, i) => {
    room.label = DEFAULT_ROOM_NAMES[i % DEFAULT_ROOM_NAMES.length];
  });

  return rooms;
}

// ── Grid Background ────────────────────────────────────────────────────────

function GridBackground({ width, height }: { width: number; height: number }) {
  const lines: React.ReactNode[] = [];
  // Vertical lines
  for (let x = 0; x <= width; x += GRID_PX) {
    lines.push(
      <Line
        key={`v${x}`}
        points={[x, 0, x, height]}
        stroke="#334155"
        strokeWidth={0.5}
      />
    );
  }
  // Horizontal lines
  for (let y = 0; y <= height; y += GRID_PX) {
    lines.push(
      <Line
        key={`h${y}`}
        points={[0, y, width, y]}
        stroke="#334155"
        strokeWidth={0.5}
      />
    );
  }
  return <Layer>{lines}</Layer>;
}

// ── Floor Plan Editor ──────────────────────────────────────────────────────

export function FloorPlanEditor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    tool,
    walls,
    selectedWallId,
    rooms,
    hoveredWallId,
    historyIndex,
    history,
    gridSnap,
    gridSize,
    setTool,
    selectWall,
    setHoveredWall,
    addWall,
    deleteWall,
    undo,
    redo,
    toggleGridSnap,
    reset,
    setRooms,
    pushHistory,
  } = useFloorPlanStore();

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [deleteConfirmWall, setDeleteConfirmWall] = useState<WallSegment | null>(null);
  const [hoveredWallLength, setHoveredWallLength] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setStageSize({ width, height });
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Re-detect rooms whenever walls change
  useEffect(() => {
    const detected = detectRooms(walls);
    setRooms(detected);
  }, [walls, setRooms]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case '1':
          setTool('select');
          break;
        case '2':
          setTool('draw');
          break;
        case '3':
          setTool('delete');
          break;
        case 'Escape':
          if (isDrawing) {
            setIsDrawing(false);
            setDrawPoints([]);
          }
          selectWall(null);
          break;
        case 'Backspace':
        case 'Delete':
          if (selectedWallId) {
            handleDeleteWall(selectedWallId);
          }
          break;
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWallId, isDrawing]);

  // ── Coordinate conversion ───────────────────────────────────────────────

  const getStagePointer = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    let { x, y } = pointer;
    if (gridSnap) {
      const snapped = snapPoint(pxToMeters(x), pxToMeters(y), gridSize);
      x = metersToPx(snapped.x);
      y = metersToPx(snapped.y);
    }
    return { x, y };
  }, [gridSnap, gridSize]);

  // ── Handle click on canvas (draw mode) ──────────────────────────────────

  const handleCanvasClick = useCallback(() => {
    if (tool !== 'draw') return;
    const pos = getStagePointer();

    // Check if clicking near an existing endpoint (snap)
    let snapTo: { x: number; y: number } | null = null;
    for (const w of walls) {
      for (const pt of [
        { x: w.startX, y: w.startY },
        { x: w.endX, y: w.endY },
      ]) {
        const d = distance(pos.x, pos.y, metersToPx(pt.x), metersToPx(pt.y));
        if (d < SNAP_DISTANCE) {
          snapTo = { x: metersToPx(pt.x), y: metersToPx(pt.y) };
          break;
        }
      }
      if (snapTo) break;
    }

    const finalPos = snapTo || pos;

    if (!isDrawing) {
      // Start drawing
      setDrawPoints([{ x: finalPos.x, y: finalPos.y }]);
      setIsDrawing(true);
    } else {
      // Add point and create wall segment
      const prev = drawPoints[drawPoints.length - 1];
      const newWall: WallSegment = {
        id: nextWallId(),
        startX: pxToMeters(prev.x),
        startY: pxToMeters(prev.y),
        endX: pxToMeters(finalPos.x),
        endY: pxToMeters(finalPos.y),
        thickness: 0.1,
        height: 2.7,
        wallType: 'internal',
        isLoadBearing: false,
      };

      // Only add if length > 0
      if (wallLength(newWall) > 0.01) {
        addWall(newWall);
      }

      // Continue drawing from the last point
      setDrawPoints([{ x: finalPos.x, y: finalPos.y }]);
    }
  }, [tool, isDrawing, drawPoints, walls, getStagePointer, addWall]);

  // ── Handle mouse down on canvas (select/delete) ─────────────────────────

  const handleStageMouseDown = useCallback(
    (e: any) => {
      if (tool === 'draw') {
        handleCanvasClick();
        return;
      }

      // Ignore clicks on shapes (handled by individual shape handlers)
      if (e.target !== e.target.getStage()) return;

      // Click on empty canvas => deselect
      if (tool === 'select') {
        selectWall(null);
      }
    },
    [tool, handleCanvasClick, selectWall]
  );

  // ── Handle wall click ───────────────────────────────────────────────────

  const handleWallClick = useCallback(
    (wall: WallSegment) => {
      if (tool === 'select') {
        selectWall(wall.id);
      } else if (tool === 'delete') {
        handleDeleteWall(wall.id);
      }
    },
    [tool, selectWall]
  );

  // ── Handle delete ───────────────────────────────────────────────────────

  const handleDeleteWall = useCallback(
    (wallId: string) => {
      const wall = walls.find((w) => w.id === wallId);
      if (!wall) return;

      // Prevent deleting external or load-bearing walls
      if (wall.wallType === 'external' || wall.isLoadBearing) {
        setDeleteConfirmWall(wall);
        return;
      }

      deleteWall(wall.id);
    },
    [walls, deleteWall]
  );

  // ── Handle wall hover ───────────────────────────────────────────────────

  const handleWallMouseEnter = useCallback(
    (wall: WallSegment) => {
      setHoveredWall(wall.id);
      const len = wallLength(wall);
      const center = wallCenter(wall);
      setHoveredWallLength({
        text: `${(len * 100).toFixed(0)} cm`,
        x: metersToPx(center.x),
        y: metersToPx(center.y),
      });
    },
    [setHoveredWall]
  );

  const handleWallMouseLeave = useCallback(() => {
    setHoveredWall(null);
    setHoveredWallLength(null);
  }, [setHoveredWall]);

  // ── Calculate thickness for rendering ───────────────────────────────────

  const getWallDimensions = useCallback((wall: WallSegment) => {
    const dx = wall.endX - wall.startX;
    const dy = wall.endY - wall.startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;
    // Normalize
    const ux = dx / len;
    const uy = dy / len;
    // Perpendicular
    const px = -uy;
    const py = ux;
    const halfThick = getWallThicknessPx(wall) / 2;

    const sx = metersToPx(wall.startX);
    const sy = metersToPx(wall.startY);
    const ex = metersToPx(wall.endX);
    const ey = metersToPx(wall.endY);

    // 4 corners of the wall rectangle
    return {
      points: [
        sx + px * halfThick,
        sy + py * halfThick,
        ex + px * halfThick,
        ey + py * halfThick,
        ex - px * halfThick,
        ey - py * halfThick,
        sx - px * halfThick,
        sy - py * halfThick,
      ],
      color: getWallColor(wall),
      isSelected: wall.id === selectedWallId,
      isHovered: wall.id === hoveredWallId,
    };
  }, [selectedWallId, hoveredWallId]);

  // ── Tooltip for wall length ─────────────────────────────────────────────

  const LengthTooltip = hoveredWallLength ? (
    <Group>
      <Rect
        x={hoveredWallLength.x - 30}
        y={hoveredWallLength.y - 14}
        width={60}
        height={20}
        fill="#1e293b"
        stroke="#64748b"
        strokeWidth={1}
        cornerRadius={4}
      />
      <Text
        x={hoveredWallLength.x}
        y={hoveredWallLength.y - 10}
        text={hoveredWallLength.text}
        fontSize={10}
        fill="#e2e8f0"
        align="center"
        width={60}
        offsetX={30}
      />
    </Group>
  ) : null;

  // ── Room labels rendering ───────────────────────────────────────────────

  const roomLabels = rooms.map((room) => {
    let cx = 0,
      cy = 0;
    for (const v of room.vertices) {
      cx += v.x;
      cy += v.y;
    }
    cx = metersToPx(cx / room.vertices.length);
    cy = metersToPx(cy / room.vertices.length);

    // Compute area in m² for display
    const areaM2 = room.area.toFixed(1);

    return (
      <Group key={room.id}>
        <Text
          x={cx}
          y={cy - 12}
          text={room.label}
          fontSize={13}
          fill="#94a3b8"
          fontStyle="bold"
          align="center"
          width={160}
          offsetX={80}
        />
        <Text
          x={cx}
          y={cy + 4}
          text={`${areaM2} m²`}
          fontSize={10}
          fill="#64748b"
          align="center"
          width={160}
          offsetX={80}
        />
      </Group>
    );
  });

  // ── Wall rendering ──────────────────────────────────────────────────────

  const wallElements = walls.map((wall) => {
    const dims = getWallDimensions(wall);
    if (!dims) return null;
    const strokeColor = dims.isSelected
      ? '#22d3ee'
      : dims.isHovered
      ? '#fbbf24'
      : dims.color;

    return (
      <Line
        key={wall.id}
        points={dims.points}
        closed
        fill={strokeColor + '40'} // 25% opacity
        stroke={strokeColor}
        strokeWidth={dims.isSelected ? 2 : 1}
        onClick={() => handleWallClick(wall)}
        onTap={() => handleWallClick(wall)}
        onMouseEnter={() => handleWallMouseEnter(wall)}
        onMouseLeave={handleWallMouseLeave}
        hitStrokeWidth={10}
      />
    );
  });

  // ── Draw preview (dragging line) ────────────────────────────────────────

  const drawPreview = isDrawing && drawPoints.length > 0 ? (
    <Line
      points={[
        drawPoints[drawPoints.length - 1].x,
        drawPoints[drawPoints.length - 1].y,
        ...(() => {
          const stage = stageRef.current;
          if (!stage) return [];
          const ptr = stage.getPointerPosition();
          if (!ptr) return [];
          let { x, y } = ptr;
          if (gridSnap) {
            const snapped = snapPoint(pxToMeters(x), pxToMeters(y), gridSize);
            x = metersToPx(snapped.x);
            y = metersToPx(snapped.y);
          }
          return [x, y];
        })(),
      ]}
      stroke="#22d3ee"
      strokeWidth={2}
      dash={[5, 5]}
      lineCap="round"
    />
  ) : null;

  // ── Drawing handles (dots at placed points) ─────────────────────────────

  const drawHandles = isDrawing
    ? drawPoints.map((pt, i) => (
        <Circle
          key={`dp_${i}`}
          x={pt.x}
          y={pt.y}
          radius={WALL_HANDLE_RADIUS}
          fill="#22d3ee"
          stroke="#0e7490"
          strokeWidth={1}
        />
      ))
    : null;

  // ── Wall info in bottom bar ─────────────────────────────────────────────

  const selectedWall = selectedWallId
    ? walls.find((w) => w.id === selectedWallId)
    : null;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      <StudioBreadcrumb
        projectName="Floor Plan"
        projectInfo="2D Editor"
        items={[
          { label: 'Floor Plan', isActive: true },
        ]}
      />

      {deleteConfirmWall && (
        <DeleteWallDialog
          wallId={deleteConfirmWall.id}
          wallLabel={
            deleteConfirmWall.wallType === 'external'
              ? 'External Wall'
              : 'Load-Bearing Wall'
          }
          isStructural={
            deleteConfirmWall.wallType === 'external' ||
            deleteConfirmWall.isLoadBearing
          }
          onConfirm={(id) => {
            deleteWall(id);
            setDeleteConfirmWall(null);
          }}
          onCancel={() => setDeleteConfirmWall(null)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-48 bg-slate-800 border-r border-slate-700 p-3 shrink-0 flex flex-col gap-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Tools
          </div>

          <FloorPlanToolbar
            activeTool={tool}
            onToolChange={setTool}
            onUndo={undo}
            onRedo={redo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            gridSnap={gridSnap}
            onToggleGridSnap={toggleGridSnap}
            onReset={reset}
          />

          <div className="border-t border-slate-700 my-2" />

          {/* Legend */}
          <div className="space-y-1.5 text-xs">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Legend
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500/40 border border-red-500" />
              <span className="text-slate-400">External (20cm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-orange-500/40 border border-orange-500" />
              <span className="text-slate-400">Load Bearing (15cm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gray-400/40 border border-gray-400" />
              <span className="text-slate-400">Internal (10cm)</span>
            </div>
          </div>

          <div className="border-t border-slate-700 my-2" />

          <div className="text-[10px] text-slate-500 space-y-1">
            <div>1 = Select</div>
            <div>2 = Draw</div>
            <div>3 = Delete</div>
            <div>Esc = Cancel</div>
            <div>Del = Delete selected</div>
            <div>Ctrl+Z = Undo</div>
            <div>Ctrl+Shift+Z = Redo</div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div ref={containerRef} className="flex-1 bg-slate-900 relative overflow-hidden">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleStageMouseDown}
            onTap={handleStageMouseDown}
          >
            <GridBackground width={stageSize.width} height={stageSize.height} />
            <Layer>
              {wallElements}
              {drawPreview}
              {drawHandles}
              {LengthTooltip}
              {roomLabels}
            </Layer>
          </Stage>

          {/* Bottom bar */}
          <div className="absolute bottom-3 left-3 right-3 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-2.5 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {tool === 'select' && selectedWall && (
                <span>
                  Selected: {(wallLength(selectedWall) * 100).toFixed(0)} cm wall
                  {selectedWall.isLoadBearing && (
                    <span className="text-amber-400 ml-2">(Load-bearing)</span>
                  )}
                  {selectedWall.wallType === 'external' && (
                    <span className="text-red-400 ml-2">(External)</span>
                  )}
                </span>
              )}
              {tool === 'select' && !selectedWall && (
                <span>Click a wall to select it</span>
              )}
              {tool === 'draw' && !isDrawing && (
                <span>Click to start drawing a wall</span>
              )}
              {tool === 'draw' && isDrawing && (
                <span>Click again to place wall segment. Press Esc to cancel.</span>
              )}
              {tool === 'delete' && (
                <span>Click a wall to delete it (external/load-bearing walls are protected)</span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span>🏠 Rooms: {rooms.length}</span>
              <span>🧱 Walls: {walls.length}</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Properties + Preview */}
        <div className="w-72 bg-slate-800 border-l border-slate-700 shrink-0 flex flex-col overflow-y-auto">
          {/* Properties */}
          <div className="p-3 border-b border-slate-700">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Properties
            </div>
            {selectedWall ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Length</span>
                  <span className="text-slate-200 font-medium">
                    {(wallLength(selectedWall) * 100).toFixed(0)} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thickness</span>
                  <span className="text-slate-200 font-medium">
                    {(selectedWall.thickness * 100).toFixed(0)} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Height</span>
                  <span className="text-slate-200 font-medium">
                    {selectedWall.height.toFixed(1)} m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-200 font-medium capitalize">
                    {selectedWall.wallType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Load Bearing</span>
                  <span className="text-slate-200 font-medium">
                    {selectedWall.isLoadBearing ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Coordinates</span>
                  <span className="text-slate-200 font-medium text-[10px]">
                    ({selectedWall.startX.toFixed(2)}, {selectedWall.startY.toFixed(2)}) → ({selectedWall.endX.toFixed(2)}, {selectedWall.endY.toFixed(2)})
                  </span>
                </div>
                {selectedWall.isLoadBearing && (
                  <div className="mt-2">
                    <StructuralWallOverlay />
                  </div>
                )}

                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Actions
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const w = selectedWall;
                        if (w.wallType !== 'external' && !w.isLoadBearing) {
                          handleDeleteWall(selectedWall.id);
                        } else {
                          setDeleteConfirmWall(selectedWall);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-red-600/20 text-red-300 border border-red-800/40 rounded hover:bg-red-600/30 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-4">
                Select a wall to see properties
              </div>
            )}
          </div>

          {/* Rooms list */}
          <div className="p-3 border-b border-slate-700">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🏠</span>
              <span>Rooms ({rooms.length})</span>
            </div>
            {rooms.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">
                Draw walls to auto-detect rooms
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between text-xs px-2 py-1 bg-slate-700/30 rounded"
                  >
                    <span className="text-slate-300">{room.label}</span>
                    <span className="text-slate-500">{room.area.toFixed(1)} m²</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="p-3 flex-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Live 3D Preview
            </div>
            <LivePreview3D />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-3 flex items-center justify-between">
        <Link href={`/studio/${projectId}?useDefault=true`}>
          <Button variant="ghost" size="sm" className="text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Use Default Layout — Skip
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 mr-2">All changes saved locally</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/studio/${projectId}?useDefault=true`)}
          >
            Skip
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-teal-600 hover:bg-teal-500"
            onClick={() => router.push(`/studio/${projectId}`)}
          >
            Apply Changes — Start Designing
          </Button>
        </div>
      </div>
    </div>
  );
}
