'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Text,
  Grid,
} from '@react-three/drei';
import * as THREE from 'three';
import type { WallSegment, RoomLabel } from '@/lib/defaultRoomData';

// ── Props ──────────────────────────────────────────────────────────

export interface ThreeDViewportProps {
  wallSegments: WallSegment[];
  roomLabels?: RoomLabel[];
  activeRoom?: string | null;
  className?: string;
}

// ── Colour map ─────────────────────────────────────────────────────

const WALL_COLORS: Record<WallSegment['type'], string> = {
  external: '#c0392b',
  loadBearing: '#e67e22',
  internal: '#95a5a6',
};

const WALL_HIGHLIGHT_COLOR = '#f1c40f';

// ── Single wall as a 3D box ───────────────────────────────────────

interface WallMeshProps {
  wall: WallSegment;
  isHighlighted: boolean;
}

function WallMesh({ wall, isHighlighted }: WallMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { position, rotationY, scaleZ } = useMemo(() => {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const midX = (wall.x1 + wall.x2) / 2;
    const midY = (wall.y1 + wall.y2) / 2;
    const angle = Math.atan2(dx, dy); // rotation around Y axis

    return {
      position: [midX, 1.4, midY] as [number, number, number],
      rotationY: angle,
      scaleZ: length,
    };
  }, [wall]);

  const baseColor = WALL_COLORS[wall.type];
  const color = isHighlighted ? WALL_HIGHLIGHT_COLOR : baseColor;

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[0, -rotationY, 0]}
    >
      {/* Box: width = wall thickness, height = 2.8m, depth = wall length */}
      <boxGeometry args={[wall.thickness, 2.8, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={isHighlighted ? 0.3 : 0.7}
        metalness={0.1}
        emissive={isHighlighted ? WALL_HIGHLIGHT_COLOR : '#000000'}
        emissiveIntensity={isHighlighted ? 0.15 : 0}
      />
    </mesh>
  );
}

// ── Floor plane ────────────────────────────────────────────────────

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, -0.01, 5]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial
        color="#e2e8f0"
        transparent
        opacity={0.15}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

// ── Room label ─────────────────────────────────────────────────────

interface RoomLabelMeshProps {
  label: RoomLabel;
  isActive: boolean;
}

function RoomLabelMesh({ label, isActive }: RoomLabelMeshProps) {
  return (
    <Text
      position={[label.x, 0.05, label.y]}
      fontSize={0.35}
      color={isActive ? '#f1c40f' : '#94a3b8'}
      anchorX="center"
      anchorY="middle"
      font={undefined}
      outlineWidth={0.02}
      outlineColor="#1e293b"
    >
      {label.label}
    </Text>
  );
}

// ── Scene content (wrapped in Suspense) ────────────────────────────

function SceneContent({
  wallSegments,
  roomLabels,
  activeRoom,
}: {
  wallSegments: WallSegment[];
  roomLabels: RoomLabel[];
  activeRoom: string | null;
}) {
  const walls = useMemo(
    () =>
      wallSegments.map((w, i) => {
        let highlighted = false;
        if (activeRoom && w.room === activeRoom) {
          highlighted = true;
        }
        return <WallMesh key={`wall-${i}`} wall={w} isHighlighted={highlighted} />;
      }),
    [wallSegments, activeRoom],
  );

  const labels = useMemo(
    () =>
      roomLabels.map((r, i) => (
        <RoomLabelMesh key={`label-${i}`} label={r} isActive={r.label.toLowerCase().includes(activeRoom?.toLowerCase() ?? '')} />
      )),
    [roomLabels, activeRoom],
  );

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.3}
        color="#b0c4de"
      />

      {/* Floor */}
      <Floor />

      {/* Grid */}
      <Grid
        position={[5, 0, 5]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#475569"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#64748b"
        fadeDistance={25}
        infiniteGrid={false}
      />

      {/* Walls */}
      {walls}

      {/* Room labels */}
      {labels}

      {/* Controls */}
      <OrbitControls
        makeDefault
        target={[5, 0, 5]}
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping
        dampingFactor={0.1}
      />
    </>
  );
}

// ── Main exported component ───────────────────────────────────────

export default function ThreeDViewport({
  wallSegments,
  roomLabels = [],
  activeRoom = null,
  className = '',
}: ThreeDViewportProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows
        camera={{ position: [8, 10, 8], fov: 50, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1e293b' }}
      >
        <Suspense fallback={null}>
          <SceneContent
            wallSegments={wallSegments}
            roomLabels={roomLabels}
            activeRoom={activeRoom}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
