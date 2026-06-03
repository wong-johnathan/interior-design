'use client';

import dynamic from 'next/dynamic';

const FloorPlanEditor = dynamic(
  () => import('@/components/editor/FloorPlanEditor').then((mod) => ({ default: mod.FloorPlanEditor })),
  { ssr: false }
);

export default function EditFloorPlanPage() {
  return <FloorPlanEditor />;
}
