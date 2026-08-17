"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TILE_TRANSITION_MS = 520;
const HOVER_DELAY_MS = 80;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function smoothScrollTo(
  track: HTMLElement,
  targetLeft: number,
  duration = TILE_TRANSITION_MS,
  animRef?: { current: number },
): void {
  const start = track.scrollLeft;
  const change = targetLeft - start;
  if (Math.abs(change) < 6) return;

  if (animRef) cancelAnimationFrame(animRef.current);

  const startTime = performance.now();

  function step(now: number) {
    const progress = Math.min((now - startTime) / duration, 1);
    track.scrollLeft = start + change * easeOutCubic(progress);
    if (progress < 1 && animRef) {
      animRef.current = requestAnimationFrame(step);
    }
  }

  if (animRef) {
    animRef.current = requestAnimationFrame(step);
  }
}

function scrollTileToCenter(
  track: HTMLElement,
  tile: HTMLElement,
  duration = TILE_TRANSITION_MS,
  animRef?: { current: number },
): void {
  const trackRect = track.getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();
  const target =
    track.scrollLeft +
    (tileRect.left - trackRect.left) -
    (trackRect.width - tileRect.width) / 2;
  const maxScroll = track.scrollWidth - track.clientWidth;
  smoothScrollTo(
    track,
    Math.max(0, Math.min(target, maxScroll)),
    duration,
    animRef,
  );
}

function isTileMostlyVisible(track: HTMLElement, tile: HTMLElement): boolean {
  const trackRect = track.getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();
  const padding = 24;
  return (
    tileRect.left >= trackRect.left + padding &&
    tileRect.right <= trackRect.right - padding
  );
}

type UseNetflixRowSelectionOptions<T> = {
  items: T[];
  /** -1 = nothing selected until hover/focus (default). */
  defaultIndex?: number;
  onSelect?: (item: T) => void;
  onDeselect?: () => void;
  /** When false, hover does not expand the tile (touch devices). */
  enableHoverSelect?: boolean;
};

export function useNetflixRowSelection<T>({
  items,
  defaultIndex = -1,
  onSelect,
  onDeselect,
  enableHoverSelect = true,
}: UseNetflixRowSelectionOptions<T>) {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollAnimRef = useRef(0);

  const clearSelection = useCallback(() => {
    if (selectedIndex === -1) return;
    setSelectedIndex(-1);
    onDeselect?.();
  }, [onDeselect, selectedIndex]);

  const selectIndex = useCallback(
    (index: number, options?: { immediate?: boolean }) => {
      if (index < 0 || index >= items.length || index === selectedIndex) return;

      setSelectedIndex(index);
      onSelect?.(items[index]);

      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(
        () => {
          const track = trackRef.current;
          const tile = itemRefs.current[index];
          if (!track || !tile) return;
          if (!isTileMostlyVisible(track, tile)) {
            scrollTileToCenter(track, tile, TILE_TRANSITION_MS, scrollAnimRef);
          }
        },
        options?.immediate ? 0 : 40,
      );
    },
    [items, onSelect, selectedIndex],
  );

  const cancelHover = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const selectOnHover = useCallback(
    (index: number) => {
      if (!enableHoverSelect) return;
      if (index === selectedIndex) return;
      cancelHover();
      hoverTimerRef.current = setTimeout(
        () => selectIndex(index),
        HOVER_DELAY_MS,
      );
    },
    [cancelHover, enableHoverSelect, selectIndex, selectedIndex],
  );

  const handleTrackMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const next = e.relatedTarget;
      if (next instanceof Node && e.currentTarget.contains(next)) return;
      cancelHover();
      clearSelection();
    },
    [cancelHover, clearSelection],
  );

  const handleTileMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      const next = e.relatedTarget;
      if (track && next instanceof Node && track.contains(next)) return;
      cancelHover();
    },
    [cancelHover],
  );

  useEffect(() => {
    function onHidden() {
      if (document.visibilityState === "hidden") clearSelection();
    }
    function onBlur() {
      clearSelection();
    }
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", onBlur);
    };
  }, [clearSelection]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      cancelAnimationFrame(scrollAnimRef.current);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function onKeyDown(e: KeyboardEvent) {
      if (!track?.contains(document.activeElement)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next =
          selectedIndex < 0
            ? 0
            : Math.min(selectedIndex + 1, items.length - 1);
        selectIndex(next, { immediate: true });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const next =
          selectedIndex < 0
            ? 0
            : Math.max(selectedIndex - 1, 0);
        selectIndex(next, { immediate: true });
      } else if (e.key === "Home") {
        e.preventDefault();
        selectIndex(0, { immediate: true });
      } else if (e.key === "End") {
        e.preventDefault();
        selectIndex(items.length - 1, { immediate: true });
      } else if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSelection, items.length, selectIndex, selectedIndex]);

  return {
    selectedIndex,
    selectIndex,
    selectOnHover,
    cancelHover,
    clearSelection,
    handleTrackMouseLeave,
    handleTileMouseLeave,
    trackRef,
    itemRefs,
  };
}
