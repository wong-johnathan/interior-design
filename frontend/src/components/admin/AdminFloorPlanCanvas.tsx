'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Text, Group, Rect } from 'react-konva';
import {
  useFloorPlanStore,
  WallSegment,
  DetectedRoom,
  snapPoint,
  nextWallId,
} from '@/stores/floorPlanStore';
import {
  MousePointer2,
  Pencil,
  Trash2,
  Undo2,
  Redo2,
  Grid3X3,
  RotateCcw,
  Home,
} from 'lucide-react';

// ── Constants ──
const PIXELS_PER_METER = 50;
const GRID_PX = 10;
const SNAP_DISTANCE = 10;
const WALL_HANDLE_RADIUS = 4;

function metersToPx(m: number): number {
  return m * PIXELS_PER_METER;
}
function pxToMeters(px: number): number {
  return px / PIXELS_PER_METER;
}
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
function wallLength(wall: WallSegment): number {
  return distance(wall.startX, wall.startY, wall.endX, wall.endY);
}
function wallCenter(wall: WallSegment): { x: number; y: number } {
  return {
    x: (wall.startX + wall.endX) / 2,
    y: (wall.startY + wall.endY) / 2,
  };
}

function getWallColor(wall: WallSegment): string {
  return wall.wallType === 'external'
    ? '#ef4444'
    : wall.isLoadBearing
    ? '#f97316'
    : '#9ca3af';
}
function getWallThicknessPx(wall: WallSegment): number {
  if (wall.wallType === 'external') return metersToPx(0.2);
  if (wall.isLoadBearing) return metersToPx(0.15);
  return metersToPx(0.1);
}

// ── Room detection (same algorithm as FloorPlanEditor) ──
const DEFAULT_ROOM_NAMES = [
  'Living Room', 'MBR', 'Bedroom 2', 'Bedroom 3', 'Kitchen',
  'Dining Room', 'Bathroom 1', 'Bathroom 2', 'Utility Room',
  'Study', 'Hallway', 'Store Room', 'Balcony',
];

