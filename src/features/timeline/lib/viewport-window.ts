import { CARD_HEIGHT, CARD_WIDTH, GAP_X, GAP_Y } from "./layout";

export interface ViewportLike {
  x: number;
  y: number;
  scale: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const OVERSCAN_X = CARD_WIDTH + GAP_X;
const OVERSCAN_Y = CARD_HEIGHT + GAP_Y;

export function visibleBoardRect(
  viewport: ViewportLike,
  container: Size,
): BoardRect {
  const scale = viewport.scale || 1;

  return {
    left: -viewport.x / scale - OVERSCAN_X,
    top: -viewport.y / scale - OVERSCAN_Y,
    right: (-viewport.x + container.width) / scale + OVERSCAN_X,
    bottom: (-viewport.y + container.height) / scale + OVERSCAN_Y,
  };
}

export function intersects(rect: BoardRect, box: Box): boolean {
  return (
    box.x < rect.right &&
    box.x + box.width > rect.left &&
    box.y < rect.bottom &&
    box.y + box.height > rect.top
  );
}
