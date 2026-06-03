/**
 * Captures the current state of a Three.js canvas as a data URL.
 * Works with any HTMLCanvasElement.
 */
export async function captureViewport(canvas: HTMLCanvasElement): Promise<string> {
  // Force a render to ensure the latest frame is captured
  return canvas.toDataURL('image/png');
}

/**
 * Finds the Three.js canvas element from a container element.
 * This walks through child elements to find the canvas rendered by @react-three/fiber.
 */
export function findViewportCanvas(container: HTMLElement | null): HTMLCanvasElement | null {
  if (!container) return null;
  // @react-three/fiber renders a single <canvas> inside the container div
  return container.querySelector('canvas');
}