function detectRooms(walls: WallSegment[]): DetectedRoom[] {
  if (walls.length < 3) return [];

  const adj = new Map<string, { nx: number; ny: number; wallId: string }[]>();

  function addEdge(x1: number, y1: number, x2: number, y2: number, wallId: string) {
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

  const rooms: DetectedRoom[] = [];
  let roomCounter = 0;

  for (const comp of components) {
    const edgeMap = new Map<string, { nx: number; ny: number; wallId: string }[]>();
    for (const k of comp) {
      const neighbors = (adj.get(k) || []).filter((n) => comp.includes(`${n.nx},${n.ny}`));
      edgeMap.set(k, [...neighbors]);
    }

    function kToXY(k: string): [number, number] {
      const [xs, ys] = k.split(',');
      return [parseFloat(xs), parseFloat(ys)];
    }

    for (const [key, neighbors] of edgeMap) {
      const [kx, ky] = kToXY(key);
      neighbors.sort((a, b) => {
        const angleA = Math.atan2(a.ny - ky, a.nx - kx);
        const angleB = Math.atan2(b.ny - ky, b.nx - kx);
        return angleA - angleB;
      });
    }

    const usedEdges = new Set<string>();
    const cycles: { x: number; y: number }[][] = [];

    for (const startKey of comp) {
      const neighbors = edgeMap.get(startKey) || [];
      for (const startN of neighbors) {
        const edgeKey = `${startKey}->${startN.nx},${startN.ny}`;
        if (usedEdges.has(edgeKey)) continue;

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

          prevKey = currentKey;
          currentKey = `${currentN.nx},${currentN.ny}`;

          const currentNeighbors = edgeMap.get(currentKey) || [];
          const prevIdx = currentNeighbors.findIndex(
            (n) => `${n.nx},${n.ny}` === prevKey
          );

          const nextIdx =
            prevIdx >= 0
              ? (prevIdx - 1 + currentNeighbors.length) % currentNeighbors.length
              : 0;

          const nextN = currentNeighbors[nextIdx];
          if (!nextN) break;
          currentN = nextN;

          if (
            `${currentN.nx},${currentN.ny}` === startKey &&
            currentKey === `${startN.nx},${startN.ny}`
          ) {
            face.push({ x: currentN.nx, y: currentN.ny });
            break;
          }
        }

        if (face.length >= 3) {
          let area = 0;
          for (let i = 0; i < face.length; i++) {
            const j = (i + 1) % face.length;
            area += face[i].x * face[j].y;
            area -= face[j].x * face[i].y;
          }
          area = Math.abs(area) / 2;
          // Convert from pixel² to m²
          area = area / (PIXELS_PER_METER * PIXELS_PER_METER);
          if (area > 0.001) {
            cycles.push(face);
          }
        }
      }
    }

    cycles.sort((a, b) => {
      let areaA = 0, areaB = 0;
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

    const innerCycles = cycles.slice(1);

    for (const face of innerCycles) {
      let cx = 0, cy = 0;
      for (const p of face) { cx += p.x; cy += p.y; }
      cx /= face.length;
      cy /= face.length;

      let area = 0;
      for (let i = 0; i < face.length; i++) {
        const j = (i + 1) % face.length;
        area += face[i].x * face[j].y - face[j].x * face[i].y;
      }
      area = Math.abs(area) / 2;
      area = area / (PIXELS_PER_METER * PIXELS_PER_METER);

      const label = DEFAULT_ROOM_NAMES[roomCounter % DEFAULT_ROOM_NAMES.length];
      rooms.push({
        id: `room_${roomCounter}`,
        label,
        vertices: face,
        area,
      });
      roomCounter++;
    }
  }

  rooms.sort((a, b) => b.area - a.area);
  rooms.forEach((room, i) => {
    room.label = DEFAULT_ROOM_NAMES[i % DEFAULT_ROOM_NAMES.length];
  });

  return rooms;
}

// ── Grid Background ──
function GridBackground({ width, height }: { width: number; height: number }) {
  const lines: React.ReactNode[] = [];
  for (let x = 0; x <= width; x += GRID_PX) {
    lines.push(
      <Line key={`v${x}`} points={[x, 0, x, height]} stroke="#334155" strokeWidth={0.5} />
    );
  }
  for (let y = 0; y <= height; y += GRID_PX) {
    lines.push(
      <Line key={`h${y}`} points={[0, y, width, y]} stroke="#334155" strokeWidth={0.5} />
    );
  }
  return <Layer listening={false}>{lines}</Layer>;
}

// ── Props ──
export interface AdminFloorPlanCanvasProps {
  onRoomsDetected?: (rooms: DetectedRoom[]) => void;
}

// ── Component ──
export function AdminFloorPlanCanvas({ onRoomsDetected }: AdminFloorPlanCanvasProps) {
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
  } = useFloorPlanStore();

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 600, height: 400 });
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredWallLength, setHoveredWallLength] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Resize
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

  // Auto-detect rooms when walls change
  useEffect(() => {
    const detected = detectRooms(walls);
    setRooms(detected);
    if (onRoomsDetected) {
      onRoomsDetected(detected);
    }
  }, [walls, setRooms, onRoomsDetected]);

  // Pointer position
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

  // Canvas click
  const handleCanvasClick = useCallback(() => {
    if (tool !== 'draw') return;
    const pos = getStagePointer();

    // Snap to existing endpoint
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
      setDrawPoints([{ x: finalPos.x, y: finalPos.y }]);
      setIsDrawing(true);
    } else {
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

      if (wallLength(newWall) > 0.01) {
        addWall(newWall);
      }

      setDrawPoints([{ x: finalPos.x, y: finalPos.y }]);
    }
  }, [tool, isDrawing, drawPoints, walls, getStagePointer, addWall]);

  // Stage mouse down
  const handleStageMouseDown = useCallback(
    (e: any) => {
      if (tool === 'draw') {
        handleCanvasClick();
        return;
      }
      if (e.target !== e.target.getStage()) return;
      if (tool === 'select') selectWall(null);
    },
    [tool, handleCanvasClick, selectWall]
  );

  // Wall click
  const handleWallClick = useCallback(
    (wall: WallSegment) => {
      if (tool === 'select') selectWall(wall.id);
      else if (tool === 'delete') deleteWall(wall.id);
    },
    [tool, selectWall, deleteWall]
  );

  // Wall hover
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

  // Wall dimensions for rendering
  const getWallDimensions = useCallback(
    (wall: WallSegment) => {
      const dx = wall.endX - wall.startX;
      const dy = wall.endY - wall.startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return null;
      const ux = dx / len;
      const uy = dy / len;
      const px = -uy;
      const py = ux;
      const halfThick = getWallThicknessPx(wall) / 2;
      const sx = metersToPx(wall.startX);
      const sy = metersToPx(wall.startY);
      const ex = metersToPx(wall.endX);
      const ey = metersToPx(wall.endY);
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
    },
    [selectedWallId, hoveredWallId]
  );

  // Wall elements
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
        fill={strokeColor + '40'}
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

  // Draw preview
  const drawPreview =
    isDrawing && drawPoints.length > 0 ? (
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

  // Draw handles
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

  // Length tooltip
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

  // Room labels
  const roomLabels = rooms.map((room) => {
    let cx = 0,
      cy = 0;
    for (const v of room.vertices) {
      cx += v.x;
      cy += v.y;
    }
    cx = metersToPx(cx / room.vertices.length);
    cy = metersToPx(cy / room.vertices.length);
    const areaM2 = room.area.toFixed(1);
    return (
      <Group key={room.id}>
        <Text
          x={cx}
          y={cy - 12}
          text={room.label}
          fontSize={12}
          fill="#94a3b8"
          fontStyle="bold"
          align="center"
          width={140}
          offsetX={70}
        />
        <Text
          x={cx}
          y={cy + 4}
          text={`${areaM2} m²`}
          fontSize={9}
          fill="#64748b"
          align="center"
          width={140}
          offsetX={70}
        />
      </Group>
    );
  });

  // Tool button class
  const toolBtnClass = (t: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition ${
      tool === t
        ? 'bg-amber-600/20 text-amber-700 border-amber-300 font-medium'
        : 'text-slate-600 border-slate-200 hover:bg-slate-50'
    }`;

  const actionBtnClass = (active: boolean) =>
    `flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition ${
      active
        ? 'bg-emerald-600/20 text-emerald-700 border-emerald-300 font-medium'
        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
    }`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button onClick={() => setTool('select')} className={toolBtnClass('select')}>
          <MousePointer2 className="w-3.5 h-3.5" /> Select
        </button>
        <button onClick={() => setTool('draw')} className={toolBtnClass('draw')}>
          <Pencil className="w-3.5 h-3.5" /> Draw
        </button>
        <button onClick={() => setTool('delete')} className={toolBtnClass('delete')}>
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <button onClick={undo} disabled={historyIndex <= 0} className={actionBtnClass(false) + ' disabled:opacity-40'}>
          <Undo2 className="w-3 h-3" /> Undo
        </button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} className={actionBtnClass(false) + ' disabled:opacity-40'}>
          <Redo2 className="w-3 h-3" /> Redo
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <button onClick={toggleGridSnap} className={actionBtnClass(gridSnap)}>
          <Grid3X3 className="w-3 h-3" /> Snap
        </button>
        <button onClick={reset} className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          <span>🏠 Rooms: {rooms.length}</span>
          <span>🧱 Walls: {walls.length}</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden"
        style={{ height: 400 }}
      >
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
      </div>

      {/* Legend + status */}
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-red-500 inline-block" /> External
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-orange-500 inline-block" /> Load Bearing
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-gray-400 inline-block" /> Internal
          </span>
        </div>
        <span className="text-slate-500">
          {tool === 'draw' && !isDrawing && 'Click to start drawing'}
          {tool === 'draw' && isDrawing && 'Click to place wall. Esc to cancel.'}
          {tool === 'select' && (selectedWallId ? 'Wall selected' : 'Click a wall')}
          {tool === 'delete' && 'Click a wall to delete'}
        </span>
      </div>

      {/* Room list if detected */}
      {rooms.length > 0 && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
            <Home className="w-3.5 h-3.5" /> Detected Rooms ({rooms.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-white rounded border border-slate-100"
              >
                <span className="text-slate-700 font-medium">{room.label}</span>
                <span className="text-slate-400 ml-2">{room.area.toFixed(1)} m²</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
