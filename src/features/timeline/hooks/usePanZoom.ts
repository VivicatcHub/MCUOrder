import { useCallback, useEffect, useRef, useState } from "react";

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 2;

const TAP_SLOP = 8;

const clampScale = (scale: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

interface Point {
  x: number;
  y: number;
}

interface Gesture {
  origin: Point;
  viewport: Viewport;
  spread: number;
  rect: DOMRect;
}

const midpointOf = (points: Point[]): Point => ({
  x: (points[0].x + points[1].x) / 2,
  y: (points[0].y + points[1].y) / 2,
});

const spreadOf = (points: Point[]) =>
  Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);

export function usePanZoom(containerRef: React.RefObject<HTMLElement | null>) {
  const [viewport, setViewportState] = useState<Viewport>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isPanning, setIsPanning] = useState(false);

  const viewportRef = useRef(viewport);
  const setViewport = useCallback(
    (next: Viewport | ((current: Viewport) => Viewport)) => {
      const value =
        typeof next === "function" ? next(viewportRef.current) : next;
      viewportRef.current = value;
      setViewportState(value);
    },
    [],
  );

  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const travelled = useRef(false);
  const swallowClick = useRef(false);

  const zoomAt = useCallback(
    (factor: number, originX: number, originY: number) => {
      setViewport((current) => {
        const scale = clampScale(current.scale * factor);
        const ratio = scale / current.scale;
        return {
          scale,
          x: originX - (originX - current.x) * ratio,
          y: originY - (originY - current.y) * ratio,
        };
      });
    },
    [setViewport],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      zoomAt(factor, (rect?.width ?? 0) / 2, (rect?.height ?? 0) / 2);
    },
    [containerRef, zoomAt],
  );

  const reset = useCallback(
    (next: Viewport) => setViewport(next),
    [setViewport],
  );

  const beginGesture = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const active = [...pointers.current.values()].slice(0, 2);
    if (active.length === 0) {
      gesture.current = null;
      return;
    }
    const local = active.map((point) => ({
      x: point.x - rect.left,
      y: point.y - rect.top,
    }));
    gesture.current = {
      rect,
      viewport: viewportRef.current,
      origin: local.length === 2 ? midpointOf(local) : local[0],
      spread: local.length === 2 ? spreadOf(local) : 0,
    };
  }, [containerRef]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      swallowClick.current = false;

      const target = event.target as HTMLElement;
      const touch = event.pointerType !== "mouse";
      if (!touch && event.button !== 0) return;

      if (
        target.closest("[data-no-pan]") &&
        !(touch && target.closest("[data-touch-pan]"))
      )
        return;

      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      travelled.current = false;
      if (!touch) event.currentTarget.setPointerCapture(event.pointerId);
      beginGesture();
      setIsPanning(true);
    },
    [beginGesture],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const active = gesture.current;
      if (!active) return;

      const local = [...pointers.current.values()].slice(0, 2).map((point) => ({
        x: point.x - active.rect.left,
        y: point.y - active.rect.top,
      }));
      const current = local.length === 2 ? midpointOf(local) : local[0];

      if (
        Math.hypot(current.x - active.origin.x, current.y - active.origin.y) >
        TAP_SLOP
      ) {
        travelled.current = true;
      }

      if (active.spread > 0 && local.length === 2) {
        const scale = clampScale(
          active.viewport.scale * (spreadOf(local) / active.spread),
        );
        const ratio = scale / active.viewport.scale;
        setViewport({
          scale,

          x: current.x - (active.origin.x - active.viewport.x) * ratio,
          y: current.y - (active.origin.y - active.viewport.y) * ratio,
        });
        return;
      }

      setViewport({
        scale: active.viewport.scale,
        x: active.viewport.x + (current.x - active.origin.x),
        y: active.viewport.y + (current.y - active.origin.y),
      });
    },
    [setViewport],
  );

  const releasePointer = useCallback(
    (event: React.PointerEvent) => {
      if (!pointers.current.delete(event.pointerId)) return;
      if (pointers.current.size > 0) {
        beginGesture();
        return;
      }
      gesture.current = null;
      setIsPanning(false);
      swallowClick.current = travelled.current;
    },
    [beginGesture],
  );

  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = container.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        zoomAt(
          Math.exp(-event.deltaY / 260),
          event.clientX - rect.left,
          event.clientY - rect.top,
        );
      } else {
        setViewport((current) => ({
          ...current,
          x: current.x - event.deltaX,
          y: current.y - event.deltaY,
        }));
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [containerRef, setViewport, zoomAt]);

  return {
    viewport,
    isPanning,
    zoomBy,
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: releasePointer,
      onPointerCancel: releasePointer,
      onClickCapture,
    },
  };
}
